# src/ml/popularity_recommender.py
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from datetime import datetime
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class PopularityRecommender:
    def __init__(self):
        self.recommendations = None
        self.products_df = None
        self.tfidf_matrix = None
        self.feature_names = None
        
    def fit(self, conn):
        """Train model với data từ DB"""
        try:
            # Query tối ưu hơn
            query = """
                SELECT 
                    p.id as product_id,
                    p.name,
                    p.image_url,
                    p.description,
                    p.created_at,
                    b.name as brand_name,
                    c.name as category_name,
                    COALESCE(r.review_count, 0) as review_count,
                    COALESCE(r.avg_rating, 0) as avg_rating,
                    COALESCE(o.order_count, 0) as order_count,
                    COALESCE(pv.total_sold, 0) as sold_count,
                    COALESCE(pv.min_price, 0) as min_price,
                    COALESCE(pv.max_price, 0) as max_price
                FROM products p
                LEFT JOIN brands b ON p.brand_id = b.id 
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN (
                    SELECT 
                        product_id,
                        COUNT(id) as review_count,
                        AVG(rating) as avg_rating
                    FROM reviews 
                    GROUP BY product_id
                ) r ON p.id = r.product_id
                LEFT JOIN (
                    SELECT 
                        product_id,
                        COUNT(DISTINCT o.id) as order_count
                    FROM orderitems oi
                    JOIN orders o ON oi.order_id = o.id
                    GROUP BY product_id
                ) o ON p.id = o.product_id
                LEFT JOIN (
                    SELECT 
                        product_id,
                        SUM(sold_count) as total_sold,
                        MIN(price) as min_price,
                        MAX(price) as max_price
                    FROM productvariants
                    GROUP BY product_id
                ) pv ON p.id = pv.product_id
            """
            
            products_df = pd.read_sql(query, conn)
            
            # Xử lý dữ liệu
            products_df = self._preprocess_data(products_df)
            products_df = self._calculate_enhanced_popularity(products_df)
            self._create_content_features(products_df)
            
            # Lưu recommendations
            self.recommendations = products_df.sort_values('popularity_score', ascending=False)
            
            print(f"Trained successfully with {len(products_df)} products")
            return True
            
        except Exception as e:
            print(f"Error during training: {str(e)}")
            return False

    def _preprocess_data(self, df):
        """Xử lý và chuẩn hóa dữ liệu"""
        # Xử lý missing values
        df['review_count'] = df['review_count'].fillna(0)
        df['avg_rating'] = df['avg_rating'].fillna(0)
        df['order_count'] = df['order_count'].fillna(0)
        df['sold_count'] = df['sold_count'].fillna(0)
        df['description'] = df['description'].fillna('')
        
        # Tính thời gian tồn tại của sản phẩm
        df['days_since_launch'] = (datetime.now() - pd.to_datetime(df['created_at'])).dt.days
        
        return df

    def _calculate_enhanced_popularity(self, df):
        """Tính điểm phổ biến với metrics hiện có"""
        scaler = MinMaxScaler()
        
        if len(df) > 0:
            # Chuẩn hóa các metrics hiện có
            metrics = ['review_count', 'avg_rating', 'order_count', 
                      'sold_count', 'days_since_launch']
            
            for metric in metrics:
                df[f'{metric}_score'] = scaler.fit_transform(df[[metric]])
            
            # Inverse cho days_since_launch (sản phẩm mới score cao hơn)
            df['recency_score'] = 1 - df['days_since_launch_score']
            
            # Tính popularity score với trọng số mới
            df['popularity_score'] = (
                0.3 * df['avg_rating_score'] +     # Đánh giá
                0.3 * df['sold_count_score'] +     # Doanh số
                0.2 * df['review_count_score'] +   # Số đánh giá
                0.1 * df['order_count_score'] +    # Số đơn hàng
                0.1 * df['recency_score']          # Độ mới
            )
            
        return df

    def _create_content_features(self, df):
        """Tạo đặc trưng từ nội dung sản phẩm"""
        # Kết hợp text features
        df['content'] = df['name'] + ' ' + df['description'] + ' ' + \
                       df['category_name'] + ' ' + df['brand_name']
                       
        # Tạo TF-IDF matrix
        tfidf = TfidfVectorizer(stop_words='english')
        self.tfidf_matrix = tfidf.fit_transform(df['content'])
        self.feature_names = tfidf.get_feature_names_out()

    def recommend(self, limit=8, category=None, min_price=None, max_price=None, brand=None):
        """Trả về sản phẩm phổ biến với lọc thông minh hơn"""
        if self.recommendations is None:
            return []
            
        filtered_df = self.recommendations.copy()
        
        # Áp dụng các bộ lọc cơ bản
        if category:
            filtered_df = filtered_df[filtered_df['category_name'] == category]
        if brand:
            filtered_df = filtered_df[filtered_df['brand_name'] == brand]
        if min_price:
            filtered_df = filtered_df[filtered_df['min_price'] >= float(min_price)]
        if max_price:
            filtered_df = filtered_df[filtered_df['min_price'] <= float(max_price)]

        # Đa dạng hóa kết quả
        filtered_df = self._diversify_results(filtered_df)
        
        # Thêm lý do gợi ý
        filtered_df['reason'] = filtered_df.apply(self._get_enhanced_reason, axis=1)
        
        return filtered_df.head(limit).to_dict('records')

    def _diversify_results(self, df, max_per_category=2):
        """Đa dạng hóa kết quả theo nhiều tiêu chí"""
        diverse_df = pd.DataFrame()
        
        # Đa dạng hóa theo danh mục
        for category in df['category_name'].unique():
            category_df = df[df['category_name'] == category]
            diverse_df = pd.concat([diverse_df, category_df.head(max_per_category)])
        
        return diverse_df.sort_values('popularity_score', ascending=False)

    def _get_enhanced_reason(self, row):
        """Tạo lý do gợi ý chi tiết hơn"""
        reasons = []
        
        # Đánh giá và reviews
        if row['avg_rating'] >= 4.5 and row['review_count'] > 10:
            reasons.append(f"Đánh giá xuất sắc ({row['avg_rating']:.1f}★)")
        elif row['avg_rating'] >= 4.0 and row['review_count'] > 5:
            reasons.append(f"Đánh giá tốt ({row['avg_rating']:.1f}★)")
        
        # Doanh số
        if row['sold_count'] > 1000:
            reasons.append(f"Bán chạy nhất ({row['sold_count']} đã bán)")
        elif row['sold_count'] > 500:
            reasons.append(f"Bán chạy ({row['sold_count']} đã bán)")
        
        # Độ mới
        if row['days_since_launch'] <= 30:
            reasons.append("Sản phẩm mới")
        
        if not reasons:
            reasons.append("Phổ biến trong danh mục")
            
        return " • ".join(reasons)

    def get_recommendations_data(self):
        """Get raw recommendations data for evaluation"""
        try:
            if self.recommendations is None:
                return []
                
            # Convert recommendations DataFrame to list of dicts
            recommendations = self.recommendations.to_dict('records')
            
            # Format data structure
            formatted_recs = []
            for rec in recommendations:
                formatted_rec = {
                    'product_id': rec['product_id'],
                    'name': rec['name'],
                    'brand_name': rec['brand_name'],
                    'category_name': rec['category_name'],
                    'image_url': rec['image_url'],
                    'min_price': rec['min_price'],
                    'max_price': rec['max_price'],
                    'metrics': {
                        'avg_rating': rec['avg_rating'],
                        'review_count': rec['review_count'],
                        'sold_count': rec['sold_count'],
                        'popularity_score': rec['popularity_score']
                    }
                }
                formatted_recs.append(formatted_rec)
                
            return formatted_recs
            
        except Exception as e:
            print(f"Error getting recommendations data: {str(e)}")
            return []
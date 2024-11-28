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
            # Chuẩn hóa các metrics
            metrics = ['review_count', 'avg_rating', 'sold_count', 'days_since_launch']
            for metric in metrics:
                df[f'{metric}_score'] = scaler.fit_transform(df[[metric]])
                
            # Inverse days_since_launch
            df['recency_score'] = 1 - df['days_since_launch_score']
            
            # Tính popularity với trọng số mới
            df['popularity_score'] = (
                0.40 * df['avg_rating_score'] +     # Tăng trọng số đánh giá
                0.25 * df['sold_count_score'] +     # Giữ nguyên doanh số
                0.20 * df['review_count_score'] +   # Tăng trọng số số lượng đánh giá
                0.15 * df['recency_score']          # Giảm trọng số độ mới
            )
        return df

    def _get_price_score(self, row):
        """Tính điểm giá dựa trên phân khúc"""
        category = row['category_name']
        price = row['min_price']
        
        # Định nghĩa phân khúc giá theo danh mục
        segments = {
            'Điện thoại': [(0, 5e6, 1), (5e6, 15e6, 0.8), (15e6, float('inf'), 0.6)],
            'Laptop văn phòng': [(0, 10e6, 1), (10e6, 20e6, 0.8), (20e6, float('inf'), 0.6)],
            'default': [(0, 2e6, 1), (2e6, 5e6, 0.8), (5e6, float('inf'), 0.6)]
        }
        
        # Lấy phân khúc phù hợp
        price_ranges = segments.get(category, segments['default'])
        
        # Tính điểm
        for min_price, max_price, score in price_ranges:
            if min_price <= price < max_price:
                return score
        return 0.5

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
        print(f"Getting recommendations with limit={limit}")
        
        if self.recommendations is None:
            print("No recommendations available")
            return []
        
        filtered_df = self.recommendations.copy()
        print(f"Total products before filtering: {len(filtered_df)}")
        
        # Áp dụng các bộ lọc
        if category:
            filtered_df = filtered_df[filtered_df['category_name'] == category]
        if brand:
            filtered_df = filtered_df[filtered_df['brand_name'] == brand]
        if min_price:
            filtered_df = filtered_df[filtered_df['min_price'] >= float(min_price)]
        if max_price:
            filtered_df = filtered_df[filtered_df['min_price'] <= float(max_price)]
        
        print(f"Products after filtering: {len(filtered_df)}")
        
        # Đa dạng hóa kết quả
        filtered_df = self._diversify_results(filtered_df)
        
        # Thêm lý do gợi ý
        filtered_df['reason'] = filtered_df.apply(self._get_enhanced_reason, axis=1)
        
        results = filtered_df.head(limit).to_dict('records')
        print(f"Returning {len(results)} recommendations")
        
        return results

    def _diversify_results(self, df, max_per_category=2, max_per_brand=2):
        """Đa dạng hóa kết quả theo danh mục, thương hiệu và phân khúc giá"""
        diverse_df = pd.DataFrame()
        
        # Định nghĩa phân khúc giá theo danh mục
        price_segments = {
            'Điện thoại': [
                (0, 5000000, 'Phổ thông'),
                (5000000, 15000000, 'Tầm trung'),
                (15000000, float('inf'), 'Cao cấp')
            ],
            'Laptop văn phòng': [
                (0, 10000000, 'Phổ thông'),
                (10000000, 20000000, 'Tầm trung'),
                (20000000, float('inf'), 'Cao cấp')
            ],
            'default': [
                (0, 2000000, 'Phổ thông'),
                (2000000, 5000000, 'Tầm trung'),
                (5000000, float('inf'), 'Cao cấp')
            ]
        }
        
        # Đa dạng hóa theo danh mục
        for category in df['category_name'].unique():
            category_df = df[df['category_name'] == category]
            
            # Lấy phân khúc giá phù hợp với danh mục
            segments = price_segments.get(category, price_segments['default'])
            
            # Đa dạng theo thương hiệu và phân khúc giá
            brand_diverse = pd.DataFrame()
            for brand in category_df['brand_name'].unique():
                brand_df = category_df[category_df['brand_name'] == brand]
                
                # Đảm bảo mỗi phân khúc giá có đại diện
                price_diverse = pd.DataFrame()
                for min_price, max_price, _ in segments:
                    price_df = brand_df[
                        (brand_df['min_price'] >= min_price) & 
                        (brand_df['min_price'] < max_price)
                    ].head(1)  # Lấy 1 SP mỗi phân khúc
                    
                    price_diverse = pd.concat([price_diverse, price_df])
                
                brand_diverse = pd.concat([
                    brand_diverse, 
                    price_diverse.head(max_per_brand)  # Giới hạn SP/thương hiệu
                ])
            
            diverse_df = pd.concat([
                diverse_df, 
                brand_diverse.head(max_per_category)  # Giới hạn SP/danh mục
            ])
        
        # Sắp xếp theo điểm phổ biến và đảm bảo đủ limit
        return diverse_df.sort_values(['popularity_score', 'avg_rating'], 
                                    ascending=[False, False])

    def _get_enhanced_reason(self, row):
        reasons = []
        
        # Format số lượng và rating
        def format_number(n):
            """Format số lượng gọn hơn"""
            if isinstance(n, float):
                n = int(n) if n.is_integer() else n  # Bỏ .0 nếu là số nguyên
                
            if n >= 1000:
                return f"{n/1000:.1f}k"
            return str(n)
        
        rating = round(row['avg_rating'], 1)  # Làm tròn 1 chữ số thập phân
        
        # 1. Rating và reviews - Ưu tiên cao nhất
        if rating >= 4.5 and row['review_count'] > 10:
            reasons.append(f"Đánh giá xuất sắc {rating}★ ({format_number(row['review_count'])} đánh giá)")
        elif rating >= 4.0 and row['review_count'] > 5:
            reasons.append(f"Đánh giá tốt {rating}★ ({format_number(row['review_count'])} đánh giá)")
        elif rating >= 3.5:
            reasons.append(f"{rating}★ ({format_number(row['review_count'])} đánh giá)")
        
        # 2. Doanh số - Chỉ hiện khi thực sự ấn tượng
        if row['sold_count'] >= 500:
            reasons.append(f"Best seller ({format_number(row['sold_count'])} đã bán)")
        elif row['sold_count'] >= 100:
            reasons.append(f"Bán chạy ({format_number(row['sold_count'])} đã bán)")
        
        # 3. Giá cả - So sánh với trung bình danh mục
        try:
            category_df = self.recommendations[
                self.recommendations['category_name'] == row['category_name']
            ]
            if len(category_df) >= 3:
                avg_price = category_df['min_price'].mean()
                min_price = category_df['min_price'].min()
                
                # Chỉ gắn tag khi thực sự rẻ hơn đáng kể
                if row['min_price'] <= min_price * 1.1:  # Trong khoảng 110% giá thấp nhất
                    reasons.append("Giá tốt nhất danh mục")
                elif row['min_price'] < avg_price * 0.7:  # Rẻ hơn 30% trung bình
                    reasons.append("Giá tốt")
        except:
            pass
        
        # Nếu không có lý do nào, thêm lý do mặc định
        if not reasons:
            if rating > 0:
                if row['review_count'] > 1:  # Chỉ hiện số lượng khi > 1
                    reasons.append(f"{rating}★ ({format_number(row['review_count'])} đánh giá)")
                else:
                    reasons.append(f"{rating}★")
            if row['sold_count'] >= 50:  # Chỉ hiện khi đạt ngưỡng tối thiểu
                reasons.append(f"{format_number(row['sold_count'])} đã bán")
        
        return " • ".join(reasons[:2])

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
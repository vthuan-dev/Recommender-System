# src/ml/popularity_recommender.py
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from datetime import datetime

class PopularityRecommender:
    def __init__(self):
        self.recommendations = None
        self.products_df = None
        
    def fit(self, conn):
        """Train model với data từ DB"""
        try:
            # 1. Sửa lại query
            query = """
                SELECT 
                    p.id as product_id,
                    p.name,
                    p.image_url,
                    b.name as brand_name,
                    c.name as category_name,
                    COUNT(DISTINCT r.id) as review_count,
                    AVG(r.rating) as avg_rating,
                    COUNT(DISTINCT o.id) as order_count,
                    SUM(pv.sold_count) as sold_count,
                    MIN(pv.price) as min_price,
                    MAX(pv.price) as max_price
                FROM products p
                LEFT JOIN brands b ON p.brand_id = b.id
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN reviews r ON p.id = r.product_id
                LEFT JOIN productvariants pv ON p.id = pv.product_id
                LEFT JOIN orderitems oi ON p.id = oi.product_id
                LEFT JOIN orders o ON oi.order_id = o.id
                GROUP BY 
                    p.id, 
                    p.name, 
                    p.image_url, 
                    b.name, 
                    c.name
                HAVING 
                    COUNT(DISTINCT r.id) > 0 
                    OR COUNT(DISTINCT o.id) > 0 
                    OR SUM(pv.sold_count) > 0
            """
            
            products_df = pd.read_sql(query, conn)
            
            # 2. Kiểm tra dữ liệu
            print(f"Loaded {len(products_df)} products")
            print("Columns:", products_df.columns.tolist())
            
            # 3. Xử lý missing values
            products_df['review_count'] = products_df['review_count'].fillna(0)
            products_df['avg_rating'] = products_df['avg_rating'].fillna(0)
            products_df['order_count'] = products_df['order_count'].fillna(0)
            products_df['sold_count'] = products_df['sold_count'].fillna(0)
            
            # 4. Tính popularity score
            scaler = MinMaxScaler()
            
            # Chuẩn hóa các metrics nếu có dữ liệu
            if len(products_df) > 0:
                products_df['review_score'] = scaler.fit_transform(products_df[['review_count']])
                products_df['rating_score'] = scaler.fit_transform(products_df[['avg_rating']])
                products_df['order_score'] = scaler.fit_transform(products_df[['order_count']])
                products_df['sales_score'] = scaler.fit_transform(products_df[['sold_count']])
                
                # Tính tổng popularity score
                products_df['popularity_score'] = (
                    0.3 * products_df['rating_score'] +
                    0.3 * products_df['sales_score'] +
                    0.2 * products_df['review_score'] +
                    0.2 * products_df['order_score']
                )
            
            # 5. Lưu recommendations
            self.recommendations = products_df.sort_values(
                'popularity_score', 
                ascending=False
            )
            
            print(f"Trained successfully with {len(products_df)} products")
            return True
            
        except Exception as e:
            print(f"Lỗi trong quá trình training: {str(e)}")
            return False
            
    def recommend(self, n_items=10, category=None, min_price=None, max_price=None, brand=None):
        """Trả về top n sản phẩm phổ biến nhất với filters"""
        try:
            if self.recommendations is None or len(self.recommendations) == 0:
                print("No recommendations available")
                return []
            
            # Bắt đầu với toàn bộ recommendations
            filtered_recs = self.recommendations.copy()
            
            # Apply filters
            if category:
                filtered_recs = filtered_recs[filtered_recs['category_name'] == category]
                
            if brand:
                filtered_recs = filtered_recs[filtered_recs['brand_name'] == brand]
                
            if min_price is not None:
                filtered_recs = filtered_recs[filtered_recs['min_price'] >= min_price]
                
            if max_price is not None:
                filtered_recs = filtered_recs[filtered_recs['max_price'] <= max_price]
            
            # Get top n items
            result = filtered_recs.head(n_items).to_dict('records')
            
            # Add recommendation reasons
            for item in result:
                item['reason'] = self._get_recommendation_reason(item)
                
            return result
            
        except Exception as e:
            print(f"Lỗi trong recommend: {str(e)}")
            return []
            
    def _get_recommendation_reason(self, product):
        """Tạo lý do gợi ý cho mỗi sản phẩm"""
        reasons = []
        
        if product['avg_rating'] >= 4.5:
            reasons.append("Đánh giá rất cao")
        elif product['avg_rating'] >= 4.0:
            reasons.append("Đánh giá tốt")
            
        if product['sold_count'] >= 1000:
            reasons.append("Bán chạy nhất")
        elif product['sold_count'] >= 500:
            reasons.append("Được nhiều người mua")
            
        if product['review_count'] >= 10:
            reasons.append("Nhiều người đánh giá")
        elif product['review_count'] >= 5:
            reasons.append("Có nhiều review tích cực")
            
        if not reasons:
            reasons.append("Phù hợp với bạn")
            
        return " • ".join(reasons)
            
    def diversify_recommendations(self, recommendations, max_per_category=2):
        """Giới hạn số sản phẩm mỗi danh mục"""
        category_count = {}
        diverse_recs = []
        
        for product in recommendations:
            category = product['category']
            if category_count.get(category, 0) < max_per_category:
                diverse_recs.append(product)
                category_count[category] = category_count.get(category, 0) + 1
                
        return diverse_recs
            
    def calculate_popularity_score(self, product):
        """Tính popularity score với weights tốt hơn"""
        
        # Normalize metrics
        rating_score = self._normalize(product['avg_rating'], min_val=1, max_val=5)
        sales_score = self._normalize(product['sold_count'], min_val=0, max_val=max_sales)
        review_score = self._normalize(product['review_count'], min_val=0, max_val=max_reviews)
        
        # Tính recency score (ưu tiên sản phẩm mới)
        days_since_launch = (datetime.now() - product['created_at']).days
        recency_score = self._normalize(days_since_launch, inverse=True)
        
        # Weighted average
        return (
            0.35 * rating_score +     # Tăng weight cho rating
            0.25 * sales_score +      # Giảm weight cho sales
            0.20 * review_score +     # Giữ nguyên review weight  
            0.20 * recency_score      # Thêm recency factor
        )
            
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
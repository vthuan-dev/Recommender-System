# src/ml/popularity_recommender.py
import pandas as pd
import numpy as np

class PopularityRecommender:
    def __init__(self):
        self.recommendations = None
        self.all_products = None
        
    def fit(self, ratings_data, products_data):
        """Train popularity model với nhiều metrics và normalization"""
        # Convert ProductId to int if needed
        ratings_data['ProductId'] = ratings_data['ProductId'].astype(int)
        
        # Tính toán các metrics cơ bản
        product_ratings = pd.DataFrame(
            ratings_data.groupby('ProductId').agg({
                'Rating': ['count', 'mean', 'std'],
                'UserId': 'nunique'
            })
        )
        product_ratings.columns = ['count', 'mean', 'std', 'unique_users']
        
        # Xử lý null values
        product_ratings['std'] = product_ratings['std'].fillna(0)
        
        # Normalize các metrics
        for col in ['count', 'mean', 'unique_users']:
            product_ratings[f'{col}_norm'] = (product_ratings[col] - product_ratings[col].min()) / \
                                           (product_ratings[col].max() - product_ratings[col].min())
        
        # Thêm metrics mới
        product_metrics = {
            'rating_count': ratings_data.groupby('ProductId').size(),
            'avg_rating': ratings_data.groupby('ProductId')['Rating'].mean(),
            'unique_users': ratings_data.groupby('ProductId')['UserId'].nunique(),
            'sales_count': products_data['sold_count'],
            'price_score': self._calculate_price_score(products_data['price']),
            'recency_score': self._calculate_recency_score(ratings_data),
            'stock_level': products_data['initial_stock']
        }
        
        # Công thức mới
        if len(ratings_data) < 100:  # Dataset nhỏ
            # Giảm weight của các metrics phức tạp
            popularity_score = (
                0.50 * count_norm +      # Tăng weight cho số lượng đánh giá
                0.30 * mean_norm +       # Giảm weight cho rating trung bình
                0.20 * unique_users_norm # Giảm weight cho số users
            )
        else:
            # Công thức gốc cho dataset lớn
            popularity_score = (
                0.30 * rating_score +
                0.25 * sales_score +
                0.20 * recency_score +
                0.15 * price_score +
                0.10 * stock_score
            )
        
        self.all_products = product_ratings
        self.recommendations = product_ratings.sort_values(
            'popularity_score', 
            ascending=False
        )
        
    def recommend(self, n_items=10):
        try:
            # Giảm ngưỡng để phù hợp với dataset nhỏ
            min_ratings = 1  # Thay vì 30
            min_rating = 1.0  # Thay vì 3.5
            
            qualified = self.recommendations[
                (self.recommendations['count'] >= min_ratings) &
                (self.recommendations['mean'] >= min_rating)
            ]
            
            if len(qualified) < n_items:
                # Fallback: lấy tất cả sản phẩm có ít nhất 1 đánh giá
                qualified = self.recommendations[
                    self.recommendations['count'] >= 1
                ]
            
            return qualified.head(n_items)
        except Exception as e:
            print(f"Lỗi trong recommend: {str(e)}")
            return pd.DataFrame()
        
    def get_diverse_recommendations(self, n_items=10, min_ratings=30, min_rating=4.0):
        """Lấy diverse recommendations với nhiều cải tiến và xử lý edge cases"""
        try:
            # 1. Lọc ban đầu với điều kiện linh hoạt
            df = self.recommendations[
                (self.recommendations['count'] >= min_ratings) &
                (self.recommendations['mean'] >= min_rating) &
                (self.recommendations['std'] <= 1.5)        # Nới lỏng std threshold
            ].copy()
            
            if len(df) < n_items:
                df = self.recommendations[
                    (self.recommendations['count'] >= min_ratings//2) &
                    (self.recommendations['mean'] >= min_rating-0.5) &
                    (self.recommendations['std'] <= 2.0)
                ].copy()
            
            # 2. Chia nhóm với xử lý duplicates
            try:
                df['group'] = pd.qcut(
                    df['popularity_score'], 
                    q=5, 
                    labels=['Very Low', 'Low', 'Medium', 'High', 'Very High'],
                    duplicates='drop'
                )
            except ValueError:
                df['group'] = pd.cut(
                    df['popularity_score'],
                    bins=5,
                    labels=['Very Low', 'Low', 'Medium', 'High', 'Very High']
                )
            
            # 3. Điều chỉnh tỷ lệ các nhóm
            group_sizes = {
                'Very High': max(2, int(n_items * 0.25)),
                'High': max(2, int(n_items * 0.25)),
                'Medium': max(3, int(n_items * 0.30)),
                'Low': max(2, int(n_items * 0.10)),
                'Very Low': max(1, int(n_items * 0.10))
            }
            
            # 4. Lấy sản phẩm từ mỗi nhóm
            diverse_recs = []
            for group, size in group_sizes.items():
                group_items = df[df['group'] == group].head(size)
                diverse_recs.append(group_items)
            
            result = pd.concat(diverse_recs)
            return result.head(n_items)
            
        except Exception as e:
            print(f"Lỗi trong get_diverse_recommendations: {str(e)}")
            return pd.DataFrame()
        
    def recommend_with_context(self, context=None):
        """
        context = {
            'time_of_day': 'morning/afternoon/evening',
            'day_of_week': 1-7,
            'season': 'spring/summer/fall/winter',
            'special_event': 'tet/christmas/blackfriday'
        }
        """
        base_recommendations = self.recommend()
        if context:
            return self._apply_context_rules(base_recommendations, context)
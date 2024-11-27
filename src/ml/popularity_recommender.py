# src/ml/popularity_recommender.py
import pandas as pd
import numpy as np
from datetime import datetime

class PopularityRecommender:
    def __init__(self):
        self.recommendations = None
        self.all_products = None
        
    def _calculate_price_score(self, prices):
        """Tính điểm giá (cao hơn cho giá trung bình)"""
        try:
            mean_price = prices.mean()
            std_price = prices.std()
            if std_price == 0:
                return pd.Series(1, index=prices.index)
            return 1 - abs(prices - mean_price) / (2 * std_price)
        except Exception as e:
            print(f"Lỗi trong _calculate_price_score: {str(e)}")
            return pd.Series(0, index=prices.index)

    def _calculate_recency_score(self, ratings_data):
        """Tính điểm độ mới của ratings"""
        try:
            if 'created_at' not in ratings_data.columns:
                return pd.Series(1, index=ratings_data['ProductId'].unique())
                
            latest_date = pd.to_datetime(ratings_data['created_at']).max()
            ratings_data['days_old'] = (latest_date - pd.to_datetime(ratings_data['created_at'])).dt.days
            
            recency_scores = ratings_data.groupby('ProductId')['days_old'].mean()
            max_days = recency_scores.max()
            
            if max_days == 0:
                return pd.Series(1, index=recency_scores.index)
                
            return 1 - (recency_scores / max_days)
        except Exception as e:
            print(f"Lỗi trong _calculate_recency_score: {str(e)}")
            return pd.Series(1, index=ratings_data['ProductId'].unique())
        
    def fit(self, ratings_data, products_data):
        """Train popularity model với nhiều metrics và normalization"""
        try:
            if ratings_data is None or len(ratings_data) == 0:
                print("Không có dữ liệu ratings")
                return False
                
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
                if product_ratings[col].max() - product_ratings[col].min() > 0:
                    product_ratings[f'{col}_norm'] = (product_ratings[col] - product_ratings[col].min()) / \
                                                   (product_ratings[col].max() - product_ratings[col].min())
                else:
                    product_ratings[f'{col}_norm'] = 0
            
            # Tính các scores
            rating_score = product_ratings['mean_norm']
            count_score = product_ratings['count_norm']
            user_score = product_ratings['unique_users_norm']
            
            # Tính popularity score dựa trên size dataset
            if len(ratings_data) < 100:  # Dataset nhỏ
                product_ratings['popularity_score'] = (
                    0.50 * count_score +      
                    0.30 * rating_score +      
                    0.20 * user_score 
                )
            else:
                # Thêm metrics từ products_data nếu có
                if products_data is not None:
                    sales_score = self._normalize_series(products_data['sold_count'])
                    price_score = self._calculate_price_score(products_data['price'])
                    stock_score = self._normalize_series(products_data['initial_stock'])
                    recency_score = self._calculate_recency_score(ratings_data)
                    
                    product_ratings['popularity_score'] = (
                        0.30 * rating_score +
                        0.25 * sales_score +
                        0.20 * recency_score +
                        0.15 * price_score +
                        0.10 * stock_score
                    )
                else:
                    product_ratings['popularity_score'] = (
                        0.40 * rating_score +
                        0.35 * count_score +
                        0.25 * user_score
                    )
            
            self.all_products = product_ratings
            self.recommendations = product_ratings.sort_values(
                'popularity_score', 
                ascending=False
            )
            
            return True
            
        except Exception as e:
            print(f"Lỗi trong fit: {str(e)}")
            return False

    def _normalize_series(self, series):
        """Helper function để normalize một series"""
        if series.max() - series.min() > 0:
            return (series - series.min()) / (series.max() - series.min())
        return pd.Series(0, index=series.index)

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

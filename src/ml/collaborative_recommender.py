import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from scipy.sparse.linalg import svds
from sklearn.preprocessing import MinMaxScaler
import logging

logger = logging.getLogger(__name__)

class CollaborativeRecommender:
    def __init__(self):
        self.user_item_matrix = None
        self.user_factors = None
        self.item_factors = None
        self.mean_ratings = None
        self.conn = None
        
    def fit(self, conn):
        """Train collaborative filtering model"""
        try:
            self.conn = conn  # Lưu connection để dùng trong recommend()
            
            query = """
                SELECT 
                    upv.user_id,
                    upv.product_id,
                    AVG(COALESCE(r.rating, 0)) as rating,
                    COUNT(DISTINCT o.id) as purchase_count,
                    MAX(upv.view_count) as view_count,
                    COUNT(DISTINCT r.id) as review_count
                FROM user_product_views upv
                LEFT JOIN reviews r ON upv.user_id = r.user_id 
                    AND upv.product_id = r.product_id
                LEFT JOIN orderitems oi ON upv.product_id = oi.product_id
                LEFT JOIN orders o ON oi.order_id = o.id 
                    AND o.user_id = upv.user_id
                GROUP BY upv.user_id, upv.product_id
            """
            
            # Tính interaction score kết hợp
            interactions_df = pd.read_sql(query, conn)
            
            # Add logging
            logger.info(f"Loaded interactions: {len(interactions_df)} rows")
            
            # Xử lý missing values và chuẩn hóa
            interactions_df = interactions_df.fillna({
                'rating': 0,
                'purchase_count': 0,
                'view_count': 0,
                'review_count': 0
            })
            
            # Normalize các features
            scaler = MinMaxScaler()
            if len(interactions_df) > 0:
                # Log transform cho các features có phân phối lệch
                interactions_df['view_count'] = np.log1p(interactions_df['view_count'])
                interactions_df['review_count'] = np.log1p(interactions_df['review_count'])
                
                # Normalize
                interactions_df[['rating_norm', 'purchase_norm', 'view_norm', 'review_norm']] = scaler.fit_transform(
                    interactions_df[['rating', 'purchase_count', 'view_count', 'review_count']]
                )
            else:
                interactions_df[['rating_norm', 'purchase_norm', 'view_norm', 'review_norm']] = 0
            
            # Điều chỉnh trọng số
            interactions_df['interaction_score'] = (
                0.4 * interactions_df['rating_norm'] +     # Rating vẫn quan trọng
                0.3 * interactions_df['purchase_norm'] +   # Purchase cũng quan trọng
                0.2 * interactions_df['review_norm'] +     # Review có ý nghĩa
                0.1 * interactions_df['view_norm']         # View ít quan trọng nhất
            )
            
            # Tạo user-item matrix
            self.user_item_matrix = interactions_df.pivot(
                index='user_id',
                columns='product_id',
                values='interaction_score'
            ).fillna(0)
            
            # Add logging
            logger.info(f"User-item matrix shape: {self.user_item_matrix.shape}")
            logger.info(f"Unique users: {len(self.user_item_matrix.index)}")
            logger.info(f"Unique items: {len(self.user_item_matrix.columns)}")
            
            # Kiểm tra ma trận có dữ liệu không
            if self.user_item_matrix.shape[0] > 0 and self.user_item_matrix.shape[1] > 0:
                # Normalize và SVD
                self.mean_ratings = self.user_item_matrix.mean(axis=1)
                ratings_centered = self.user_item_matrix.sub(self.mean_ratings, axis=0)
                
                # Điều chỉnh số factors dựa trên kích thước ma trận
                k = min(30, min(self.user_item_matrix.shape) - 1)
                U, sigma, Vt = svds(ratings_centered.astype(float), k=k)
                
                # Áp dụng regularization
                sigma = np.diag(sigma / (1 + 0.05 * np.sqrt(len(self.user_item_matrix))))
                
                self.user_factors = U.dot(sigma)
                self.item_factors = Vt.T
            else:
                self.user_factors = np.array([])
                self.item_factors = np.array([])
                self.mean_ratings = pd.Series([])
            
            return self
            
        except Exception as e:
            logger.error(f"Error in collaborative fit: {str(e)}")
            raise e

    def recommend(self, user_id, n_items=8):
        """Gợi ý sản phẩm cho user cụ thể"""
        try:
            # Add logging
            logger.info(f"Getting recommendations for user {user_id}")
            logger.info(f"User in matrix: {user_id in self.user_item_matrix.index}")
            
            if user_id not in self.user_item_matrix.index or len(self.user_factors) == 0:
                return []
            
            # Tính predicted ratings
            user_pred = self.user_factors[
                self.user_item_matrix.index.get_loc(user_id)
            ].dot(self.item_factors.T)
            
            # Thêm lại mean rating
            user_pred += self.mean_ratings[user_id]
            
            # Lấy các category ưa thích của user
            query = """
                SELECT 
                    c.id,
                    COUNT(*) as interaction_count,
                    AVG(COALESCE(r.rating, 0)) as avg_rating
                FROM user_product_views upv
                JOIN products p ON upv.product_id = p.id
                JOIN categories c ON p.category_id = c.id
                LEFT JOIN reviews r ON upv.user_id = r.user_id 
                    AND upv.product_id = r.product_id
                WHERE upv.user_id = %s
                GROUP BY c.id
                ORDER BY interaction_count DESC, avg_rating DESC
                LIMIT 3
            """
            
            preferred_categories = pd.read_sql(query, self.conn, params=[user_id])
            
            # Boost scores cho sản phẩm trong preferred categories
            if not preferred_categories.empty:
                category_boost = 0.2  # Tăng 20% cho mỗi category ưa thích
                
                # Sửa lại cách query products
                product_ids = ','.join(map(str, self.user_item_matrix.columns))
                product_categories = pd.read_sql(f"""
                    SELECT id, category_id 
                    FROM products 
                    WHERE id IN ({product_ids})
                """, self.conn)
                
                for _, cat in preferred_categories.iterrows():
                    products_in_cat = product_categories[
                        product_categories['category_id'] == cat['id']
                    ]['id'].values
                    
                    # Convert product IDs to matrix indices
                    product_indices = [
                        self.user_item_matrix.columns.get_loc(pid) 
                        for pid in products_in_cat 
                        if pid in self.user_item_matrix.columns
                    ]
                    
                    # Boost scores
                    user_pred[product_indices] *= (1 + category_boost)
            
            # Lọc bỏ sản phẩm đã tương tác
            user_interactions = self.user_item_matrix.loc[user_id].to_numpy()
            already_interacted = np.where(user_interactions > 0)[0]
            user_pred[already_interacted] = -np.inf
            
            # Lấy top-N recommendations
            top_items = user_pred.argsort()[-n_items:][::-1]
            
            return self.user_item_matrix.columns[top_items].tolist()
            
        except Exception as e:
            logger.error(f"Error in collaborative recommend: {str(e)}")
            return []
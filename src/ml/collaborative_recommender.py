import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from scipy.sparse.linalg import svds
from sklearn.preprocessing import MinMaxScaler
import logging
from scipy.sparse import csr_matrix

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
                
                # Ensure matrix is numeric and convert to sparse
                ratings_centered = ratings_centered.fillna(0)
                sparse_ratings = csr_matrix(ratings_centered.values)
                
                # Perform SVD on sparse matrix
                k = min(30, min(sparse_ratings.shape) - 1)
                U, sigma, Vt = svds(sparse_ratings, k=k)
                
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
            user_id = int(user_id)  # Convert to int
            
            # Debug logs
            logger.info(f"Getting recommendations for user {user_id}")
            logger.info(f"Matrix shape: {self.user_item_matrix.shape}")
            logger.info(f"User factors shape: {self.user_factors.shape if self.user_factors is not None else 'None'}")
            logger.info(f"Item factors shape: {self.item_factors.shape if self.item_factors is not None else 'None'}")
            logger.info(f"User in matrix: {user_id in self.user_item_matrix.index}")
            
            if user_id not in self.user_item_matrix.index:
                logger.warning(f"User {user_id} not in matrix")
                return []
            
            if len(self.user_factors) == 0:
                logger.warning("Model not trained (user_factors empty)")
                return []
            
            # Get user index
            user_idx = self.user_item_matrix.index.get_loc(user_id)
            logger.info(f"User index in matrix: {user_idx}")
            
            # Calculate predictions
            user_pred = self.user_factors[user_idx].dot(self.item_factors.T)
            logger.info(f"Raw predictions shape: {user_pred.shape}")
            logger.info(f"Predictions range: {user_pred.min():.2f} to {user_pred.max():.2f}")
            
            # Add mean rating
            user_pred += self.mean_ratings[user_id]
            logger.info(f"After adding mean: {user_pred.min():.2f} to {user_pred.max():.2f}")
            
            # Get user's interactions
            user_interactions = self.user_item_matrix.loc[user_id].to_numpy()
            already_interacted = np.where(user_interactions > 0)[0]
            logger.info(f"User has interacted with {len(already_interacted)} items")
            
            # Set interacted items to -inf
            user_pred[already_interacted] = -np.inf
            logger.info(f"After filtering: {user_pred.min():.2f} to {user_pred.max():.2f}")
            
            # Get top items
            top_items = user_pred.argsort()[-n_items:][::-1]
            logger.info(f"Top items indices: {top_items}")
            
            recommendations = self.user_item_matrix.columns[top_items].tolist()
            logger.info(f"Final recommendations: {recommendations}")
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error in collaborative recommend: {str(e)}")
            logger.exception("Full traceback:")  # This will log the full stack trace
            return []

    def calculate_sparsity(self):
        """Tính độ thưa của ma trận user-item"""
        if self.user_item_matrix is None:
            return 0
            
        total_cells = self.user_item_matrix.shape[0] * self.user_item_matrix.shape[1]
        filled_cells = np.count_nonzero(~np.isnan(self.user_item_matrix))
        
        # Tính tỷ lệ phần trăm các ô có giá trị
        sparsity = (total_cells - filled_cells) / total_cells * 100
        return round(sparsity, 2)

    def update_user_item(self, user_id, item_id, weight):
        """Cập nhật ma trận user-item với tương tác mới"""
        try:
            # Convert to int
            user_id = int(user_id)
            item_id = int(item_id)
            
            logger.info(f"Updating matrix for user {user_id}, item {item_id}, weight {weight}")
            
            # Kiểm tra user và item có trong ma trận không
            if user_id not in self.user_item_matrix.index:
                logger.warning(f"User {user_id} not in matrix, adding new row")
                # Thêm user mới với toàn bộ giá trị 0
                new_row = pd.Series(0, index=self.user_item_matrix.columns)
                self.user_item_matrix.loc[user_id] = new_row
                
            if item_id not in self.user_item_matrix.columns:
                logger.warning(f"Item {item_id} not in matrix, adding new column")
                # Thêm item mới với toàn bộ giá trị 0
                self.user_item_matrix[item_id] = 0
                
            # Cập nhật giá trị tương tác
            current_value = self.user_item_matrix.loc[user_id, item_id]
            # Sử dụng exponential decay để giảm ảnh hưởng của các tương tác cũ
            decay_factor = 0.8
            new_value = current_value * decay_factor + weight * (1 - decay_factor)
            
            self.user_item_matrix.loc[user_id, item_id] = new_value
            
            # Cập nhật mean ratings
            self.mean_ratings = self.user_item_matrix.mean(axis=1)
            
            # Re-train model nếu có đủ dữ liệu mới
            if len(self.user_item_matrix) > 0:
                # Normalize và SVD
                ratings_centered = self.user_item_matrix.sub(self.mean_ratings, axis=0)
                ratings_centered = ratings_centered.fillna(0)
                sparse_ratings = csr_matrix(ratings_centered.values)
                
                # Perform SVD
                k = min(30, min(sparse_ratings.shape) - 1)
                U, sigma, Vt = svds(sparse_ratings, k=k)
                
                # Áp dụng regularization
                sigma = np.diag(sigma / (1 + 0.05 * np.sqrt(len(self.user_item_matrix))))
                
                self.user_factors = U.dot(sigma)
                self.item_factors = Vt.T
                
                logger.info(f"Model updated - Matrix shape: {self.user_item_matrix.shape}")
                logger.info(f"Sparsity: {self.calculate_sparsity()}%")
                
            return True
            
        except Exception as e:
            logger.error(f"Error updating user-item matrix: {str(e)}")
            logger.exception("Full traceback:")
            return False
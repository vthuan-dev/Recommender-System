from collaborative_recommender import CollaborativeRecommender
from popularity_recommender import PopularityRecommender
import mysql.connector
from datetime import datetime

class RecommenderSystem:
    def __init__(self):
        self.collaborative_recommender = CollaborativeRecommender()
        self.popularity_recommender = PopularityRecommender()
        self.conn = None
        self.last_train_time = None
        
    def fit(self, conn):
        """Train tất cả các recommender models"""
        self.conn = conn
        self.collaborative_recommender.fit(conn)
        self.popularity_recommender.fit(conn)
        self.last_train_time = datetime.now()
        
    def has_interaction_history(self, user_id, min_interactions=3):
        """Kiểm tra user có đủ lịch sử tương tác không"""
        query = """
            SELECT COUNT(*) as count
            FROM (
                SELECT user_id 
                FROM user_product_views 
                WHERE user_id = %s
                UNION ALL
                SELECT user_id 
                FROM orders 
                WHERE user_id = %s
                UNION ALL
                SELECT user_id 
                FROM reviews 
                WHERE user_id = %s
            ) interactions
        """
        cursor = self.conn.cursor()
        cursor.execute(query, (user_id, user_id, user_id))
        result = cursor.fetchone()
        cursor.close()
        return result[0] >= min_interactions

    def get_similar_products(self, product_id, n_items=4):
        """Lấy sản phẩm tương tự dựa trên content"""
        query = """
            SELECT p2.id
            FROM products p1
            JOIN products p2 ON p1.category_id = p2.category_id 
                AND p1.id != p2.id
            WHERE p1.id = %s
            ORDER BY p2.avg_rating DESC
            LIMIT %s
        """
        cursor = self.conn.cursor()
        cursor.execute(query, (product_id, n_items))
        similar_products = [row[0] for row in cursor.fetchall()]
        cursor.close()
        return similar_products

    def combine_recommendations(self, collab_or_popular, similar, weights=[0.6, 0.4]):
        """Kết hợp các loại recommendations với trọng số"""
        if not collab_or_popular or not similar:
            return collab_or_popular or similar
            
        n_collab = int(len(collab_or_popular) * weights[0])
        n_similar = int(len(similar) * weights[1])
        
        combined = []
        combined.extend(collab_or_popular[:n_collab])
        combined.extend(similar[:n_similar])
        
        return combined

    def get_recommendations(self, user_id=None, product_id=None, n_items=8):
        """Main function để lấy recommendations"""
        try:
            recommendations = []
            reason = ""
            
            # 1. Xác định nguồn recommendations chính
            if user_id and self.has_interaction_history(user_id):
                # Collaborative cho user có lịch sử
                recommendations = self.collaborative_recommender.recommend(
                    user_id=user_id,
                    n_items=n_items
                )
                reason = "Dựa trên lịch sử của bạn"
            else:
                # Popularity cho user mới
                recommendations = self.popularity_recommender.recommend(
                    limit=n_items
                )
                reason = "Phổ biến nhất"

            # 2. Thêm similar products nếu có product_id
            if product_id:
                similar_products = self.get_similar_products(
                    product_id=product_id,
                    n_items=n_items//2
                )
                recommendations = self.combine_recommendations(
                    recommendations[:n_items//2],
                    similar_products
                )
                reason += " • Sản phẩm tương tự"

            return {
                'recommendations': recommendations,
                'reason': reason,
                'metadata': {
                    'user_id': user_id,
                    'product_id': product_id,
                    'last_trained': self.last_train_time.isoformat() if self.last_train_time else None
                }
            }

        except Exception as e:
            print(f"Error getting recommendations: {str(e)}")
            return {
                'recommendations': [],
                'reason': "Có lỗi xảy ra",
                'error': str(e)
            } 
import mysql.connector
import logging
from popularity_recommender import PopularityRecommender
from collaborative_recommender import CollaborativeRecommender
from hybrid_recommender import HybridRecommender
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Cấu hình logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database config
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '100103',
    'database': 'NLCN',
    'port': 3307,
    'auth_plugin': 'mysql_native_password'
}

class RecommenderTester:
    def __init__(self):
        self.conn = None
        self.pop_rec = None
        self.collab_rec = None
        self.hybrid_rec = None
        
    def connect_db(self):
        """Kết nối database"""
        try:
            self.conn = mysql.connector.connect(**db_config)
            logger.info("Database connected successfully")
            return True
        except Exception as e:
            logger.error(f"Database connection error: {str(e)}")
            return False
            
    def test_popularity(self):
        """Test popularity recommender"""
        logger.info("\n=== Testing Popularity Recommender ===")
        
        try:
            self.pop_rec = PopularityRecommender()
            
            # Train model
            success = self.pop_rec.fit(self.conn)
            logger.info(f"Training success: {success}")
            
            # Get recommendations
            recs = self.pop_rec.recommend(limit=5)
            logger.info("\nTop 5 Popular Products:")
            for rec in recs:
                logger.info(f"- {rec['name']} (Score: {rec['popularity_score']:.2f})")
                
            # Generate analytics
            self.pop_rec.plot_analytics()
            logger.info("Analytics plots generated")
            
            return True
            
        except Exception as e:
            logger.error(f"Popularity test error: {str(e)}")
            return False
            
    def test_collaborative(self, user_a, user_b):
        """Test collaborative recommender"""
        logger.info("\n=== Testing Collaborative Recommender ===")
        
        try:
            self.collab_rec = CollaborativeRecommender()
            
            # Train model
            success = self.collab_rec.fit(self.conn)
            logger.info(f"Training success: {success}")
            
            # Get recommendations for both users
            recs_a = self.collab_rec.recommend(user_a, n_items=5)
            recs_b = self.collab_rec.recommend(user_b, n_items=5)
            
            logger.info(f"\nRecommendations for User {user_a}:")
            for rec in recs_a:
                logger.info(f"- Product ID: {rec}")
                
            logger.info(f"\nRecommendations for User {user_b}:")
            for rec in recs_b:
                logger.info(f"- Product ID: {rec}")
                
            # Calculate similarity
            similarity = self.calculate_user_similarity(user_a, user_b)
            logger.info(f"\nSimilarity between users: {similarity:.2f}")
            
            # Analyze common recommendations
            common_recs = set(recs_a) & set(recs_b)
            logger.info(f"Common recommendations: {len(common_recs)}")
            if common_recs:
                logger.info(f"Common products: {common_recs}")
                
            return True
            
        except Exception as e:
            logger.error(f"Collaborative test error: {str(e)}")
            return False
            
    def test_hybrid(self, user_a, user_b, product_x, product_y):
        """Test hybrid recommender"""
        logger.info("\n=== Testing Hybrid Recommender ===")
        
        try:
            self.hybrid_rec = HybridRecommender()
            
            # Train model
            success = self.hybrid_rec.fit(self.conn)
            logger.info(f"Training success: {success}")
            
            # Test different scenarios
            scenarios = [
                (user_a, product_x, "User A viewing Product X"),
                (user_b, product_y, "User B viewing Product Y"),
                (user_a, None, "User A without product context"),
                (None, product_x, "New user viewing Product X")
            ]
            
            for user_id, product_id, scenario in scenarios:
                logger.info(f"\n{scenario}:")
                recs = self.hybrid_rec.recommend(
                    user_id=user_id, 
                    product_id=product_id, 
                    n_items=5
                )
                for rec in recs:
                    logger.info(
                        f"- {rec['name']} "
                        f"({rec['reason']}, Score: {rec['score']:.2f})"
                    )
                    
            return True
            
        except Exception as e:
            logger.error(f"Hybrid test error: {str(e)}")
            return False
            
    def calculate_user_similarity(self, user_a, user_b):
        """Tính similarity giữa 2 users"""
        try:
            if not self.collab_rec or \
               user_a not in self.collab_rec.user_item_matrix.index or \
               user_b not in self.collab_rec.user_item_matrix.index:
                return 0
                
            user_a_vec = self.collab_rec.user_item_matrix.loc[user_a].values
            user_b_vec = self.collab_rec.user_item_matrix.loc[user_b].values
            
            similarity = cosine_similarity([user_a_vec], [user_b_vec])[0][0]
            return similarity
            
        except Exception as e:
            logger.error(f"Similarity calculation error: {str(e)}")
            return 0
            
    def analyze_user_behavior(self, user_a, user_b):
        """Phân tích chi tiết hành vi của 2 users"""
        logger.info("\n=== Analyzing User Behavior ===")
        
        try:
            # Query user interactions
            query = """
                SELECT 
                    upv.user_id,
                    p.name as product_name,
                    c.name as category_name,
                    b.name as brand_name,
                    upv.view_count,
                    COALESCE(r.rating, 0) as rating,
                    COUNT(DISTINCT o.id) as purchase_count
                FROM user_product_views upv
                JOIN products p ON upv.product_id = p.id
                JOIN categories c ON p.category_id = c.id
                JOIN brands b ON p.brand_id = b.id
                LEFT JOIN reviews r ON upv.user_id = r.user_id 
                    AND upv.product_id = r.product_id
                LEFT JOIN orderitems oi ON upv.product_id = oi.product_id
                LEFT JOIN orders o ON oi.order_id = o.id 
                    AND o.user_id = upv.user_id
                WHERE upv.user_id IN (%s, %s)
                GROUP BY upv.user_id, p.id
            """
            
            df = pd.read_sql(query, self.conn, params=[user_a, user_b])
            
            # Analyze categories
            self.plot_category_comparison(df, user_a, user_b)
            
            # Analyze brands
            self.plot_brand_comparison(df, user_a, user_b)
            
            # Analyze ratings
            self.plot_rating_comparison(df, user_a, user_b)
            
            return True
            
        except Exception as e:
            logger.error(f"Behavior analysis error: {str(e)}")
            return False
            
    def plot_category_comparison(self, df, user_a, user_b):
        """Plot category preferences"""
        plt.figure(figsize=(12, 6))
        
        # Get top categories for each user
        cat_a = df[df['user_id'] == user_a]['category_name'].value_counts()
        cat_b = df[df['user_id'] == user_b]['category_name'].value_counts()
        
        # Plot
        plt.subplot(1, 2, 1)
        cat_a.plot(kind='pie', title=f'User {user_a} Categories')
        plt.subplot(1, 2, 2)
        cat_b.plot(kind='pie', title=f'User {user_b} Categories')
        
        plt.tight_layout()
        plt.show()
        
    def plot_brand_comparison(self, df, user_a, user_b):
        """Plot brand preferences"""
        plt.figure(figsize=(12, 6))
        
        # Get top brands for each user
        brand_a = df[df['user_id'] == user_a]['brand_name'].value_counts().head(10)
        brand_b = df[df['user_id'] == user_b]['brand_name'].value_counts().head(10)
        
        # Plot
        plt.subplot(1, 2, 1)
        brand_a.plot(kind='bar', title=f'User {user_a} Top Brands')
        plt.subplot(1, 2, 2)
        brand_b.plot(kind='bar', title=f'User {user_b} Top Brands')
        
        plt.tight_layout()
        plt.show()
        
    def plot_rating_comparison(self, df, user_a, user_b):
        """Plot rating distributions"""
        plt.figure(figsize=(10, 6))
        
        # Get ratings for each user
        sns.kdeplot(data=df[df['user_id'] == user_a]['rating'], 
                   label=f'User {user_a}')
        sns.kdeplot(data=df[df['user_id'] == user_b]['rating'], 
                   label=f'User {user_b}')
        
        plt.title('Rating Distributions')
        plt.xlabel('Rating')
        plt.ylabel('Density')
        plt.legend()
        plt.show()

def main():
    # Initialize tester
    tester = RecommenderTester()
    
    # Connect to database
    if not tester.connect_db():
        return
        
    try:
        # Test all recommenders
        user_a = 1  # Replace with actual user IDs
        user_b = 2
        product_x = 1  # Replace with actual product IDs
        product_y = 2
        
        tester.test_popularity()
        tester.test_collaborative(user_a, user_b)
        tester.test_hybrid(user_a, user_b, product_x, product_y)
        tester.analyze_user_behavior(user_a, user_b)
        
        logger.info("\n=== All Tests Completed Successfully ===")
        
    except Exception as e:
        logger.error(f"Testing failed: {str(e)}")
        
    finally:
        if tester.conn:
            tester.conn.close()
            logger.info("Database connection closed")

if __name__ == "__main__":
    main() 
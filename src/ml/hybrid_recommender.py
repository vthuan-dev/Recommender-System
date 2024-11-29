import numpy as np
import pandas as pd
from content_based_recommender import ContentBasedRecommender
from collaborative_recommender import CollaborativeRecommender
from popularity_recommender import PopularityRecommender
import logging
import mysql.connector

logger = logging.getLogger(__name__)

class HybridRecommender:
    def __init__(self):
        self.content_based = ContentBasedRecommender()
        self.collaborative = CollaborativeRecommender()
        self.popularity = PopularityRecommender()
        self.db_config = {
            'host': 'localhost',
            'user': 'root',
            'password': '100103',
            'database': 'NLCN',
            'port': 3307,
            'auth_plugin': 'mysql_native_password'
        }
        
    def fit(self, conn=None):
        """Khởi tạo và train các recommender thành phần"""
        try:
            # Nếu không có connection được truyền vào, tạo connection mới
            if conn is None:
                conn = mysql.connector.connect(**self.db_config)
                should_close = True
            else:
                should_close = False

            # Train các recommender thành phần
            logger.info("Training collaborative recommender...")
            self.collaborative.fit(conn)

            logger.info("Training content-based recommender...")
            self.content_based.fit()

            logger.info("Training popularity recommender...")
            self.popularity.fit(conn)

            if should_close:
                conn.close()

            return True

        except Exception as e:
            logger.error(f"Error in hybrid fit: {str(e)}")
            logger.exception("Full traceback:")
            return False

    def _get_db_connection(self):
        """Tạo connection mới đến database"""
        try:
            return mysql.connector.connect(**self.db_config)
        except Exception as e:
            logger.error(f"Error connecting to database: {str(e)}")
            return None

    def recommend(self, user_id=None, product_id=None, n_items=8):
        """Kết hợp recommendations từ các models"""
        try:
            logger.info(f"\n=== Starting hybrid recommendations ===")
            logger.info(f"Parameters: user_id={user_id}, product_id={product_id}, n_items={n_items}")
            
            recommendations = []
            
            # Case 1: Có cả user_id và product_id
            if user_id and product_id:
                # Get collaborative recommendations
                logger.info("Getting collaborative recommendations...")
                collab_recs = self.collaborative.recommend(user_id, n_items=n_items)
                logger.info(f"Got {len(collab_recs)} collaborative recs")
                
                if collab_recs:
                    recommendations.extend([
                        {
                            'product_id': int(rec),
                            'weight': 0.4,
                            'reason': 'Dựa trên lịch sử của bạn'
                        } for rec in collab_recs
                    ])

                # Get content-based recommendations
                logger.info("Getting content-based recommendations...")
                content_recs = self.content_based.recommend(product_id, n_items=n_items)
                logger.info(f"Got {len(content_recs)} content-based recs")
                
                if content_recs:
                    recommendations.extend([
                        {
                            'product_id': int(rec['id']),
                            'weight': 0.4,
                            'reason': 'Sản phẩm tương tự'
                        } for rec in content_recs
                    ])

                # Get popularity recommendations
                logger.info("Getting popularity recommendations...")
                popular_recs = self.popularity.recommend(limit=n_items//2)
                logger.info(f"Got popularity recs: {popular_recs}")
                
                if popular_recs:
                    recommendations.extend([
                        {
                            'product_id': int(rec['product_id']),
                            'weight': 0.2,
                            'reason': 'Đang thịnh hành'
                        } for rec in popular_recs
                    ])

                # Tạo connection mới và lấy thông tin chi tiết sản phẩm
                conn = self._get_db_connection()
                if conn:
                    try:
                        product_details = self._get_product_details(conn, [rec['product_id'] for rec in recommendations])
                        final_recs = self._combine_recommendations(recommendations, n_items, product_details)
                        logger.info(f"Final recommendations: {len(final_recs)} items")
                        return final_recs
                    finally:
                        conn.close()
                else:
                    logger.error("Could not establish database connection")
                    return []

            return []

        except Exception as e:
            logger.error(f"Error in hybrid recommend: {str(e)}")
            logger.exception("Full traceback:")
            return []

    def _get_product_details(self, conn, product_ids):
        """Lấy thông tin chi tiết sản phẩm từ DB"""
        query = """
            SELECT 
                p.id as product_id,
                p.name,
                p.image_url,
                b.name as brand_name,
                c.name as category_name,
                COALESCE(pv.min_price, 0) as min_price,
                COALESCE(pv.max_price, 0) as max_price
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id 
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN (
                SELECT 
                    product_id,
                    MIN(price) as min_price,
                    MAX(price) as max_price
                FROM productvariants
                GROUP BY product_id
            ) pv ON p.id = pv.product_id
            WHERE p.id IN (%s)
        """ % ','.join(['%s'] * len(product_ids))
        
        df = pd.read_sql(query, conn, params=product_ids)
        return df.set_index('product_id').to_dict('index')

    def _combine_recommendations(self, recommendations, n_items, product_details):
        """Kết hợp và sắp xếp recommendations theo weight"""
        try:
            logger.info("=== Combining recommendations ===")
            logger.info(f"Input recommendations: {len(recommendations)}")
            
            # Tạo dict để track unique items
            unique_recs = {}
            
            for rec in recommendations:
                product_id = rec.get('product_id')
                if not product_id:
                    logger.warning(f"Skipping recommendation without product_id: {rec}")
                    continue
                    
                if product_id not in unique_recs:
                    details = product_details.get(product_id, {})
                    unique_recs[product_id] = {
                        'product_id': product_id,
                        'name': details.get('name', ''),
                        'image_url': details.get('image_url', ''),
                        'brand_name': details.get('brand_name', ''),
                        'category_name': details.get('category_name', ''),
                        'min_price': details.get('min_price', 0),
                        'max_price': details.get('max_price', 0),
                        'score': rec.get('weight', 0),
                        'reason': rec.get('reason', '')
                    }
                else:
                    # Nếu item đã tồn tại, cộng thêm weighted score
                    unique_recs[product_id]['score'] += rec.get('weight', 0)
                    
            logger.info(f"Unique recommendations: {len(unique_recs)}")
            
            # Sort theo score và lấy top n_items
            sorted_recs = sorted(
                unique_recs.values(),
                key=lambda x: x['score'],
                reverse=True
            )[:n_items]
            
            logger.info(f"Final recommendations: {len(sorted_recs)}")
            return sorted_recs
            
        except Exception as e:
            logger.error(f"Error combining recommendations: {str(e)}")
            logger.exception("Full traceback:")
            return [] 
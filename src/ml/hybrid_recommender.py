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
                # Get content-based recommendations first (vì đang xem sản phẩm)
                logger.info("Getting content-based recommendations...")
                content_recs = self.content_based.recommend(product_id, n_items=n_items)
                logger.info(f"Got {len(content_recs)} content-based recs")
                
                if content_recs:
                    for i, rec in enumerate(content_recs[:n_items//2]):  # Lấy một nửa từ content-based
                        weight = 0.5 * (1.0 - i/len(content_recs) * 0.3)
                        recommendations.append({
                            'product_id': int(rec['id']),
                            'weight': weight,
                            'reason': 'content',
                            'source': 'content'
                        })

                # Get collaborative recommendations
                logger.info("Getting collaborative recommendations...")
                collab_recs = self.collaborative.recommend(user_id, n_items=n_items)
                logger.info(f"Got {len(collab_recs)} collaborative recs")
                
                if collab_recs:
                    for i, rec in enumerate(collab_recs[:n_items//2]):  # Lấy một nửa từ collaborative
                        weight = 0.4 * (1.0 - i/len(collab_recs) * 0.3)
                        recommendations.append({
                            'product_id': int(rec),
                            'weight': weight,
                            'reason': 'collaborative',
                            'source': 'collaborative'
                        })

                # Get popularity recommendations nếu chưa đủ số lượng
                if len(recommendations) < n_items:
                    logger.info("Getting popularity recommendations...")
                    popular_recs = self.popularity.recommend(limit=n_items//4)  # Lấy 1/4 từ popularity
                    logger.info(f"Got popularity recs: {popular_recs}")
                    
                    if popular_recs:
                        for i, rec in enumerate(popular_recs):
                            weight = 0.1 * (1.0 - i/len(popular_recs) * 0.3)
                            recommendations.append({
                                'product_id': int(rec['product_id']),
                                'weight': weight,
                                'reason': 'popularity',
                                'source': 'popularity'
                            })

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
        """Kết hợp và format kết quả cuối cùng"""
        try:
            # Tạo dict để lưu product details theo id
            details_dict = {str(pid): details for pid, details in product_details.items()}
            
            # Tính weight cho mỗi sản phẩm và lưu source
            product_info = {}
            for rec in recommendations:
                pid = str(rec['product_id'])
                if pid not in product_info:
                    product_info[pid] = {
                        'weight': rec['weight'],
                        'source': rec['source']
                    }
                else:
                    # Nếu sản phẩm xuất hiện từ nhiều nguồn, lấy weight cao nhất
                    if rec['weight'] > product_info[pid]['weight']:
                        product_info[pid] = {
                            'weight': rec['weight'],
                            'source': rec['source']
                        }
                    
            # Chuẩn hóa weights
            max_weight = max(info['weight'] for info in product_info.values()) if product_info else 1.0
            for pid in product_info:
                product_info[pid]['weight'] /= max_weight

            # Format kết quả cuối
            final_recs = []
            seen_products = set()
            
            for rec in recommendations:
                pid = str(rec['product_id'])
                
                if pid in seen_products:
                    continue
                    
                seen_products.add(pid)
                
                if pid in details_dict:
                    product = details_dict[pid]
                    info = product_info[pid]
                    weight = info['weight']
                    source = info['source']
                    
                    # Xác định reason dựa trên nguồn và weight
                    if source == 'collaborative':
                        if weight > 0.85:
                            reason = "Rất phù hợp với sở thích của bạn"
                        elif weight > 0.75:
                            reason = "Phù hợp với sở thích của bạn"
                        else:
                            reason = "Có thể bạn sẽ thích"
                    elif source == 'content':
                        if weight > 0.85:
                            reason = "Rất tương tự với sản phẩm bạn đang xem"
                        elif weight > 0.75:
                            reason = "Tương tự với sản phẩm bạn đang xem"
                        else:
                            reason = "Sản phẩm liên quan"
                    else:  # popularity
                        if weight > 0.85:
                            reason = "Đang rất thịnh hành"
                        elif weight > 0.75:
                            reason = "Đang thịnh hành"
                        else:
                            reason = "Được nhiều người quan tâm"
                    
                    final_recs.append({
                        'product_id': int(pid),
                        'name': product['name'],
                        'image_url': product['image_url'],
                        'brand_name': product['brand_name'],
                        'category_name': product['category_name'],
                        'min_price': float(product['min_price']),
                        'max_price': float(product['max_price']),
                        'reason': reason,
                        'score': round(weight, 2)
                    })
                    
                    if len(final_recs) >= n_items:
                        break
                        
            return final_recs

        except Exception as e:
            logger.error(f"Error combining recommendations: {str(e)}")
            logger.exception("Full traceback:")
            return [] 
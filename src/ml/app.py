# src/ml/app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
from popularity_recommender import PopularityRecommender
from collaborative_recommender import CollaborativeRecommender
from content_based_recommender import ContentBasedRecommender
import mysql.connector
from datetime import datetime
import logging
import pandas as pd

app = Flask(__name__)
# Cấu hình logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# CORS config
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:8080", "http://localhost:3000", "http://localhost:5173"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": True,
        "max_age": 3600
    }
})

# Config database giữ nguyên
db_config = {
    'host': 'localhost',
    'user': 'root', 
    'password': '100103',
    'database': 'NLCN',
    'port': 3307,
    'auth_plugin': 'mysql_native_password'
}

# Cache cho recommender để tránh train lại model quá nhiều
recommender = None
last_train_time = None
CACHE_DURATION = 3600  # 1 giờ

# Thêm global variable
collab_recommender = None
content_based_recommender = None

def get_recommender():
    """Lấy recommender từ cache hoặc train mới nếu cần"""
    global recommender, last_train_time
    
    current_time = datetime.now()
    
    # Kiểm tra xem có cần train lại model không
    need_retrain = (
        recommender is None or 
        last_train_time is None or
        (current_time - last_train_time).total_seconds() > CACHE_DURATION
    )
    
    if need_retrain:
        try:
            conn = mysql.connector.connect(**db_config)
            recommender = PopularityRecommender()
            recommender.fit(conn)
            last_train_time = current_time
            conn.close()
            logger.info("Model retrained successfully")
        except Exception as e:
            logger.error(f"Error training model: {str(e)}")
            raise e
            
    return recommender

@app.route('/api/recommended-products', methods=['GET', 'OPTIONS'])
def get_recommended_products():
    if request.method == 'OPTIONS':
        return '', 204  # Return empty response for OPTIONS
        
    try:
        # Lấy user_id từ request
        user_id = request.args.get('user_id')
        
        if user_id and check_user_interactions(user_id):
            # Nếu có user_id và đủ tương tác -> dùng collaborative
            recommendations = collaborative_recommender.recommend(
                user_id=user_id,
                n_items=int(request.args.get('limit', 8))
            )
            source = 'collaborative'
            algorithm = 'matrix-factorization'
        else:
            # Không có user_id hoặc ít tương tác -> dùng popularity
            recommendations = get_recommender().recommend(
                limit=int(request.args.get('limit', 8)),
                category=request.args.get('category'),
                brand=request.args.get('brand'),
                min_price=request.args.get('min_price'),
                max_price=request.args.get('max_price')
            )
            source = 'popularity'
            algorithm = 'weighted-ranking'

        # Format response
        formatted_recommendations = [{
            'product_id': rec['product_id'],
            'name': rec['name'],
            'image_url': rec['image_url'],
            'brand_name': rec['brand_name'],
            'category_name': rec['category_name'],
            'min_price': rec['min_price'],
            'max_price': rec['max_price'],
            'metrics': {
                'avg_rating': round(float(rec['avg_rating']), 1),
                'review_count': int(rec['review_count']),
                'sold_count': int(rec['sold_count'])
            }
        } for rec in recommendations]

        return jsonify({
            'success': True,
            'recommendations': formatted_recommendations,
            'metadata': {
                'source': source,
                'algorithm': algorithm,
                'total_items': len(formatted_recommendations)
            }
        })

    except Exception as e:
        logger.error(f"Error in get_recommended_products: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'source': 'error'
        }), 500

@app.route('/api/retrain', methods=['POST'])
def retrain_model():
    """API để force retrain model"""
    try:
        global recommender, last_train_time
        recommender = None
        last_train_time = None
        get_recommender()
        return jsonify({'success': True, 'message': 'Model retrained successfully'})
    except Exception as e:
        logger.error(f"Error retraining model: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/personalized-recommendations', methods=['GET'])
def get_personalized_recommendations():
    try:
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'Missing user_id'}), 400
            
        # Kiểm tra user có đủ tương tác không
        has_interactions = check_user_interactions(user_id)
        
        if not has_interactions:
            # Fallback về popularity-based
            return get_recommended_products()
            
        # Lấy collaborative recommendations
        recommendations = collab_recommender.recommend(
            user_id=user_id,
            n_items=8
        )
        
        # Format response giống popularity-based
        return format_recommendations(recommendations)
        
    except Exception as e:
        logger.error(f"Error getting personalized recommendations: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/collaborative/train', methods=['POST'])
def train_collaborative():
    """API để train collaborative model"""
    try:
        success = init_collaborative()
        if success:
            return jsonify({
                'success': True,
                'message': 'Collaborative model trained successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to train model'
            }), 500
    except Exception as e:
        logger.error(f"Error in train_collaborative: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/collaborative/recommend', methods=['GET', 'OPTIONS'])
def get_collaborative_recommendations():
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        user_id = request.args.get('user_id')
        logger.info(f"Received collaborative request for user_id: {user_id}")
        
        if not user_id:
            return get_popularity_recommendations()
            
        # Kiểm tra xem user có đủ tương tác không
        has_interactions = check_user_interactions(int(user_id))
        logger.info(f"User {user_id} has sufficient interactions: {has_interactions}")
        
        if not has_interactions:
            return get_popularity_recommendations()
            
        # Lấy recommendations từ collaborative model
        conn = mysql.connector.connect(**db_config)
        recommendations = collaborative_recommender.recommend(
            user_id=int(user_id),
            n_items=int(request.args.get('limit', 8))
        )
        
        # Format response giống như popularity recommendations
        product_details = get_product_details(conn, recommendations)
        conn.close()
        
        formatted_recommendations = [{
            'id': rec['product_id'],  # Thêm id để tương thích với ProductCard
            'product_id': rec['product_id'],
            'name': rec['name'],
            'image_url': rec['image_url'],
            'brand_name': rec['brand_name'],
            'category_name': rec['category_name'],
            'min_price': float(rec['min_price']),  # Convert to float
            'max_price': float(rec['max_price']),
            'metrics': {
                'avg_rating': round(float(rec['avg_rating']), 1),
                'review_count': int(rec['review_count']),
                'sold_count': int(rec['sold_count'])
            },
            'reason': 'Dựa trên lịch sử mua sắm của bạn'  # Thêm lý do gợi ý
        } for rec in product_details]

        return jsonify({
            'success': True,
            'recommendations': formatted_recommendations,
            'metadata': {
                'source': 'collaborative',
                'algorithm': 'matrix-factorization',
                'total_items': len(formatted_recommendations)
            }
        })
        
    except Exception as e:
        logger.error(f"Error in collaborative recommendations: {str(e)}")
        return get_popularity_recommendations()

@app.route('/api/collaborative/status', methods=['GET'])
def get_collaborative_status():
    """API để kiểm tra trạng thái ca collaborative model"""
    try:
        if collaborative_recommender is None:
            return jsonify({
                'status': 'not_initialized',
                'message': 'Model not initialized'
            })
            
        # Lấy thông tin chi tiết về user cụ thể
        user_id = request.args.get('user_id')
        if user_id:
            user_exists = int(user_id) in collaborative_recommender.user_item_matrix.index
            user_interactions = None
            if user_exists:
                user_interactions = collaborative_recommender.user_item_matrix.loc[int(user_id)].sum()
            
            return jsonify({
                'status': 'active',
                'user_info': {
                    'user_id': user_id,
                    'exists_in_matrix': user_exists,
                    'total_interactions': user_interactions if user_exists else 0
                }
            })
            
        # Thông tin tổng quan về model
        return jsonify({
            'status': 'active',
            'matrix_shape': collaborative_recommender.user_item_matrix.shape,
            'unique_users': len(collaborative_recommender.user_item_matrix.index),
            'unique_items': len(collaborative_recommender.user_item_matrix.columns),
            'sparsity': (collaborative_recommender.user_item_matrix == 0).sum().sum() / 
                       (collaborative_recommender.user_item_matrix.shape[0] * 
                        collaborative_recommender.user_item_matrix.shape[1])
        })
        
    except Exception as e:
        logger.error(f"Error getting model status: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

def get_product_details(conn, product_ids):
    """Lấy thông tin chi tiết của các sản phẩm"""
    if not product_ids:
        return []
        
    query = """
        SELECT 
            p.id as product_id,
            p.name,
            p.image_url,
            b.name as brand_name,
            c.name as category_name,
            COALESCE(pv.min_price, 0) as min_price,
            COALESCE(pv.max_price, 0) as max_price,
            COALESCE(r.avg_rating, 0) as avg_rating,
            COALESCE(r.review_count, 0) as review_count,
            COALESCE(s.sold_count, 0) as sold_count
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN (
            SELECT product_id, MIN(price) as min_price, MAX(price) as max_price
            FROM productvariants
            GROUP BY product_id
        ) pv ON p.id = pv.product_id
        LEFT JOIN (
            SELECT product_id, 
                   COUNT(*) as review_count,
                   AVG(rating) as avg_rating
            FROM reviews
            GROUP BY product_id
        ) r ON p.id = r.product_id
        LEFT JOIN (
            SELECT product_id, SUM(quantity) as sold_count
            FROM orderitems oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status != 'cancelled'
            GROUP BY product_id
        ) s ON p.id = s.product_id
        WHERE p.id IN (%s)
    """ % ','.join(map(str, product_ids))
    
    df = pd.read_sql(query, conn)
    return df.to_dict('records')

def init_collaborative():
    """Khởi tạo và train collaborative model"""
    global collaborative_recommender
    try:
        conn = mysql.connector.connect(**db_config)
        collaborative_recommender = CollaborativeRecommender()
        collaborative_recommender.fit(conn)
        conn.close()
        logger.info("Collaborative model initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Error initializing collaborative model: {str(e)}")
        return False

def check_user_interactions(user_id):
    """Kiểm tra xem user có đủ tương tác để dùng collaborative filtering không"""
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # Đếm số lượng tương tác (view, rating, purchase) của user
        cursor.execute("""
            SELECT COUNT(*) as interaction_count 
            FROM (
                SELECT user_id FROM user_product_views WHERE user_id = %s
                UNION ALL
                SELECT user_id FROM reviews WHERE user_id = %s
                UNION ALL 
                SELECT user_id FROM orders WHERE user_id = %s
            ) interactions
        """, (user_id, user_id, user_id))
        
        result = cursor.fetchone()
        interaction_count = result[0] if result else 0
        
        cursor.close()
        conn.close()
        
        # Yêu cầu ít nhất 5 tương tác
        return interaction_count >= 5
        
    except Exception as e:
        logger.error(f"Error checking user interactions: {str(e)}")
        return False

def format_recommendations(recommendations):
    """Format recommendations theo chuẩn response"""
    try:
        if not recommendations:
            return jsonify({
                'success': True,
                'recommendations': [],
                'metadata': {
                    'total_items': 0
                }
            })
            
        conn = mysql.connector.connect(**db_config)
        product_details = get_product_details(conn, recommendations)
        conn.close()
        
        return jsonify({
            'success': True,
            'recommendations': product_details,
            'metadata': {
                'total_items': len(product_details)
            }
        })
        
    except Exception as e:
        logger.error(f"Error formatting recommendations: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/collaborative/matrix', methods=['GET'])
def get_matrix_info():
    """API để xem thông tin chi tiết về ma trận"""
    try:
        if collaborative_recommender is None:
            return jsonify({
                'success': False,
                'error': 'Model not initialized'
            })
            
        matrix = collaborative_recommender.user_item_matrix
        
        return jsonify({
            'success': True,
            'users': [int(x) for x in matrix.index.tolist()],  # Convert to regular int
            'items': [int(x) for x in matrix.columns.tolist()],
            'matrix_sample': {
                str(idx): {
                    str(col): float(val)  # Convert to regular float
                    for col, val in row.items()
                }
                for idx, row in matrix.head().to_dict('index').items()
            },
            'matrix_stats': {
                'shape': matrix.shape,
                'non_zero_counts': int((matrix != 0).sum().sum()),
                'user_interaction_counts': {
                    int(user): int(count)
                    for user, count in (matrix != 0).sum(axis=1).items()
                }
            }
        })
        
    except Exception as e:
        logger.error(f"Error getting matrix info: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/popularity/recommend', methods=['GET', 'OPTIONS'])
def get_popularity_recommendations():
    """API để lấy popularity-based recommendations"""
    if request.method == 'OPTIONS':
        return '', 204  # Return empty response for OPTIONS request
        
    try:
        # Lấy limit từ params
        limit = int(request.args.get('limit', 8))
        
        # Lấy recommendations từ popularity recommender
        recommendations = get_recommender().recommend(
            limit=limit,
            category=request.args.get('category'),
            brand=request.args.get('brand'),
            min_price=request.args.get('min_price'),
            max_price=request.args.get('max_price')
        )
        
        # Format response
        formatted_recommendations = [{
            'product_id': rec['product_id'],
            'name': rec['name'],
            'image_url': rec['image_url'],
            'brand_name': rec['brand_name'],
            'category_name': rec['category_name'],
            'min_price': rec['min_price'],
            'max_price': rec['max_price'],
            'metrics': {
                'avg_rating': round(float(rec['avg_rating']), 1),
                'review_count': int(rec['review_count']),
                'sold_count': int(rec['sold_count'])
            }
        } for rec in recommendations]

        return jsonify({
            'success': True,
            'recommendations': formatted_recommendations,
            'metadata': {
                'source': 'popularity',
                'algorithm': 'weighted-ranking',
                'total_items': len(formatted_recommendations)
            }
        })

    except Exception as e:
        logger.error(f"Error in get_popularity_recommendations: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/content-based/recommend', methods=['GET', 'OPTIONS'])
def get_content_based_recommendations():
    if request.method == 'OPTIONS':
        return '', 204
        
    try:
        product_id = request.args.get('product_id', type=int)
        n_items = request.args.get('n_items', default=8, type=int)
        
        if not product_id:
            return jsonify({
                'success': False,
                'error': 'Missing product_id parameter'
            }), 400
            
        # Lấy recommendations từ content-based model
        recommendations = content_based_recommender.recommend(
            product_id=product_id,
            n_items=n_items
        )
        
        # Format response giống như collaborative
        formatted_recommendations = []
        conn = mysql.connector.connect(**db_config)
        
        for rec in recommendations:
            # Lấy thông tin chi tiết sản phẩm
            product_details = get_product_details(conn, [rec['id']])
            if product_details:
                product = product_details[0]
                formatted_recommendations.append({
                    'id': rec['id'],
                    'product_id': rec['id'],  # Thêm trường này để đồng nhất
                    'name': product['name'],
                    'image_url': product['image_url'],
                    'brand_name': product['brand_name'],
                    'category_name': product['category_name'],
                    'min_price': float(product['min_price']),
                    'max_price': float(product['max_price']),
                    'metrics': {
                        'avg_rating': round(float(product['avg_rating']), 1),
                        'review_count': int(product['review_count']),
                        'sold_count': int(product['sold_count'])
                    },
                    'reason': get_similarity_reason(rec['similarity_score'])
                })
        
        conn.close()

        return jsonify({
            'success': True,
            'recommendations': formatted_recommendations,
            'metadata': {
                'source': 'content-based',
                'algorithm': 'tf-idf-cosine',
                'total_items': len(formatted_recommendations)
            }
        })

    except Exception as e:
        logger.error(f"Error in content-based recommendations: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def get_similarity_reason(similarity_score):
    """Tạo lý do gợi ý dựa trên similarity score"""
    if similarity_score > 0.8:
        return 'Rất tương tự với sản phẩm bạn đang xem'
    elif similarity_score > 0.6:
        return 'Tương tự với sản phẩm bạn đang xem'
    elif similarity_score > 0.4:
        return 'Có thể bạn sẽ thích'
    return 'Sản phẩm liên quan'

def init_content_based():
    """Khởi tạo content-based recommender"""
    global content_based_recommender
    try:
        content_based_recommender = ContentBasedRecommender()
        content_based_recommender.fit()
        logger.info("Content-based model initialized successfully")
        return True
    except Exception as e:
        logger.error(f"Error initializing content-based model: {str(e)}")
        return False

if __name__ == '__main__':
    # Khởi tạo các recommender
    get_recommender()
    init_collaborative()
    init_content_based()
    
    # Thêm debug mode
    app.run(host='0.0.0.0', port=5001, debug=True)
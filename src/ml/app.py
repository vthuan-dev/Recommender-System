# src/ml/app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
from popularity_recommender import PopularityRecommender
from collaborative_recommender import CollaborativeRecommender
import mysql.connector
from datetime import datetime
import logging
import pandas as pd

app = Flask(__name__)
# Cấu hình logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# CORS config giữ nguyên
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:8080", "http://localhost:3000", "http://localhost:5173"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
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
        return '', 204
        
    try:
        # Lấy các tham số từ query string
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 8))
        category = request.args.get('category')
        brand = request.args.get('brand')
        min_price = request.args.get('min_price')
        max_price = request.args.get('max_price')
        
        # Lấy recommender từ cache
        recommender = get_recommender()
        
        # Lấy recommendations với các bộ lọc
        recommendations = recommender.recommend(
            limit=limit,
            category=category,
            brand=brand, 
            min_price=min_price,
            max_price=max_price
        )
        
        # Tính toán phân trang
        total_items = len(recommendations)
        total_pages = (total_items + limit - 1) // limit
        
        # Lọc và format lại recommendations trước khi trả về
        formatted_recommendations = [{
            'product_id': rec['product_id'],
            'name': rec['name'],
            'brand_name': rec['brand_name'],
            'category_name': rec['category_name'],
            'image_url': rec['image_url'],
            'min_price': rec['min_price'],
            'max_price': rec['max_price'],
            'metrics': {
                'avg_rating': round(rec['avg_rating'], 1),
                'review_count': rec['review_count'],
                'sold_count': rec['sold_count']
            },
            'reason': rec['reason']
        } for rec in recommendations]

        response = jsonify({
            'success': True,
            'recommendations': formatted_recommendations,
            'metadata': {
                'page': page,
                'limit': limit,
                'total_items': total_items,
                'total_pages': total_pages,
                'last_trained': last_train_time.isoformat() if last_train_time else None
            }
        })
        
        return response
        
    except Exception as e:
        logger.error(f"Error in get_recommended_products: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
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

@app.route('/api/collaborative/recommend', methods=['GET'])
def get_collaborative_recommendations():
    """API để lấy collaborative recommendations"""
    try:
        # Kiểm tra user_id
        user_id = request.args.get('user_id')
        if not user_id:
            return jsonify({'error': 'Missing user_id parameter'}), 400
            
        # Kiểm tra model đã được train chưa
        if collaborative_recommender is None:
            return jsonify({'error': 'Model not trained yet'}), 400
            
        # Lấy recommendations
        recommendations = collaborative_recommender.recommend(
            user_id=int(user_id),
            n_items=8
        )
        
        # Query thông tin chi tiết sản phẩm
        conn = mysql.connector.connect(**db_config)
        product_details = get_product_details(conn, recommendations)
        conn.close()
        
        return jsonify({
            'success': True,
            'recommendations': product_details
        })
        
    except Exception as e:
        logger.error(f"Error in get_collaborative_recommendations: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/collaborative/status', methods=['GET'])
def get_collaborative_status():
    """API để kiểm tra trạng thái c���a collaborative model"""
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
    """Kiểm tra user có đủ tương tác không"""
    try:
        conn = mysql.connector.connect(**db_config)
        query = """
            SELECT 
                COUNT(DISTINCT product_id) as product_count,
                SUM(view_count) as total_views
            FROM user_product_views
            WHERE user_id = %s
        """
        df = pd.read_sql(query, conn, params=[user_id])
        conn.close()
        
        # Điều kiện để coi là đủ tương tác
        min_products = 3  # Ít nhất tương tác với 3 sản phẩm
        min_views = 5     # Ít nhất 5 lượt xem
        
        return (
            df['product_count'].iloc[0] >= min_products and 
            df['total_views'].iloc[0] >= min_views
        )
        
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

if __name__ == '__main__':
    # Khởi tạo recommender lần đầu
    get_recommender()
    init_collaborative()  # Collaborative model

    app.run(host='0.0.0.0', port=5001, debug=True)
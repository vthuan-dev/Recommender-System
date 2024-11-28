# src/ml/app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
from popularity_recommender import PopularityRecommender
from collaborative_recommender import CollaborativeRecommender
import mysql.connector
from datetime import datetime
import logging

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

if __name__ == '__main__':
    # Khởi tạo recommender lần đầu
    get_recommender()
    app.run(host='0.0.0.0', port=5001, debug=True)
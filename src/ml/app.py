# src/ml/app.py
from flask import Flask, jsonify
import pandas as pd
import mysql.connector
from popularity_recommender import PopularityRecommender
import joblib
from flask_caching import Cache

app = Flask(__name__)

# Load pre-trained model
try:
    model = joblib.load('popularity_model_improved.joblib')
    print("Loaded pre-trained model successfully!")
except Exception as e:
    print(f"Error loading model: {str(e)}")
    model = None

# Config database 
db_config = {
    'host': 'localhost',
    'user': 'root', 
    'password': '100103',
    'database': 'NLCN',
    'port': 3307,
    'auth_plugin': 'mysql_native_password'
}

# Thêm caching để tránh query database quá nhiều
cache = Cache(app, config={'CACHE_TYPE': 'simple'})

@app.route('/api/recommendations', methods=['GET'])
@cache.cached(timeout=300)
def get_recommendations():
    try:
        # 1. Lấy dữ liệu ratings
        conn = mysql.connector.connect(**db_config)
        query = """
            SELECT 
                r.product_id as ProductId,
                r.user_id as UserId, 
                r.rating as Rating
            FROM reviews r
            WHERE r.rating IS NOT NULL
        """
        ratings_df = pd.read_sql(query, conn)
        
        # 2. Lấy recommendations từ model
        recommendations = model.recommend(n_items=10)
        
        # Lấy top 10 sản phẩm có nhiều đánh giá và rating cao
        fallback_query = """
            SELECT 
                p.id,
                p.name,
                p.image_url,
                b.name as brand_name,
                MIN(pv.price) as min_price,
                MAX(pv.price) as max_price,
                COUNT(r.id) as rating_count,
                AVG(r.rating) as avg_rating
            FROM products p
            LEFT JOIN brands b ON p.brand_id = b.id 
            LEFT JOIN productvariants pv ON p.id = pv.product_id
            LEFT JOIN reviews r ON p.id = r.product_id
            GROUP BY p.id, p.name, p.image_url, b.name
            HAVING rating_count > 0
            ORDER BY avg_rating DESC, rating_count DESC
            LIMIT 10
        """
        
        products_df = pd.read_sql(fallback_query, conn)
        
        # 3. Format kết quả
        result = []
        for _, product in products_df.iterrows():
            result.append({
                'id': int(product['id']),
                'name': str(product['name']),
                'brand': str(product['brand_name']),
                'image_url': str(product['image_url']),
                'price_range': {
                    'min': float(product['min_price']) if pd.notnull(product['min_price']) else 0,
                    'max': float(product['max_price']) if pd.notnull(product['max_price']) else 0
                },
                'metrics': {
                    'rating_count': int(product['rating_count']),
                    'avg_rating': float(product['avg_rating'])
                }
            })
        
        # Log thông tin để debug
        print("Ratings data:")
        print(ratings_df.describe())
        
        print("Products data:")
        print(products_df)
        
        return jsonify({
            'success': True,
            'recommendations': result,
            'metrics': {
                'total_products': int(len(ratings_df['ProductId'].unique())),
                'total_users': int(len(ratings_df['UserId'].unique())),
                'total_ratings': int(len(ratings_df))
            }
        })

    except Exception as e:
        print(f"Error in get_recommendations: {str(e)}")
        return jsonify({
            'error': str(e)
        }), 500

# Thêm route để test diverse recommendations
@app.route('/api/recommendations/diverse', methods=['GET'])
def get_diverse_recommendations():
    try:
        conn = mysql.connector.connect(**db_config)
        
        # 1. Lấy thông tin sản phẩm kèm ratings
        products_query = """
            SELECT 
                p.id as product_id,
                p.brand_id,
                b.name as brand_name,
                MIN(pv.price) as min_price,
                MAX(pv.price) as max_price,
                COUNT(DISTINCT pv.id) as variant_count,
                COALESCE(COUNT(DISTINCT r.id), 0) as review_count,
                COALESCE(AVG(r.rating), 0) as avg_rating,
                COALESCE(COUNT(DISTINCT r.user_id), 0) as unique_users
            FROM products p
            JOIN productvariants pv ON p.id = pv.product_id
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN reviews r ON p.id = r.product_id
            GROUP BY p.id, p.brand_id, b.name
            HAVING variant_count > 0
        """
        
        products_df = pd.read_sql(products_query, conn)
        
        # 2. Tính popularity score với xử lý NaN
        # Đảm bảo không có giá trị NaN trong các cột metrics
        products_df['review_count'] = products_df['review_count'].fillna(0)
        products_df['avg_rating'] = products_df['avg_rating'].fillna(0)
        products_df['unique_users'] = products_df['unique_users'].fillna(0)
        
        # Normalize các metrics
        for col in ['review_count', 'avg_rating', 'unique_users']:
            max_val = products_df[col].max()
            if max_val > 0:  # Chỉ normalize nếu có giá trị > 0
                products_df[f'{col}_norm'] = products_df[col] / max_val
            else:
                products_df[f'{col}_norm'] = 0
        
        # Tính popularity score
        products_df['popularity_score'] = (
            0.4 * products_df['avg_rating_norm'] +
            0.3 * products_df['review_count_norm'] +
            0.3 * products_df['unique_users_norm']
        )
        
        # Đảm bảo popularity score không bị NaN
        products_df['popularity_score'] = products_df['popularity_score'].fillna(0)
        
        # 3. Phân nhóm theo giá
        products_df['price_segment'] = pd.qcut(
            products_df['min_price'], 
            q=3, 
            labels=['Budget', 'Mid-range', 'Premium'],
            duplicates='drop'  # Xử lý trường hợp giá trùng nhau
        )
        
        # 4. Lấy sản phẩm từ mỗi phân khúc
        recommendations = []
        items_per_segment = {
            'Premium': 4,
            'Mid-range': 4,
            'Budget': 2
        }
        
        for segment, n_items in items_per_segment.items():
            segment_products = products_df[
                products_df['price_segment'] == segment
            ].sort_values(['popularity_score', 'min_price'], ascending=[False, True])
            
            selected_brands = set()
            selected_products = []
            
            for _, product in segment_products.iterrows():
                if len(selected_products) >= n_items:
                    break
                    
                if product['brand_id'] not in selected_brands or \
                   len([p for p in selected_products if p['brand_id'] == product['brand_id']]) < 2:
                    selected_products.append({
                        'id': int(product['product_id']),
                        'brand_id': product['brand_id'],
                        'brand_name': product['brand_name'],
                        'min_price': float(product['min_price']),
                        'max_price': float(product['max_price']),
                        'metrics': {
                            'avg_rating': float(product['avg_rating']),
                            'review_count': int(product['review_count']),
                            'popularity_score': float(product['popularity_score'])
                        }
                    })
                    selected_brands.add(product['brand_id'])
            
            recommendations.extend(selected_products)
        
        # 5. Lấy thông tin chi tiết
        result = []
        for rec in recommendations:
            product_query = """
                SELECT name, image_url
                FROM products
                WHERE id = %s
            """
            cursor = conn.cursor(dictionary=True)
            cursor.execute(product_query, (rec['id'],))
            product_info = cursor.fetchone()
            
            result.append({
                'id': rec['id'],
                'name': product_info['name'],
                'brand': rec['brand_name'],
                'image_url': product_info['image_url'],
                'price_range': {
                    'min': rec['min_price'],
                    'max': rec['max_price']
                },
                'metrics': rec['metrics']
            })
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'diverse_recommendations': result
        })
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({
            'error': f'Error: {str(e)}'
        }), 500

def get_fallback_recommendations():
    """Get recommendations khi không đủ data"""
    query = """
        SELECT 
            p.id,
            p.name,
            p.image_url,
            b.name as brand_name,
            MIN(pv.price) as min_price,
            MAX(pv.price) as max_price,
            COUNT(r.id) as review_count,
            AVG(COALESCE(r.rating, 0)) as avg_rating
        FROM products p
        LEFT JOIN brands b ON p.brand_id = b.id 
        LEFT JOIN productvariants pv ON p.id = pv.product_id
        LEFT JOIN reviews r ON p.id = r.product_id
        GROUP BY p.id
        ORDER BY review_count DESC, avg_rating DESC
        LIMIT 10
    """

if __name__ == '__main__':
    app.run(debug=True, port=5000)
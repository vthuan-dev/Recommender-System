# src/ml/app.py
from flask import Flask, jsonify
import pandas as pd
import mysql.connector
from popularity_recommender import PopularityRecommender
import joblib

app = Flask(__name__)

# Kết nối MySQL
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '100103',
    'database': 'NLCN'
}

def get_data_from_db():
    """Lấy dữ liệu từ CSDL"""
    try:
        conn = mysql.connector.connect(**db_config)
        # Tạo DataFrame từ reviews, products và users
        query = """
            SELECT 
                r.product_id as ProductId,
                r.user_id as UserId,
                r.rating as Rating,
                r.created_at,
                p.name as ProductName,
                p.image_url,
                b.name as BrandName,
                MIN(pv.price) as MinPrice,
                MAX(pv.price) as MaxPrice
            FROM reviews r
            JOIN products p ON r.product_id = p.id
            LEFT JOIN brands b ON p.brand_id = b.id
            LEFT JOIN productvariants pv ON p.id = pv.product_id
            GROUP BY r.id, p.id
        """
        df = pd.read_sql(query, conn)
        return df
    except Exception as e:
        print(f"Error getting data: {str(e)}")
        return None
    finally:
        if conn:
            conn.close()

@app.route('/api/recommendations/test', methods=['GET'])
def test_recommendations():
    try:
        # 1. Lấy dữ liệu
        ratings_df = get_data_from_db()
        if ratings_df is None or len(ratings_df) == 0:
            return jsonify({
                'error': 'Không có đủ dữ liệu để đưa ra gợi ý'
            }), 400

        # 2. Train model
        recommender = PopularityRecommender()
        recommender.fit(ratings_df)

        # 3. Lấy recommendations
        recommendations = recommender.recommend(n_items=10, min_ratings=5)
        
        # 4. Lấy thông tin chi tiết sản phẩm
        recommended_products = ratings_df[
            ratings_df['ProductId'].isin(recommendations.index)
        ].drop_duplicates('ProductId')

        # 5. Format kết quả
        result = []
        for _, product in recommended_products.iterrows():
            result.append({
                'id': int(product['ProductId']),
                'name': product['ProductName'],
                'brand': product['BrandName'],
                'image_url': product['image_url'],
                'min_price': float(product['MinPrice']),
                'max_price': float(product['MaxPrice']),
                'rating_count': int(ratings_df[
                    ratings_df['ProductId'] == product['ProductId']
                ].shape[0]),
                'avg_rating': float(ratings_df[
                    ratings_df['ProductId'] == product['ProductId']
                ]['Rating'].mean())
            })

        return jsonify({
            'success': True,
            'recommendations': result,
            'metrics': {
                'total_products': len(ratings_df['ProductId'].unique()),
                'total_users': len(ratings_df['UserId'].unique()),
                'total_ratings': len(ratings_df)
            }
        })

    except Exception as e:
        return jsonify({
            'error': f'Lỗi khi tạo recommendations: {str(e)}'
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
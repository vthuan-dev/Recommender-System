from ml.content_based_recommender import ContentBasedRecommender

# Khởi tạo Content-based Recommender
content_based_recommender = ContentBasedRecommender()
content_based_recommender.fit()

@app.route('/api/recommendations/content-based/<int:product_id>', methods=['GET'])
def get_content_based_recommendations(product_id):
    try:
        n_items = request.args.get('n_items', default=4, type=int)
        
        # Lấy recommendations từ content-based model
        recommendations = content_based_recommender.recommend(product_id, n_items=n_items)
        
        if not recommendations:
            return jsonify({
                'success': False,
                'message': 'No recommendations found'
            })

        # Format response
        formatted_recommendations = []
        for rec in recommendations:
            # Lấy thêm thông tin sản phẩm từ database nếu cần
            product_query = """
                SELECT 
                    p.id,
                    p.name,
                    p.image_url,
                    p.description,
                    MIN(pv.price) as min_price,
                    MAX(pv.price) as max_price,
                    b.name as brand_name,
                    c.name as category_name,
                    COALESCE(AVG(r.rating), 0) as avg_rating,
                    COUNT(r.id) as review_count
                FROM products p
                LEFT JOIN productvariants pv ON p.id = pv.product_id
                LEFT JOIN brands b ON p.brand_id = b.id
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN reviews r ON p.id = r.product_id
                WHERE p.id = %s
                GROUP BY p.id, b.name, c.name
            """
            cursor = mysql.connection.cursor(dictionary=True)
            cursor.execute(product_query, (rec['id'],))
            product_info = cursor.fetchone()
            cursor.close()

            if product_info:
                formatted_recommendations.append({
                    'id': rec['id'],
                    'name': product_info['name'],
                    'image_url': product_info['image_url'],
                    'min_price': float(product_info['min_price']),
                    'max_price': float(product_info['max_price']),
                    'brand_name': product_info['brand_name'],
                    'category_name': product_info['category_name'],
                    'similarity_score': float(rec['similarity_score']),
                    'metrics': {
                        'avg_rating': float(product_info['avg_rating']),
                        'review_count': int(product_info['review_count'])
                    }
                })

        return jsonify({
            'success': True,
            'recommendations': formatted_recommendations
        })

    except Exception as e:
        app.logger.error(f"Error in content-based recommendations: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500 
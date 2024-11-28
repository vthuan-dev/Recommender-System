from src.ml.content_based_recommender import ContentBasedRecommender
import logging
import pandas as pd

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_model():
    try:
        # 1. Khởi tạo và train model
        logger.info("Initializing and training model...")
        recommender = ContentBasedRecommender()
        recommender.fit()  # Không cần truyền conn nữa

        # 2. Test với một số sản phẩm mẫu
        test_products = get_test_products(recommender.conn)
        
        logger.info("\nTesting recommendations for sample products:")
        for product_id in test_products['id']:
            print("\n" + "="*50)
            print(f"Product ID: {product_id}")
            
            # Lấy thông tin sản phẩm gốc
            product = recommender._get_product_details(product_id)
            print(f"Original Product: {product['name']}")
            print(f"Category: {product['category_name']}")
            print(f"Brand: {product['brand_name']}")
            
            # Lấy recommendations
            recommendations = recommender.recommend(product_id, n_items=5)
            
            print("\nTop 5 Recommendations:")
            for rec in recommendations:
                print(f"- {rec['name']}")
                print(f"  Similarity: {rec['similarity_score']:.2f}")
                print(f"  Category: {rec['category']}")
                print(f"  Brand: {rec['brand']}")
                print(f"  Price: {rec['price']:,.0f} VND")

        # 3. In thống kê model
        evaluate_model_stats(recommender)

        # Đánh giá model
        print("\nModel Evaluation:")
        print("=" * 50)

        # Đánh giá metrics
        metrics = recommender.evaluate_model(k=5)
        print("\nMetrics:")
        for metric, value in metrics.items():
            if metric != 'price_distribution':
                print(f"- {metric}: {value:.2f}")

        if 'price_distribution' in metrics:
            print("\nPrice Range Distribution:")
            for range_name, ratio in metrics['price_distribution'].items():
                print(f"- {range_name}: {ratio:.2f}")

        # Đánh giá phân phối similarity
        dist = recommender.evaluate_similarity_distribution()
        print("\nSimilarity Distribution:")
        for metric, value in dist.items():
            print(f"- {metric}: {value:.2f}")

    except Exception as e:
        logger.error(f"Error in testing: {str(e)}")
        raise e

def get_test_products(conn, n_samples=3):
    """Lấy một số sản phẩm mẫu để test"""
    query = """
        SELECT DISTINCT p.id, p.name, c.name as category_name
        FROM products p
        JOIN categories c ON p.category_id = c.id
        JOIN productvariants pv ON p.id = pv.product_id
        WHERE p.description IS NOT NULL
        ORDER BY RAND()
        LIMIT %s
    """
    return pd.read_sql(query, conn, params=[n_samples])

def evaluate_model_stats(recommender):
    """In thống kê về model"""
    print("\nModel Statistics:")
    print(f"Total products: {len(recommender.product_features)}")
    print(f"TF-IDF matrix shape: {recommender.tfidf_matrix.shape}")
    
    # Phân tích categories
    category_stats = recommender.product_features['category_name'].value_counts()
    print("\nProducts per category:")
    for category, count in category_stats.items():
        print(f"- {category}: {count}")

if __name__ == "__main__":
    try:
        test_model()
    except Exception as e:
        logger.error(f"Test failed: {str(e)}")
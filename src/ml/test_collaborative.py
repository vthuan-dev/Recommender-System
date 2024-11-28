import mysql.connector
from collaborative_recommender import CollaborativeRecommender
import logging
import pandas as pd
from sklearn.metrics import mean_squared_error
import numpy as np

# Cấu hình logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Config database
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '100103', 
    'database': 'NLCN',
    'port': 3307
}

def test_collaborative_recommender():
    try:
        # 1. Kết nối database
        logger.info("Connecting to database...")
        conn = mysql.connector.connect(**db_config)

        # 2. Khởi tạo và train model
        logger.info("Training collaborative recommender...")
        recommender = CollaborativeRecommender()
        recommender.fit(conn)

        # 3. Kiểm tra kích thước ma trận
        logger.info(f"User-Item Matrix Shape: {recommender.user_item_matrix.shape}")
        logger.info(f"Number of users: {len(recommender.user_item_matrix.index)}")
        logger.info(f"Number of items: {len(recommender.user_item_matrix.columns)}")

        # 4. Test với một số user
        test_users = recommender.user_item_matrix.index[:5]
        for user_id in test_users:
            recs = recommender.recommend(user_id, n_items=5)
            
            # Sửa lại query để chỉ rõ p.id
            products_query = f"""
                SELECT 
                    p.id as product_id,
                    p.name as product_name,
                    b.name as brand_name,
                    c.name as category_name
                FROM products p
                JOIN brands b ON p.brand_id = b.id
                JOIN categories c ON p.category_id = c.id
                WHERE p.id IN ({','.join(map(str, recs))})
            """
            products_df = pd.read_sql(products_query, conn)
            
            logger.info(f"\nRecommendations for user {user_id}:")
            for _, product in products_df.iterrows():
                logger.info(
                    f"- {product['product_name']} "
                    f"({product['brand_name']}, {product['category_name']})"
                )

        # 5. Đánh giá độ chính xác
        if len(recommender.user_item_matrix.index) > 1:
            test_ratio = 0.2
            test_mask = np.random.rand(*recommender.user_item_matrix.shape) < test_ratio
            train = recommender.user_item_matrix.copy()
            test = recommender.user_item_matrix.copy()
            
            train[test_mask] = 0
            test[~test_mask] = 0
            
            recommender = CollaborativeRecommender()
            recommender.user_item_matrix = train
            recommender.fit(conn)
            
            predictions = []
            actuals = []
            
            for user_id in recommender.user_item_matrix.index:
                if user_id in test.index:
                    pred = recommender.recommend(user_id)
                    if pred:  # Chỉ tính khi có predictions
                        # Sử dụng numpy thay vì pandas nonzero()
                        user_interactions = test.loc[user_id].to_numpy()
                        actual = np.where(user_interactions > 0)[0]
                        
                        predictions.extend([1] * len(pred))
                        actuals.extend([1 if i in actual else 0 for i in pred])
            
            if predictions and actuals:  # Chỉ tính MSE khi có dữ liệu
                mse = mean_squared_error(actuals, predictions)
                logger.info(f"\nMean Squared Error: {mse:.4f}")
                
                # Thêm thông tin chi tiết
                logger.info(f"Number of predictions: {len(predictions)}")
                logger.info(f"Number of actual interactions: {sum(actuals)}")
                logger.info(f"Prediction accuracy: {(1 - mse) * 100:.2f}%")
            else:
                logger.warning("Not enough data to calculate MSE")

        # 6. Đóng kết nối
        conn.close()
        logger.info("\nTest completed successfully!")

    except Exception as e:
        logger.error(f"Error during testing: {str(e)}")
        raise e

if __name__ == "__main__":
    test_collaborative_recommender() 
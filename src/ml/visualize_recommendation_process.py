import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from collaborative_recommender import CollaborativeRecommender
import mysql.connector

def visualize_recommendation_process():
    """Visualize quá trình tính toán và đưa ra gợi ý"""
    try:
        # Kết nối database
        conn = mysql.connector.connect(
            host='localhost',
            user='root', 
            password='100103',
            database='NLCN',
            port=3307
        )
        model = CollaborativeRecommender()
        model.fit(conn)
        
        # Chọn một user để demo
        test_user_idx = 5  # Có thể thay đổi user index
        
        # Lấy các ma trận
        U = model.user_factors
        V = model.item_factors.T
        user_vector = U[test_user_idx]
        
        # Tính predicted ratings
        predicted_ratings = user_vector.dot(V)
        actual_ratings = model.user_item_matrix.iloc[test_user_idx].values
        
        # Tạo figure
        plt.figure(figsize=(20, 15))
        
        # 1. User latent factors
        plt.subplot(3, 2, 1)
        plt.bar(range(len(user_vector)), user_vector)
        plt.title('User Latent Factors', fontsize=14, pad=20)
        plt.xlabel('Factor Index')
        plt.ylabel('Weight')
        
        # 2. Item factors heatmap
        plt.subplot(3, 2, 2)
        sns.heatmap(V[:, :50], cmap='coolwarm', center=0)
        plt.title('Item Factors (first 50 items)', fontsize=14, pad=20)
        
        # 3. Actual vs Predicted Ratings
        plt.subplot(3, 2, 3)
        x = range(len(predicted_ratings))
        plt.plot(x, actual_ratings, 'b.', label='Actual', alpha=0.5)
        plt.plot(x, predicted_ratings, 'r.', label='Predicted', alpha=0.5)
        plt.title('Actual vs Predicted Ratings', fontsize=14, pad=20)
        plt.xlabel('Item Index')
        plt.ylabel('Rating')
        plt.legend()
        
        # 4. Top Recommendations
        plt.subplot(3, 2, 4)
        # Mask đã tương tác
        mask = actual_ratings == 0
        masked_predictions = predicted_ratings.copy()
        masked_predictions[~mask] = -1
        
        top_k = 10
        top_indices = np.argsort(masked_predictions)[-top_k:][::-1]
        top_scores = masked_predictions[top_indices]
        
        plt.barh(range(top_k), top_scores)
        plt.yticks(range(top_k), [f'Item {i}' for i in top_indices])
        plt.title(f'Top {top_k} Recommendations', fontsize=14, pad=20)
        plt.xlabel('Predicted Rating')
        
        # 5. Rating Distribution
        plt.subplot(3, 2, 5)
        plt.hist(predicted_ratings[mask], bins=30, alpha=0.5, label='Predicted')
        plt.hist(actual_ratings[actual_ratings > 0], bins=30, alpha=0.5, label='Actual')
        plt.title('Rating Distribution', fontsize=14, pad=20)
        plt.xlabel('Rating')
        plt.ylabel('Count')
        plt.legend()
        
        # 6. Confidence Analysis
        plt.subplot(3, 2, 6)
        confidence = np.abs(predicted_ratings - np.mean(predicted_ratings))
        confidence = confidence / np.max(confidence)
        plt.hist(confidence[mask], bins=30)
        plt.title('Prediction Confidence Distribution', fontsize=14, pad=20)
        plt.xlabel('Confidence Score')
        plt.ylabel('Count')
        
        plt.suptitle(f'Recommendation Process for User {test_user_idx}', fontsize=16, y=0.95)
        plt.tight_layout(rect=[0, 0.03, 1, 0.95])
        
        # Print recommendation details
        print("\nTop Recommendations Details:")
        for i, idx in enumerate(top_indices):
            print(f"{i+1}. Item {idx}: Predicted Rating = {masked_predictions[idx]:.2f}")
        
        # Print some statistics
        print("\nRecommendation Statistics:")
        print(f"Average predicted rating: {np.mean(predicted_ratings):.2f}")
        print(f"Number of items not yet rated: {np.sum(mask)}")
        print(f"Average confidence score: {np.mean(confidence):.2f}")
        
        plt.show()
        conn.close()
        
    except Exception as e:
        print(f"Error in recommendation visualization: {str(e)}")
        raise e

if __name__ == '__main__':
    visualize_recommendation_process() 
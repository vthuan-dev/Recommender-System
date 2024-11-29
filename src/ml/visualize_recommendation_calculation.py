import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import mysql.connector
from collaborative_recommender import CollaborativeRecommender

def visualize_recommendation_calculation(user_id=10):  # Default user_id = 5
    """Visualize quá trình tính toán recommendations"""
    try:
        # Kết nối database và khởi tạo model
        conn = mysql.connector.connect(
            host='localhost',
            user='root', 
            password='100103',
            database='NLCN',
            port=3307
        )
        
        # Khởi tạo và fit model
        model = CollaborativeRecommender()
        model.fit(conn)
        
        # Lấy data
        user_vector = model.user_factors[user_id]
        item_factors = model.item_factors.T
        
        # Tạo figure
        plt.figure(figsize=(15, 10))
        
        # 1. User vector
        plt.subplot(2, 2, 1)
        plt.bar(range(len(user_vector)), user_vector)
        plt.title('User Latent Vector')
        plt.xlabel('Factor Index')
        plt.ylabel('Weight')
        
        # 2. Matrix multiplication visualization
        plt.subplot(2, 2, 2)
        predicted_ratings = user_vector.dot(item_factors)
        plt.plot(predicted_ratings, 'b.')
        plt.title('Predicted Ratings\n(User Vector * Item Factors)')
        plt.xlabel('Item Index')
        plt.ylabel('Predicted Rating')
        
        # 3. Top recommendations
        plt.subplot(2, 2, 3)
        actual_ratings = model.user_item_matrix.iloc[user_id].values
        mask = actual_ratings == 0
        masked_predictions = predicted_ratings.copy()
        masked_predictions[~mask] = -np.inf
        
        top_k = 10
        top_indices = np.argsort(masked_predictions)[-top_k:][::-1]
        top_scores = masked_predictions[top_indices]
        
        plt.barh(range(top_k), top_scores)
        plt.yticks(range(top_k), [f'Item {i}' for i in top_indices])
        plt.title('Top 10 Recommendations')
        plt.xlabel('Predicted Rating')
        
        # 4. Confidence scores
        plt.subplot(2, 2, 4)
        confidence = np.abs(predicted_ratings - np.mean(predicted_ratings))
        confidence = confidence / np.max(confidence)
        plt.hist(confidence[mask], bins=20)
        plt.title('Prediction Confidence Distribution')
        plt.xlabel('Confidence Score')
        plt.ylabel('Count')
        
        plt.suptitle(f'Recommendation Calculation Process for User {user_id}', 
                    fontsize=16, y=1.02)
        plt.tight_layout()
        
        # Print recommendation details
        print("\nRecommendation Details:")
        print(f"User {user_id} - Calculation Process")
        print("-" * 40)
        print("\nStep 1: User Vector Shape:", user_vector.shape)
        print("Step 2: Item Factors Shape:", item_factors.shape)
        print("Step 3: Predicted Ratings Shape:", predicted_ratings.shape)
        print(f"Step 4: Number of unrated items: {np.sum(mask)}")
        
        print("\nTop 10 Recommendations:")
        for i, (idx, score) in enumerate(zip(top_indices, top_scores)):
            print(f"{i+1}. Item {idx}: Score = {score:.3f}")
            
        print("\nConfidence Statistics:")
        print(f"Average confidence: {np.mean(confidence):.3f}")
        print(f"Max confidence: {np.max(confidence):.3f}")
        print(f"Min confidence: {np.min(confidence):.3f}")
        
        plt.show()
        conn.close()
        
    except Exception as e:
        print(f"Error in visualization: {str(e)}")
        raise e

if __name__ == '__main__':
    visualize_recommendation_calculation()  # Có thể truyền user_id khác
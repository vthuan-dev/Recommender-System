import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from collaborative_recommender import CollaborativeRecommender
from sklearn.metrics.pairwise import cosine_similarity
import mysql.connector

# Config database
db_config = {
    'host': 'localhost',
    'user': 'root', 
    'password': '100103',
    'database': 'NLCN',
    'port': 3307,
    'auth_plugin': 'mysql_native_password'
}

def visualize_collaborative_analytics():
    """Visualize các khía cạnh của Collaborative Filtering"""
    try:
        # Kết nối DB và khởi tạo model
        conn = mysql.connector.connect(**db_config)
        model = CollaborativeRecommender()
        model.fit(conn)
        
        # Tạo figure với subplot layout
        plt.style.use('default')
        fig = plt.figure(figsize=(20, 15))
        
        # 1. Phân phối số lượng tương tác của users
        plt.subplot(2, 3, 1)
        user_interactions = (model.user_item_matrix > 0).sum(axis=1)
        sns.histplot(data=user_interactions, bins=30)
        plt.title('Phân phối số lượng tương tác của Users', fontsize=12, pad=10)
        plt.xlabel('Số lượng tương tác')
        plt.ylabel('Số lượng Users')
        
        # 2. Phân phối số lượng tương tác của items
        plt.subplot(2, 3, 2)
        item_interactions = (model.user_item_matrix > 0).sum(axis=0)
        sns.histplot(data=item_interactions, bins=30)
        plt.title('Phân phối số lượng tương tác của Items', fontsize=12, pad=10)
        plt.xlabel('Số lượng tương tác')
        plt.ylabel('Số lượng Items')
        
        # 3. Heatmap ma trận tương tác (sample)
        plt.subplot(2, 3, 3)
        sample_size = min(50, len(model.user_item_matrix))
        interaction_sample = model.user_item_matrix.iloc[:sample_size, :sample_size]
        sns.heatmap(interaction_sample, cmap='YlOrRd')
        plt.title('Heatmap ma trận tương tác (sample)', fontsize=12, pad=10)
        
        # 4. Phân phối các giá trị singular
        plt.subplot(2, 3, 4)
        if len(model.user_factors) > 0:
            U, sigma, Vt = np.linalg.svd(model.user_item_matrix.fillna(0))
            plt.plot(sigma[:30], 'bo-')
            plt.title('Phân phối Singular Values', fontsize=12, pad=10)
            plt.xlabel('Index')
            plt.ylabel('Singular Value')
        
        # 5. Sparsity Analysis
        plt.subplot(2, 3, 5)
        sparsity = (model.user_item_matrix == 0).sum().sum() / (model.user_item_matrix.shape[0] * model.user_item_matrix.shape[1])
        labels = ['Có tương tác', 'Không có tương tác']
        sizes = [(1-sparsity)*100, sparsity*100]
        plt.pie(sizes, labels=labels, autopct='%1.1f%%')
        plt.title('Phân tích Sparsity của Ma trận', fontsize=12, pad=10)
        
        # 6. User Similarity Distribution
        plt.subplot(2, 3, 6)
        if len(model.user_factors) > 0:
            sample_users = min(100, len(model.user_factors))
            user_similarities = cosine_similarity(model.user_factors[:sample_users])
            similarities = user_similarities[np.triu_indices(len(user_similarities), k=1)]
            sns.histplot(data=similarities, bins=30)
            plt.title('Phân phối User Similarity', fontsize=12, pad=10)
            plt.xlabel('Cosine Similarity')
            plt.ylabel('Frequency')
        
        # Thêm tiêu đề chung và điều chỉnh layout
        plt.suptitle('Collaborative Filtering Analytics', fontsize=16, y=1.02)
        plt.tight_layout()
        
        # Hiển thị
        plt.show()
        
        # Thêm một số thống kê
        print("\nThống kê chi tiết:")
        print(f"Số lượng Users: {len(model.user_item_matrix)}")
        print(f"Số lượng Items: {len(model.user_item_matrix.columns)}")
        print(f"Sparsity: {sparsity*100:.2f}%")
        print(f"Trung bình tương tác/user: {user_interactions.mean():.2f}")
        print(f"Trung bình tương tác/item: {item_interactions.mean():.2f}")
        
        conn.close()
        
    except Exception as e:
        print(f"Error generating analytics: {str(e)}")
        raise e

if __name__ == '__main__':
    visualize_collaborative_analytics() 
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from collaborative_recommender import CollaborativeRecommender
import mysql.connector

def visualize_svd_process():
    """Visualize quá trình SVD và matrix factorization"""
    try:
        # Kết nối và setup model như cũ
        conn = mysql.connector.connect(
            host='localhost',
            user='root', 
            password='100103',
            database='NLCN',
            port=3307
        )
        model = CollaborativeRecommender()
        model.fit(conn)
        
        # Chuẩn bị data như cũ
        original_matrix = model.user_item_matrix.fillna(0).values
        U, sigma, Vt = np.linalg.svd(original_matrix)
        Sigma = np.zeros((U.shape[1], Vt.shape[0]))
        np.fill_diagonal(Sigma, sigma)
        k = 10
        U_k = U[:, :k]
        Sigma_k = Sigma[:k, :k]
        Vt_k = Vt[:k, :]
        reconstructed = U_k.dot(Sigma_k).dot(Vt_k)

        # Tạo figure với layout mới
        fig = plt.figure(figsize=(20, 25))
        
        # 1. Ma trận gốc
        plt.subplot(3, 2, 1)
        sns.heatmap(original_matrix[:50, :50], cmap='YlOrRd')
        plt.title('Ma trận User-Item gốc (50x50)', fontsize=14, pad=20)
        
        # 2. Ma trận U
        plt.subplot(3, 2, 2)
        sns.heatmap(U_k[:50, :], cmap='coolwarm', center=0)
        plt.title(f'Ma trận U (User factors, first {k} components)', fontsize=14, pad=20)
        
        # 3. Ma trận Sigma
        plt.subplot(3, 2, 3)
        sns.heatmap(Sigma_k, cmap='YlOrRd')
        plt.title(f'Ma trận Sigma (first {k} values)', fontsize=14, pad=20)
        
        # 4. Ma trận V transpose
        plt.subplot(3, 2, 4)
        sns.heatmap(Vt_k[:, :50], cmap='coolwarm', center=0)
        plt.title(f'Ma trận V transpose (Item factors, first {k} components)', fontsize=14, pad=20)
        
        # 5. Ma trận tái tạo
        plt.subplot(3, 2, 5)
        sns.heatmap(reconstructed[:50, :50], cmap='YlOrRd')
        plt.title('Ma trận tái tạo (50x50)', fontsize=14, pad=20)
        
        # 6. Phân phối singular values
        plt.subplot(3, 2, 6)
        plt.plot(sigma[:30], 'bo-', linewidth=2, markersize=8)
        plt.title('Phân phối Singular Values', fontsize=14, pad=20)
        plt.xlabel('Index', fontsize=12)
        plt.ylabel('Value', fontsize=12)
        plt.grid(True)
        
        # Điều chỉnh layout
        plt.suptitle('SVD Process Visualization', fontsize=20, y=0.95)
        plt.tight_layout(rect=[0, 0.03, 1, 0.95])  # Điều chỉnh khoảng cách
        
        # Thêm spacing giữa các subplots
        plt.subplots_adjust(hspace=0.3, wspace=0.3)
        
        plt.show()
        
        # In thông tin thống kê
        print("\nThông tin về SVD:")
        print(f"Kích thước ma trận gốc: {original_matrix.shape}")
        print(f"Số lượng singular values: {len(sigma)}")
        print("\nVariance explained:")
        total_variance = np.sum(sigma**2)
        variance_explained = np.cumsum(sigma**2) / total_variance
        for i in [1, 2, 5, 10, 20]:
            print(f"Top {i} components: {variance_explained[i-1]*100:.2f}%")
        
        error = np.mean((original_matrix - reconstructed)**2)
        print(f"\nMean Squared Error (với {k} components): {error:.4f}")
        
        conn.close()
        
    except Exception as e:
        print(f"Error in SVD visualization: {str(e)}")
        raise e

if __name__ == '__main__':
    visualize_svd_process() 
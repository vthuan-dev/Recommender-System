from popularity_recommender import PopularityRecommender
import mysql.connector
import matplotlib.pyplot as plt
import seaborn as sns

# Config database
db_config = {
    'host': 'localhost',
    'user': 'root', 
    'password': '100103',
    'database': 'NLCN',
    'port': 3307,
    'auth_plugin': 'mysql_native_password'
}

def visualize_analytics():
    """Hiển thị analytics trực tiếp"""
    try:
        # Kết nối DB và khởi tạo recommender
        conn = mysql.connector.connect(**db_config)
        recommender = PopularityRecommender()
        recommender.fit(conn)
        
        # Tạo figure với subplot layout
        plt.style.use('default')
        fig = plt.figure(figsize=(20, 12))
        
        # 1. Phân phối Popularity Score
        plt.subplot(2, 3, 1)
        sns.histplot(data=recommender.recommendations, x='popularity_score', bins=20)
        plt.title('Phân phối Popularity Score', fontsize=12, pad=10)
        
        # 2. Top 10 sản phẩm phổ biến
        plt.subplot(2, 3, 2)
        top_10 = recommender.recommendations.head(10)
        sns.barplot(data=top_10, y='name', x='popularity_score')
        plt.title('Top 10 Sản phẩm phổ biến nhất', fontsize=12, pad=10)
        
        # 3. Phân phối theo danh mục
        plt.subplot(2, 3, 3)
        category_counts = recommender.recommendations['category_name'].value_counts()
        plt.pie(category_counts.values, labels=category_counts.index, autopct='%1.1f%%')
        plt.title('Phân phối theo danh mục', fontsize=12, pad=10)
        
        # 4. Tương quan giữa các metrics
        plt.subplot(2, 3, 4)
        metrics = ['total_views', 'sold_count', 'unique_viewers', 'avg_rating']
        sns.heatmap(recommender.recommendations[metrics].corr(), annot=True, cmap='coolwarm')
        plt.title('Tương quan giữa các metrics', fontsize=12, pad=10)
        
        # 5. Mối quan hệ Views - Sales
        plt.subplot(2, 3, 5)
        plt.scatter(recommender.recommendations['total_views'], 
                   recommender.recommendations['sold_count'],
                   alpha=0.6)
        plt.xlabel('Tổng lượt xem')
        plt.ylabel('Số lượng bán')
        plt.title('Mối quan hệ Views - Sales', fontsize=12, pad=10)
        
        # 6. Phân phối giá theo danh mục
        plt.subplot(2, 3, 6)
        sns.boxplot(data=recommender.recommendations, y='category_name', x='min_price')
        plt.title('Phân phối giá theo danh mục', fontsize=12, pad=10)
        
        # Điều chỉnh layout và hiển thị
        plt.suptitle('Popularity-based Recommender Analytics', fontsize=16, y=1.02)
        plt.tight_layout()
        plt.show()
        
        conn.close()
        
    except Exception as e:
        print(f"Error generating analytics: {str(e)}")
        raise e

if __name__ == '__main__':
    visualize_analytics() 
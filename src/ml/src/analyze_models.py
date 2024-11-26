import sys
import os
import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from datetime import datetime

def load_models():
    """Load các model đã train"""
    try:
        models_dir = Path('src/ml/models')
        print(f"Loading models from: {models_dir}")
        
        popularity_model = joblib.load(models_dir / 'popularity_model.joblib')
        collaborative_model = joblib.load(models_dir / 'collaborative_model.joblib')
        
        print("Loaded models successfully!")
        return popularity_model, collaborative_model
    except Exception as e:
        print(f"Lỗi khi load model: {str(e)}")
        return None, None

def analyze_popularity_model(popularity_model):
    """Phân tích popularity model"""
    recommendations_df = popularity_model['recommendations']
    
    print("\n=== Phân tích Popularity Model ===")
    
    # 1. Thống kê cơ bản
    print("\n1. Thống kê cơ bản:")
    print(f"Tổng số sản phẩm: {len(recommendations_df)}")
    
    # 2. Phân tích ratings
    print("\n2. Phân tích Ratings:")
    if 'Rating' in recommendations_df.columns:
        print("Rating statistics:")
        print(recommendations_df['Rating'].describe())
        print("\nPhân bố Rating:")
        print(recommendations_df['Rating'].value_counts().sort_index())
    
    # 3. Phân tích theo thời gian
    if 'Timestamp' in recommendations_df.columns:
        recommendations_df['DateTime'] = pd.to_datetime(recommendations_df['Timestamp'], unit='s')
        print("\n3. Phân tích thời gian:")
        print("Khoảng thời gian dữ liệu:")
        print(f"Từ: {recommendations_df['DateTime'].min()}")
        print(f"Đến: {recommendations_df['DateTime'].max()}")
    
    # 4. Phân tích tương tác User-Product
    print("\n4. Phân tích tương tác:")
    if 'UserId' in recommendations_df.columns:
        print(f"Số lượng users: {recommendations_df['UserId'].nunique()}")
    if 'ProductId' in recommendations_df.columns:
        print(f"Số lượng products: {recommendations_df['ProductId'].nunique()}")
        
        # Top sản phẩm được rate nhiều nhất
        print("\nTop 5 sản phẩm được rate nhiều nhất:")
        top_products = recommendations_df['ProductId'].value_counts().head()
        print(top_products)
    
    # 5. Phân tích popularity score
    if 'popularity_score' in recommendations_df.columns:
        print("\n5. Phân phối popularity score:")
        print(recommendations_df['popularity_score'].describe())
    
    return recommendations_df

def analyze_collaborative_model(collaborative_model):
    """Phân tích collaborative model"""
    print("\n=== Phân tích Collaborative Model ===")
    
    # In ra cấu trúc của collaborative model
    print("\nCấu trúc của collaborative model:")
    if isinstance(collaborative_model, dict):
        for key, value in collaborative_model.items():
            if isinstance(value, pd.DataFrame):
                print(f"\nKey: {key}")
                print("Shape:", value.shape)
                print("Columns:", value.columns.tolist())
            else:
                print(f"\nKey: {key}, Type: {type(value)}")

def analyze_popularity_distribution(recommendations_df):
    """Phân tích chi tiết phân phối popularity"""
    print("\n=== Phân tích chi tiết Popularity ===")
    
    # Chia popularity score thành các nhóm, cho phép duplicates
    try:
        recommendations_df['popularity_group'] = pd.qcut(
            recommendations_df['popularity_score'], 
            q=5, 
            labels=['Rất thấp', 'Thấp', 'Trung bình', 'Cao', 'Rất cao'],
            duplicates='drop'  # Cho phép bỏ qua các giá trị trùng lặp
        )
        
        print("\nPhân phối theo nhóm popularity:")
        print(recommendations_df['popularity_group'].value_counts())
    except Exception as e:
        print(f"\nKhông thể phân nhóm popularity score: {str(e)}")
        
        # Thay vào đó, phân tích theo ranges thủ công
        print("\nPhân phối theo ranges:")
        ranges = [
            (1, 5, 'Rất thấp'),
            (5, 10, 'Thấp'),
            (10, 20, 'Trung bình'),
            (20, 100, 'Cao'),
            (100, float('inf'), 'Rất cao')
        ]
        
        for min_val, max_val, label in ranges:
            count = len(recommendations_df[
                (recommendations_df['popularity_score'] >= min_val) & 
                (recommendations_df['popularity_score'] < max_val)
            ])
            print(f"{label}: {count} sản phẩm")
    
    # Tìm các sản phẩm có popularity score cao bất thường
    threshold = recommendations_df['popularity_score'].mean() + 2*recommendations_df['popularity_score'].std()
    outliers = recommendations_df[recommendations_df['popularity_score'] > threshold]
    
    print(f"\nSố sản phẩm có popularity score cao bất thường (> {threshold:.2f}): {len(outliers)}")
    print("\nTop 10 sản phẩm có popularity score cao nhất:")
    print(outliers.nlargest(10, 'popularity_score')[['ProductId', 'popularity_score']])
    
    # Thêm phân tích phân phối
    print("\nThống kê phân vị:")
    percentiles = [0, 10, 25, 50, 75, 90, 95, 99, 100]
    print(recommendations_df['popularity_score'].quantile(np.array(percentiles)/100))
    
    # Vẽ histogram nếu có matplotlib
    try:
        import matplotlib.pyplot as plt
        plt.figure(figsize=(10, 6))
        plt.hist(recommendations_df['popularity_score'], bins=50, log=True)
        plt.title('Phân phối Popularity Score (log scale)')
        plt.xlabel('Popularity Score')
        plt.ylabel('Số lượng sản phẩm (log scale)')
        plt.savefig('popularity_distribution.png')
        plt.close()
        print("\nĐã lưu biểu đồ phân phối vào file 'popularity_distribution.png'")
    except ImportError:
        print("\nKhông thể vẽ biểu đồ (matplotlib không được cài đặt)")

def analyze_collaborative_factors(collaborative_model):
    """Phân tích chi tiết các factors"""
    print("\n=== Phân tích Collaborative Factors ===")
    
    user_factors = collaborative_model['user_factors']
    item_factors = collaborative_model['item_factors']
    
    print(f"\nKích thước user factors: {user_factors.shape}")
    print(f"Kích thước item factors: {item_factors.shape}")
    
    # Phân tích phân phối của factors
    print("\nPhân phối của user factors:")
    print(pd.DataFrame(user_factors).describe())
    
    print("\nPhân phối của item factors:")
    print(pd.DataFrame(item_factors).describe())
    
    # Phân tích correlation giữa các factors
    user_factor_corr = pd.DataFrame(user_factors).corr()
    print("\nCorrelation giữa user factors:")
    print(user_factor_corr)

if __name__ == "__main__":
    # Load models
    popularity_model, collaborative_model = load_models()
    
    if popularity_model:
        recommendations_df = analyze_popularity_model(popularity_model)
        analyze_popularity_distribution(recommendations_df)
    
    if collaborative_model:
        analyze_collaborative_model(collaborative_model)
        analyze_collaborative_factors(collaborative_model)
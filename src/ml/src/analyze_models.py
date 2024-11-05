import sys
import os
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from pathlib import Path

# Thêm đường dẫn gốc vào sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.recommender import RecommenderSystem

def analyze_models():
    # Khởi tạo recommender system
    recommender = RecommenderSystem()
    recommender.load_models()
    
    # 1. Phân tích Popularity Model
    pop_recommendations = recommender.pop_model.recommend(n_recommendations=10)
    print("\nTop 10 sản phẩm phổ biến nhất:")
    print(pop_recommendations[['ProductId', 'interaction_count', 'avg_rating', 'popularity_score']])
    
    # 2. Phân tích Collaborative Model
    print("\nThông tin Collaborative Filtering Model:")
    print(f"Số lượng users: {len(recommender.cf_model.user_ids)}")
    print(f"Số lượng items: {len(recommender.cf_model.item_ids)}")
    print(f"Kích thước ma trận user factors: {recommender.cf_model.user_factors.shape}")
    print(f"Kích thước ma trận item factors: {recommender.cf_model.item_factors.shape}")
    print(f"Mean rating: {recommender.cf_model.mean_rating:.2f}")
    
    # 3. Test recommendations
    # Lấy một user_id ngẫu nhiên để test
    test_user_id = recommender.cf_model.user_ids[0]
    
    print(f"\nĐề xuất cho user {test_user_id}:")
    recommendations = recommender.get_recommendations(test_user_id, n_items=5)
    print(recommendations)

if __name__ == "__main__":
    analyze_models()
import numpy as np
import pandas as pd
from datetime import datetime

def calculate_precision(actual, predicted):
    """
    Tính độ chính xác của các gợi ý
    actual: list các sản phẩm thực tế người dùng đã tương tác
    predicted: list các sản phẩm được gợi ý
    """
    if len(predicted) == 0:
        return 0.0
    
    true_positives = len(set(actual) & set(predicted))
    return true_positives / len(predicted)

def calculate_recall(actual, predicted):
    """
    Tính độ bao phủ của các gợi ý
    actual: list các sản phẩm thực tế người dùng đã tương tác
    predicted: list các sản phẩm được gợi ý
    """
    if len(actual) == 0:
        return 0.0
    
    true_positives = len(set(actual) & set(predicted))
    return true_positives / len(actual)

def calculate_category_coverage(recommendations_df, all_categories):
    """Tính độ phủ của các danh mục trong gợi ý"""
    recommended_categories = recommendations_df['category_id'].unique()
    coverage = len(recommended_categories) / len(all_categories)
    return coverage

def calculate_brand_coverage(recommendations_df, all_brands):
    """Tính độ phủ của các thương hiệu trong gợi ý"""
    recommended_brands = recommendations_df['brand_id'].unique()
    coverage = len(recommended_brands) / len(all_brands)
    return coverage

def calculate_price_distribution(recommendations_df):
    """Phân tích phân phối giá của các sản phẩm được gợi ý"""
    price_stats = {
        'mean': recommendations_df['price'].mean(),
        'median': recommendations_df['price'].median(),
        'std': recommendations_df['price'].std(),
        'min': recommendations_df['price'].min(),
        'max': recommendations_df['price'].max()
    }
    return price_stats

def calculate_popularity_bias(recommendations_df):
    """Tính độ lệch của popularity score"""
    return recommendations_df['popularity_score'].std()

def calculate_novelty(recommendations_df):
    """Tính độ mới của sản phẩm dựa trên ngày tạo"""
    now = datetime.now()
    recommendations_df['days_since_creation'] = (
        now - pd.to_datetime(recommendations_df['created_at'])
    ).dt.days
    return recommendations_df['days_since_creation'].mean()

def evaluate_popularity_recommendations(recommender, test_data):
    """Đánh giá toàn diện popularity-based recommendations"""
    metrics = {}
    
    # Lấy recommendations
    recommendations = recommender.get_recommendations(n_items=20)
    
    # 1. Độ phủ danh mục và thương hiệu
    all_categories = test_data['category_id'].unique()
    all_brands = test_data['brand_id'].unique()
    
    metrics['category_coverage'] = calculate_category_coverage(
        recommendations, all_categories
    )
    metrics['brand_coverage'] = calculate_brand_coverage(
        recommendations, all_brands
    )
    
    # 2. Phân tích giá
    metrics['price_distribution'] = calculate_price_distribution(recommendations)
    
    # 3. Độ lệch popularity
    metrics['popularity_bias'] = calculate_popularity_bias(recommendations)
    
    # 4. Độ mới của sản phẩm
    metrics['novelty'] = calculate_novelty(recommendations)
    
    return metrics
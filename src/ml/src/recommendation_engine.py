import numpy as np
import pandas as pd
import joblib
from pathlib import Path

def get_recommendations(user_id, n_recommendations=10):
    """
    Lấy gợi ý sản phẩm cho user kết hợp cả collaborative và popularity
    """
    try:
        # Load models
        models_dir = Path('src/ml/models')
        popularity_model = joblib.load(models_dir / 'popularity_model.joblib')
        collaborative_model = joblib.load(models_dir / 'collaborative_model.joblib')
        
        if user_id in collaborative_model['user_map']:
            # Với user đã có lịch sử
            collab_weight = 0.7
            pop_weight = 0.3
            
            # Lấy collaborative recommendations
            collab_recs = get_collaborative_recs(user_id, collaborative_model, n=n_recommendations)
            
            # Lấy popularity recommendations
            pop_recs = get_popularity_recs(popularity_model, n=n_recommendations)
            
            # Kết hợp và tính điểm cuối cùng
            final_scores = {}
            for prod_id, score in collab_recs.items():
                final_scores[prod_id] = score * collab_weight
            
            for prod_id, score in pop_recs.items():
                if prod_id in final_scores:
                    final_scores[prod_id] += score * pop_weight
                else:
                    final_scores[prod_id] = score * pop_weight
                    
            recommendations = sorted(final_scores.items(), 
                                  key=lambda x: x[1], 
                                  reverse=True)[:n_recommendations]
                                  
        else:
            # Với user mới
            recommendations = get_diverse_popularity_recs(
                popularity_model, 
                n_recommendations
            )
        
        return recommendations
        
    except Exception as e:
        print(f"Lỗi khi lấy recommendations: {str(e)}")
        return []

def get_collaborative_recs(user_id, model, n=10):
    """Lấy recommendations từ collaborative model"""
    try:
        user_idx = model['user_map'][user_id]
        scores = np.dot(model['user_factors'][user_idx], model['item_factors'].T)
        top_items = np.argsort(scores)[-n:][::-1]
        
        recommendations = {}
        for idx in top_items:
            item_id = model['item_ids'][idx]
            recommendations[item_id] = float(scores[idx])
            
        return recommendations
    except Exception as e:
        print(f"Lỗi collaborative recommendations: {str(e)}")
        return {}

def get_popularity_recs(model, n=10):
    """Lấy recommendations từ popularity model"""
    try:
        top_items = model['recommendations'].nlargest(n, 'popularity_score')
        return dict(zip(top_items['ProductId'], top_items['popularity_score']))
    except Exception as e:
        print(f"Lỗi popularity recommendations: {str(e)}")
        return {}

def get_diverse_popularity_recs(model, n=10):
    """Lấy diverse recommendations từ popularity"""
    try:
        df = model['recommendations']
        
        # Chia thành các nhóm popularity
        df['group'] = pd.qcut(df['popularity_score'], q=5, labels=['Very Low', 'Low', 'Medium', 'High', 'Very High'])
        
        recommendations = []
        group_sizes = {
            'Very High': int(n * 0.3),
            'High': int(n * 0.25),
            'Medium': int(n * 0.2),
            'Low': int(n * 0.15),
            'Very Low': int(n * 0.1)
        }
        
        for group, size in group_sizes.items():
            group_items = df[df['group'] == group].nlargest(size, 'popularity_score')
            for _, row in group_items.iterrows():
                recommendations.append((row['ProductId'], float(row['popularity_score'])))
                
        return recommendations[:n]
        
    except Exception as e:
        print(f"Lỗi diverse recommendations: {str(e)}")
        return []

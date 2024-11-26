import numpy as np
import pandas as pd
from tqdm import tqdm
from recommendation_engine import get_recommendations
import concurrent.futures
import joblib

def evaluate_single_user(args):
    """Đánh giá cho một user với debug info"""
    user_id, test_data, n_recommendations = args
    try:
        # Lấy actual items
        actual = test_data[test_data['UserId'] == user_id]['ProductId'].tolist()
        if not actual:
            return {'error': 'No actual items', 'user_id': user_id}
            
        # Lấy recommendations
        recs = get_recommendations(user_id, n_recommendations)
        if not recs:
            return {'error': 'No recommendations', 'user_id': user_id}
            
        # Debug info
        rec_items = [r[0] for r in recs]
        hits = len(set(rec_items) & set(actual))
        
        precision = hits / n_recommendations if n_recommendations > 0 else 0
        recall = hits / len(actual) if len(actual) > 0 else 0
        
        return {
            'precision': precision,
            'recall': recall,
            'hits': hits,
            'n_actual': len(actual),
            'n_recs': len(rec_items),
            'user_id': user_id
        }
        
    except Exception as e:
        return {'error': str(e), 'user_id': user_id}

def evaluate_recommendations(user_ids, test_data, n_recommendations=10):
    """Đánh giá với detailed logging"""
    
    # Lấy mẫu 30 users
    sample_size = min(30, len(user_ids))
    sampled_users = np.random.choice(user_ids, size=sample_size, replace=False)
    
    print("Loading models...")
    try:
        popularity_model = joblib.load('src/ml/models/popularity_model.joblib')
        collaborative_model = joblib.load('src/ml/models/collaborative_model.joblib')
    except Exception as e:
        print(f"Error loading models: {e}")
        return None
    
    results = {
        'precision': [],
        'recall': [],
        'errors': [],
        'details': []
    }
    
    print("\nĐánh giá recommendations...")
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        args = [(user_id, test_data, n_recommendations) for user_id in sampled_users]
        futures = list(tqdm(executor.map(evaluate_single_user, args), total=len(args)))
    
    # Analyze results
    for result in futures:
        if 'error' in result:
            results['errors'].append(result)
            continue
            
        if result['precision'] > 0 or result['recall'] > 0:
            results['precision'].append(result['precision'])
            results['recall'].append(result['recall'])
            results['details'].append(result)
    
    # Print detailed stats
    print("\nChi tiết đánh giá:")
    print(f"Số users có lỗi: {len(results['errors'])}")
    if results['errors']:
        print("Các lỗi phổ biến:")
        for err in results['errors'][:5]:
            print(f"- User {err['user_id']}: {err['error']}")
    
    print(f"\nSố users có recommendations hợp lệ: {len(results['details'])}")
    if results['details']:
        print("Chi tiết một số recommendations tốt:")
        for detail in results['details'][:5]:
            print(f"- User {detail['user_id']}: {detail['hits']} hits, "
                  f"{detail['n_actual']} actual items, {detail['n_recs']} recommendations")
    
    return {
        'mean_precision': np.mean(results['precision']) if results['precision'] else 0,
        'mean_recall': np.mean(results['recall']) if results['recall'] else 0,
        'num_users_evaluated': len(results['precision']),
        'num_errors': len(results['errors'])
    }

def main():
    """Main function với detailed output"""
    print("Loading test data...")
    test_data = pd.read_csv('src/ml/data/test_data.csv')
    test_users = test_data['UserId'].unique()
    
    results = evaluate_recommendations(test_users, test_data)
    
    print("\nKết quả đánh giá tổng quan:")
    print(f"Precision trung bình: {results['mean_precision']:.4f}")
    print(f"Recall trung bình: {results['mean_recall']:.4f}") 
    print(f"Số users đánh giá thành công: {results['num_users_evaluated']}")
    print(f"Số users gặp lỗi: {results['num_errors']}")

if __name__ == "__main__":
    main()

import numpy as np
from collections import Counter
from sklearn.metrics import ndcg_score
import pandas as pd

class RecommenderEvaluator:
    def __init__(self):
        self.metrics = {}
    
    def evaluate(self, recommendations, test_data=None):
        """Đánh giá toàn diện recommender system"""
        
        # 1. Đánh giá độ đa dạng
        self.metrics['diversity'] = self._evaluate_diversity(recommendations)
        
        # 2. Đánh giá phân phối
        self.metrics['distribution'] = self._evaluate_distribution(recommendations)
        
        # 3. Đánh giá coverage
        self.metrics['coverage'] = self._evaluate_coverage(recommendations)
        
        # 4. Đánh giá novelty
        self.metrics['novelty'] = self._evaluate_novelty(recommendations)
        
        return self.metrics
    
    def _evaluate_diversity(self, recommendations):
        """Đánh giá độ đa dạng của recommendations"""
        if not recommendations:
            return 0.0
            
        categories = [rec['category_name'] for rec in recommendations]
        brands = [rec['brand_name'] for rec in recommendations]
        
        category_diversity = len(set(categories)) / len(categories)
        brand_diversity = len(set(brands)) / len(brands)
        
        prices = [rec['min_price'] for rec in recommendations]
        price_std = np.std(prices) if len(prices) > 1 else 0
        
        return {
            'category_diversity': round(category_diversity, 3),
            'brand_diversity': round(brand_diversity, 3),
            'price_diversity': round(price_std / max(prices), 3) if prices else 0
        }
    
    def _evaluate_distribution(self, recommendations):
        """Đánh giá phân phối của recommendations"""
        if not recommendations:
            return {}
            
        ratings = [rec['metrics']['avg_rating'] for rec in recommendations]
        
        price_ranges = []
        for rec in recommendations:
            avg_price = (rec['min_price'] + rec['max_price']) / 2
            if avg_price < 2000000:
                price_ranges.append('Budget')
            elif avg_price < 10000000:
                price_ranges.append('Mid-range')
            else:
                price_ranges.append('Premium')
        
        return {
            'rating_distribution': {
                'mean': round(np.mean(ratings), 2),
                'std': round(np.std(ratings), 2)
            },
            'price_distribution': dict(Counter(price_ranges))
        }
    
    def _evaluate_coverage(self, recommendations):
        """Đánh giá coverage của recommendations"""
        if not recommendations:
            return {}
            
        categories = set(rec['category_name'] for rec in recommendations)
        brands = set(rec['brand_name'] for rec in recommendations)
        
        return {
            'unique_categories': len(categories),
            'unique_brands': len(brands)
        }
    
    def _evaluate_novelty(self, recommendations):
        """Đánh giá độ mới của recommendations"""
        if not recommendations:
            return 0.0
            
        popularities = [rec['metrics']['popularity_score'] for rec in recommendations]
        return {
            'mean_popularity': round(np.mean(popularities), 3),
            'novelty_score': round(1 - np.mean(popularities), 3)
        }

def print_evaluation_report(metrics):
    """In báo cáo đánh giá"""
    print("\n=== RECOMMENDATION SYSTEM EVALUATION REPORT ===\n")
    
    print("1. Diversity Metrics:")
    print(f"   - Category Diversity: {metrics['diversity']['category_diversity']}")
    print(f"   - Brand Diversity: {metrics['diversity']['brand_diversity']}")
    print(f"   - Price Diversity: {metrics['diversity']['price_diversity']}")
    
    print("\n2. Distribution Analysis:")
    print(f"   - Rating Distribution: Mean={metrics['distribution']['rating_distribution']['mean']}, STD={metrics['distribution']['rating_distribution']['std']}")
    print("   - Price Distribution:", metrics['distribution']['price_distribution'])
    
    print("\n3. Coverage Analysis:")
    print(f"   - Unique Categories: {metrics['coverage']['unique_categories']}")
    print(f"   - Unique Brands: {metrics['coverage']['unique_brands']}")
    
    print("\n4. Novelty Analysis:")
    print(f"   - Mean Popularity: {metrics['novelty']['mean_popularity']}")
    print(f"   - Novelty Score: {metrics['novelty']['novelty_score']}")

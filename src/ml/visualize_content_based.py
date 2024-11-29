import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import pandas as pd

def visualize_content_recommendation(recommender, product_id):
    """Visualize quá trình và kết quả recommendation của content-based model"""
    
    # 1. Lấy thông tin sản phẩm gốc và recommendations
    base_product = recommender._get_product_details(product_id)
    recommendations = recommender.recommend(product_id, n_items=5)
    
    # Tạo figure với 2x2 subplots
    fig = plt.figure(figsize=(15, 12))
    plt.suptitle(f'Content-based Recommendation Analysis\nBase Product: {base_product["name"]}', 
                 fontsize=14, y=1.02)
    
    # 1. Text Similarity Heatmap
    plt.subplot(2, 2, 1)
    similarity_scores = []
    product_names = [base_product['name']] + [r['name'] for r in recommendations]
    
    for rec in recommendations:
        # Tính text similarity
        text_sim = recommender.tfidf_matrix[rec['id']].dot(
            recommender.tfidf_matrix[product_id].T
        ).toarray()[0][0]
        similarity_scores.append(text_sim)
    
    sim_matrix = np.zeros((len(product_names), len(product_names)))
    sim_matrix[0, 1:] = similarity_scores
    sim_matrix[1:, 0] = similarity_scores
    
    sns.heatmap(sim_matrix, annot=True, cmap='YlOrRd', 
                xticklabels=product_names, yticklabels=product_names)
    plt.title('Text Similarity Matrix')
    plt.xticks(rotation=45)
    plt.yticks(rotation=0)
    
    # 2. Feature Contribution Bar Chart
    plt.subplot(2, 2, 2)
    feature_names = ['Text Similarity', 'Category Match', 'Brand Match', 'Price Range', 'Accessory Bonus']
    bar_width = 0.15
    x = np.arange(len(recommendations))

    for j, feature in enumerate(feature_names):
        values = []
        for i, rec in enumerate(recommendations):
            if feature == 'Text Similarity':
                value = similarity_scores[i] * 0.3
            elif feature == 'Category Match':
                value = 0.3 if rec['category'] == base_product['category_name'] else 0
            elif feature == 'Brand Match':
                value = 0.2 if rec['brand'] == base_product['brand_name'] else 0
            elif feature == 'Price Range':
                value = _calculate_price_contribution(rec['price'], base_product['min_price'])
            else:  # Accessory Bonus
                value = _calculate_accessory_bonus(base_product['name'], rec['name'])
            values.append(value)
        
        plt.bar(x + j*bar_width, values, bar_width, 
                label=feature)

    plt.title('Feature Contributions to Final Score')
    plt.xlabel('Recommended Products')
    plt.ylabel('Contribution Score')
    plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
    plt.xticks(x + bar_width*2, 
               [r['name'][:20] + '...' for r in recommendations], 
               rotation=45)
    
    # 3. Price Comparison
    plt.subplot(2, 2, 3)
    prices = [base_product['min_price']] + [r['price'] for r in recommendations]
    plt.bar(range(len(prices)), prices, 
            color=['blue'] + ['orange'] * len(recommendations))
    plt.axhline(y=base_product['min_price'], color='r', linestyle='--', 
                label='Base Price')
    plt.title('Price Comparison')
    plt.xlabel('Products')
    plt.ylabel('Price')
    plt.xticks(range(len(prices)), 
               ['Base'] + [f'Rec {i+1}' for i in range(len(recommendations))], 
               rotation=45)
    plt.legend()
    
    # 4. Final Similarity Scores
    plt.subplot(2, 2, 4)
    final_scores = [r['similarity_score'] for r in recommendations]
    plt.bar(range(len(final_scores)), final_scores)
    plt.title('Final Similarity Scores')
    plt.xlabel('Recommended Products')
    plt.ylabel('Similarity Score')
    plt.xticks(range(len(recommendations)), 
               [r['name'][:20] + '...' for r in recommendations], 
               rotation=45)
    
    plt.tight_layout()
    plt.show()
    
    # Print detailed analysis
    print("\nDetailed Analysis:")
    print("-" * 50)
    print(f"Base Product: {base_product['name']}")
    print(f"Category: {base_product['category_name']}")
    print(f"Brand: {base_product['brand_name']}")
    print(f"Price: {base_product['min_price']:,.0f} VND")
    print("\nTop 5 Recommendations:")
    for i, rec in enumerate(recommendations, 1):
        print(f"\n{i}. {rec['name']}")
        print(f"   Similarity Score: {rec['similarity_score']:.3f}")
        print(f"   Category: {rec['category']}")
        print(f"   Brand: {rec['brand']}")
        print(f"   Price: {rec['price']:,.0f} VND")

def _calculate_price_contribution(rec_price, base_price):
    """Tính price contribution dựa vào chênh lệch giá"""
    price_diff = abs(rec_price - base_price) / base_price
    if price_diff <= 0.2:
        return 0.15
    elif price_diff <= 0.3:
        return 0.13
    elif price_diff <= 0.5:
        return 0.10
    return 0

def _calculate_accessory_bonus(base_name, rec_name):
    """Tính accessory bonus dựa vào tên sản phẩm"""
    # Simplified logic - you should expand this based on your actual rules
    if 'case' in rec_name.lower() or 'ốp' in rec_name.lower():
        return 0.05
    elif 'charger' in rec_name.lower() or 'sạc' in rec_name.lower():
        return 0.03
    return 0

if __name__ == '__main__':
    from content_based_recommender import ContentBasedRecommender
    recommender = ContentBasedRecommender()
    recommender.fit()
    visualize_content_recommendation(recommender, product_id=1)  # Change product_id as needed 
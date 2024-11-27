import logging
import sys
import os
import time
import numpy as np
import pandas as pd
from pathlib import Path
from tqdm import tqdm

# Thêm đường dẫn gốc vào sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.metrics import calculate_precision, calculate_recall
from ml.popularity_recommender import PopularityRecommender
from models.collaborative import CollaborativeFiltering
from src.data_loader import DataLoader

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def train_popularity_model(data_loader, file_path):
    try:
        logging.info("Training Popularity-based Model...")
        model_start_time = time.time()
        pop_rec = PopularityRecommender()
        pop_rec.fit(data_loader.load_data(file_path))
        
        # Save model
        model_path = Path('../models/popularity_model.joblib')
        model_path.parent.mkdir(exist_ok=True)
        pop_rec.save_model(model_path)
        
        logging.info(f"Model training took {time.time() - model_start_time:.2f} seconds")
        return pop_rec
    except Exception as e:
        logging.error(f"Error training popularity model: {str(e)}")
        raise

def train_collaborative_model(train_data):
    print("\nTraining Collaborative Filtering Model...")
    model_start_time = time.time()
    collab_rec = CollaborativeFiltering(n_factors=50)
    collab_rec.fit(train_data)
    
    # Save model
    model_path = Path('../models/collaborative_model.joblib')
    model_path.parent.mkdir(exist_ok=True)
    collab_rec.save_model(model_path)
    
    print(f"Model training took {time.time() - model_start_time:.2f} seconds")
    return collab_rec

def evaluate_collaborative(model, test_data, n_recommendations=5):
    metrics = {
        'precision': [],
        'recall': [],
        'coverage': set()
    }
    
    try:
        for user_id in tqdm(test_data['UserId'].unique(), desc="Evaluating users"):
            actual_items = set(test_data[test_data['UserId'] == user_id]['ProductId'])
            recommendations = model.recommend(user_id, n_recommendations)
            predicted_items = set(recommendations['ProductId'])
            
            metrics['coverage'].update(predicted_items)
            
            if predicted_items:
                precision = calculate_precision(actual_items, predicted_items)
                recall = calculate_recall(actual_items, predicted_items)
                
                metrics['precision'].append(precision)
                metrics['recall'].append(recall)
                
        return {
            'precision': np.mean(metrics['precision']),
            'recall': np.mean(metrics['recall']),
            'coverage': len(metrics['coverage'])
        }
    except Exception as e:
        logging.error(f"Error evaluating collaborative model: {str(e)}")
        raise

def evaluate_model(model, data_chunks, n_recommendations=5):
    """
    Đánh giá model dựa trên precision và recall
    """
    popular_products = model.recommend(n_recommendations)
    predicted_products = set(popular_products['ProductId'].tolist())
    
    metrics = {
        'precision': [],
        'recall': [],
        'coverage': set()
    }
    
    for chunk in tqdm(data_chunks, desc="Evaluating chunks"):
        chunk_users = chunk.groupby('UserId')['ProductId'].agg(set)
        metrics['coverage'].update(chunk['ProductId'].unique())
        
        for user_products in chunk_users:
            if predicted_products:
                precision = calculate_precision(user_products, predicted_products)
                recall = calculate_recall(user_products, predicted_products)
                
                metrics['precision'].append(precision)
                metrics['recall'].append(recall)
    
    return {
        'precision': np.mean(metrics['precision']),
        'recall': np.mean(metrics['recall']),
        'coverage': len(metrics['coverage']),
        'coverage_ratio': len(predicted_products) / len(metrics['coverage'])
    }

def main():
    print("Starting training process...")
    start_time = time.time()
    
    # Load data
    print("Loading data...")
    data_loader = DataLoader(chunk_size=100000)
    file_path = '../data/raw/dataset.csv'
    
    # Train and evaluate popularity model
    pop_model = train_popularity_model(data_loader, file_path)
    pop_metrics = evaluate_model(pop_model, data_loader.load_data(file_path))
    
    print("\nPopularity Model Results:")
    print(f"Precision: {pop_metrics['precision']:.4f}")
    print(f"Recall: {pop_metrics['recall']:.4f}")
    
    # Load full data for collaborative filtering
    print("\nLoading full data for collaborative filtering...")
    full_data = pd.concat(list(data_loader.load_data(file_path)))
    
    # Split data
    test_size = 0.2
    test_data = full_data.groupby('UserId').sample(frac=test_size)
    train_data = full_data.drop(test_data.index)
    
    # Train and evaluate collaborative model
    collab_model = train_collaborative_model(train_data)
    collab_metrics = evaluate_collaborative(collab_model, test_data)
    
    print("\nCollaborative Model Results:")
    print(f"Precision: {collab_metrics['precision']:.4f}")
    print(f"Recall: {collab_metrics['recall']:.4f}")
    
    print(f"\nTotal execution time: {time.time() - start_time:.2f} seconds")

if __name__ == "__main__":
    main()
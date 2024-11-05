# Tạo file train_collaborative.py mới
import pandas as pd
from pathlib import Path
from models.collaborative import CollaborativeFiltering
from src.data_loader import DataLoader

def train_and_save():
    # Load data
    data_loader = DataLoader(chunk_size=100000)
    file_path = '../data/raw/dataset.csv'
    
    # Load full data
    full_data = pd.concat(list(data_loader.load_data(file_path)))
    
    # Train model
    collab_model = CollaborativeFiltering(n_factors=50)
    collab_model.fit(full_data)
    
    # Save model
    model_path = Path('../models/collaborative_model.joblib')
    model_path.parent.mkdir(exist_ok=True)
    collab_model.save_model(model_path)
    
if __name__ == "__main__":
    train_and_save()
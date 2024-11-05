import pandas as pd
import numpy as np
import os

class DataLoader:
    def __init__(self, chunk_size=100000, min_rating=1, max_rating=5):
        self.chunk_size = chunk_size
        self.min_rating = min_rating
        self.max_rating = max_rating
        
    def preprocess_chunk(self, chunk):
        # Remove invalid ratings
        chunk = chunk[
            (chunk['Rating'] >= self.min_rating) & 
            (chunk['Rating'] <= self.max_rating)
        ]
        
        # Remove duplicates
        chunk = chunk.drop_duplicates(['UserId', 'ProductId'])
        
        return chunk
        
    def load_data(self, file_path):
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
            
        chunks = pd.read_csv(
            file_path, 
            chunksize=self.chunk_size,
            usecols=['UserId', 'ProductId', 'Rating']
        )
        
        return (self.preprocess_chunk(chunk) for chunk in chunks)
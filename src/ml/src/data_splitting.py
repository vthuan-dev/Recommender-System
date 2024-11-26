import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from pathlib import Path

def split_data(test_size=0.2, random_state=42):
    """Split dataset thành training và test sets"""
    try:
        # Load dataset gốc
        data_path = Path('src/ml/data/raw/dataset.csv')
        print(f"Loading data from: {data_path}")
        df = pd.read_csv(data_path)
        
        # Split theo user để đảm bảo mỗi user có data trong cả train và test
        users = df['UserId'].unique()
        train_users, test_users = train_test_split(
            users, 
            test_size=test_size, 
            random_state=random_state
        )
        
        # Tạo train và test sets
        train_data = df[df['UserId'].isin(train_users)]
        test_data = df[df['UserId'].isin(test_users)]
        
        # Tạo thư mục data nếu chưa tồn tại
        output_dir = Path('src/ml/data')
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Lưu files
        train_path = output_dir / 'train_data.csv'
        test_path = output_dir / 'test_data.csv'
        
        train_data.to_csv(train_path, index=False)
        test_data.to_csv(test_path, index=False)
        
        print(f"\nData đã được split và lưu vào:")
        print(f"Train data: {train_path}")
        print(f"Test data: {test_path}")
        
        print("\nThống kê:")
        print(f"Số lượng users trong train: {len(train_users)}")
        print(f"Số lượng users trong test: {len(test_users)}")
        print(f"Số lượng records trong train: {len(train_data)}")
        print(f"Số lượng records trong test: {len(test_data)}")
        
        return train_data, test_data
        
    except Exception as e:
        print(f"Lỗi khi split data: {str(e)}")
        return None, None

if __name__ == "__main__":
    train_data, test_data = split_data() 
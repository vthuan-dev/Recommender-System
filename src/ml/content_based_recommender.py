import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import mysql.connector
import logging
import re

logger = logging.getLogger(__name__)

class ContentBasedRecommender:
    def __init__(self):
        self.conn = self._connect_db()
        self.product_features = None
        self.tfidf_matrix = None
        self.similarity_matrix = None
        self.tfidf = TfidfVectorizer(
            stop_words='english',
            ngram_range=(1, 2),
            max_features=5000
        )
    
    def _connect_db(self):
        """Kết nối đến MySQL database"""
        try:
            connection = mysql.connector.connect(
                host='localhost',
                database='NLCN',  # Tên database của bạn
                user='root',           # Username MySQL của bạn
                password='100103',           # Password MySQL của bạn
                port=3307             # Port MySQL (mặc định là 3306)
            )
            
            if connection.is_connected():
                logger.info("Successfully connected to MySQL database")
                return connection

        except Exception as e:
            logger.error(f"Error connecting to MySQL: {str(e)}")
            raise e
            
    def _preprocess_text(self, text):
        """Tiền xử lý text"""
        if not isinstance(text, str):
            return ''
        text = text.lower()
        text = re.sub(r'[^\w\s]', ' ', text)
        text = re.sub(r'\d+', ' ', text)
        text = ' '.join(text.split())
        return text

    def _load_product_features(self):
        """Load product features từ database"""
        query = """
            SELECT 
                p.id,
                p.name,
                p.description,
                c.name as category_name,
                b.name as brand_name,
                MIN(pv.price) as min_price,
                MAX(pv.price) as max_price
            FROM products p
            JOIN categories c ON p.category_id = c.id
            JOIN brands b ON p.brand_id = b.id
            JOIN productvariants pv ON p.id = pv.product_id
            GROUP BY p.id, c.name, b.name
        """
        self.product_features = pd.read_sql(query, self.conn)

    def _extract_text_features(self):
        """Trích xuất features từ text với trọng số"""
        # Kết hợp name và description với trọng số
        self.product_features['text_features'] = (
            self.product_features['name'].fillna('') * 2 + ' ' +  # Tăng trọng số cho tên
            self.product_features['category_name'].fillna('') * 3 + ' ' +  # Tăng trọng số cho category
            self.product_features['brand_name'].fillna('') * 2 + ' ' +  # Tăng trọng số cho brand
            self.product_features['description'].fillna('')
        )
        
        # Cập nhật TF-IDF parameters
        self.tfidf = TfidfVectorizer(
            stop_words='english',
            ngram_range=(1, 3),  # Thêm trigrams
            max_features=10000,  # Tăng số features
            min_df=2,  # Bỏ qua từ xuất hiện ít
            max_df=0.95  # Bỏ qua từ xuất hiện quá nhiều
        )

    def _calculate_similarity(self):
        """Tính toán similarity matrix"""
        self.similarity_matrix = cosine_similarity(self.tfidf_matrix)

    def recommend(self, product_id, n_items=6):
        try:
            product = self._get_product_details(product_id)
            if not product:
                return {}

            idx = self.product_features[
                self.product_features['id'] == product_id
            ].index[0]

            sim_scores = list(enumerate(self.similarity_matrix[idx]))
            sim_scores = sorted(
                sim_scores, 
                key=lambda x: x[1], 
                reverse=True
            )

            top_similar = sim_scores[1:n_items+1]
            product_indices = [i[0] for i in top_similar]
            
            recommendations = self.product_features.iloc[product_indices]
            
            return self._format_recommendations(recommendations)

        except Exception as e:
            logger.error(f"Error in recommend: {str(e)}")
            return {}

    def _get_product_details(self, product_id):
        """Lấy chi tiết sản phẩm từ database"""
        query = """
            SELECT 
                p.*,
                c.name as category_name,
                b.name as brand_name,
                MIN(pv.price) as min_price,
                MAX(pv.price) as max_price
            FROM products p
            JOIN categories c ON p.category_id = c.id
            JOIN brands b ON p.brand_id = b.id
            JOIN productvariants pv ON p.id = pv.product_id
            WHERE p.id = %s
            GROUP BY p.id, c.name, b.name
        """
        result = pd.read_sql(query, self.conn, params=[product_id])
        return result.iloc[0].to_dict() if not result.empty else None

    def _format_recommendations(self, recommendations):
        """Format kết quả trả về"""
        return [{
            'id': row['id'],
            'name': row['name'],
            'category': row['category_name'],
            'brand': row['brand_name'],
            'price': float(row['min_price']),
            'similarity_score': float(self.similarity_matrix[row.name][0])
        } for _, row in recommendations.iterrows()]

    def fit(self):
        """Train model"""
        try:
            self._load_product_features()
            self._extract_text_features()
            self._calculate_similarity()
            logger.info(f"Model trained on {len(self.product_features)} products")
            return self
        except Exception as e:
            logger.error(f"Error in fit: {str(e)}")
            raise e
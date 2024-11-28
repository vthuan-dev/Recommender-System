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
        """Tiền xử lý text tiếng Việt"""
        if not isinstance(text, str):
            return ''
        # Chuyển về lowercase
        text = text.lower()
        # Xử lý dấu câu và ký tự đặc biệt
        text = re.sub(r'[^\w\s]', ' ', text)
        # Xử lý số
        text = re.sub(r'\d+', ' ', text)
        # Chuẩn hóa khoảng trắng
        text = ' '.join(text.split())
        # Thêm xử lý stopwords tiếng Việt nếu cần
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
        # Tạo text features với trọng số chi tiết hơn
        self.product_features['text_features'] = (
            # Tên sản phẩm (x6)
            (self.product_features['name'].fillna('') + ' ') * 6 +
            # Category (x8)
            (self.product_features['category_name'].fillna('') + ' ') * 8 +
            # Brand (x4)
            (self.product_features['brand_name'].fillna('') + ' ') * 4 +
            # Description
            self.product_features['description'].fillna('')
        )
        
        # Thêm product type detection
        self.product_features['product_type'] = self.product_features['name'].apply(
            lambda x: self._detect_product_type(x.lower())
        )
        
        # Boost similarity cho cùng product type
        self.product_features['text_features'] = (
            self.product_features.apply(
                lambda x: x['text_features'] + ' ' + x['product_type'] * 5,
                axis=1
            )
        )
        
        # Tiền xử lý text
        self.product_features['text_features'] = (
            self.product_features['text_features']
            .apply(self._preprocess_text)
        )
        
        # TF-IDF đơn giản
        self.tfidf = TfidfVectorizer(
            ngram_range=(1, 2),  # Chỉ dùng unigrams và bigrams
            max_features=1000,   # Giảm số features
            min_df=2,           # Bỏ qua từ hiếm
            max_df=0.9          # Bỏ qua từ quá phổ biến
        )
        
        # Tạo TF-IDF matrix
        self.tfidf_matrix = self.tfidf.fit_transform(
            self.product_features['text_features']
        )
        
        logger.info(f"Created TF-IDF matrix with shape: {self.tfidf_matrix.shape}")

    def _detect_product_type(self, name):
        """Phát hiện loại sản phẩm chi tiết hơn"""
        types = {
            'vga': ['vga', 'geforce', 'radeon', 'rtx', 'gtx', 'rx'],
            'cpu': ['cpu', 'ryzen', 'core i'],
            'ram': ['ram', 'ddr4', 'ddr5'],
            'mainboard': ['mainboard', 'motherboard'],
            'pc': ['pc', 'máy tính'],
            'laptop': ['laptop'],
            'phone': ['iphone', 'điện thoại'],
            'tablet': ['ipad', 'tablet', 'máy tính bảng'],
            'headphone': ['tai nghe'],
            'speaker': ['loa'],
            'network': ['router', 'wifi', 'kích sóng'],
            'case': ['ốp lưng', 'case'],
            'smartwatch': ['đồng hồ', 'watch', 'band'],
            'smartdevice': ['thiết bị thông minh', 'smart tag', 'smart home']
        }
        
        for type_name, keywords in types.items():
            if any(kw in name.lower() for kw in keywords):
                return type_name
        return 'other'

    def _calculate_similarity(self):
        """Tính toán similarity matrix"""
        try:
            self.similarity_matrix = cosine_similarity(self.tfidf_matrix)
            logger.info(f"Created similarity matrix with shape: {self.similarity_matrix.shape}")
        except Exception as e:
            logger.error(f"Error calculating similarity: {str(e)}")
            raise e

    def recommend(self, product_id, n_items=6):
        try:
            product = self._get_product_details(product_id)
            if not product:
                return {}

            idx = self.product_features[
                self.product_features['id'] == product_id
            ].index[0]
            
            # Tính base similarity
            base_similarities = cosine_similarity(
                self.tfidf_matrix[idx:idx+1], 
                self.tfidf_matrix
            ).flatten()
            
            # Tạo DataFrame để xử lý scores
            scores_df = pd.DataFrame({
                'index': range(len(base_similarities)),
                'similarity': base_similarities,
                'category': self.product_features['category_name'],
                'brand': self.product_features['brand_name'],
                'price': self.product_features['min_price'],
                'name': self.product_features['name']
            })
            
            # Loại bỏ sản phẩm gốc
            scores_df = scores_df[scores_df['index'] != idx].copy()
            
            # Normalize base similarities to 0-1 range
            max_base = scores_df['similarity'].max()
            if max_base > 0:
                scores_df['similarity'] = scores_df['similarity'] / max_base
            
            # Detect product type
            product_type = self._detect_product_type(product['name'])
            scores_df['product_type'] = scores_df['name'].apply(self._detect_product_type)
            
            # Brand tiers và bonus
            premium_brands = ['Apple', 'Samsung', 'Sony']  # Tier 1
            high_end_brands = ['LG', 'MSI', 'Asus', 'JBL', 'Logitech']  # Tier 2
            mid_brands = ['OPPO', 'Vivo', 'Xiaomi', 'Lenovo', 'HP']  # Tier 3
            
            # Category tiers
            premium_categories = ['Điện thoại', 'Laptop gaming', 'PC & Linh kiện']
            high_end_categories = ['Máy tính bảng', 'Camera & Máy ảnh', 'Console & Games']
            
            # Brand bonus based on tiers và category
            brand_bonus = 0
            if product['brand_name'] in premium_brands:
                brand_bonus = 0.2 if product['category_name'] in premium_categories else 0.15
            elif product['brand_name'] in high_end_brands:
                brand_bonus = 0.15 if product['category_name'] in premium_categories else 0.1
            elif product['brand_name'] in mid_brands:
                brand_bonus = 0.1
                
            scores_df.loc[scores_df['brand'] == product['brand_name'], 'similarity'] += brand_bonus
            
            # Category bonus (dynamic)
            category_bonus = 0.25 if product['category_name'] in premium_categories else 0.2
            scores_df.loc[scores_df['category'] == product['category_name'], 'similarity'] += category_bonus
            
            # Type bonus (0.25)
            scores_df.loc[scores_df['product_type'] == product_type, 'similarity'] += 0.25
            
            # Price range bonus (dynamic based on category and brand)
            base_price = product['min_price']
            if product['category_name'] in premium_categories:
                if product['brand_name'] in premium_brands:
                    price_range = (0.85 * base_price, 1.15 * base_price)  # ±15%
                else:
                    price_range = (0.8 * base_price, 1.2 * base_price)   # ±20%
            else:
                price_range = (0.7 * base_price, 1.3 * base_price)   # ±30%
                
            scores_df.loc[
                (scores_df['price'] >= price_range[0]) & 
                (scores_df['price'] <= price_range[1]), 
                'similarity'
            ] += 0.15
            
            # Extra penalty cho chênh lệch giá lớn
            price_diff = abs(scores_df['price'] - base_price) / base_price
            scores_df.loc[price_diff > 0.5, 'similarity'] *= 0.6  # Tăng penalty
            
            # Cap similarity ở 0.95
            scores_df['similarity'] = scores_df['similarity'].clip(0, 0.95)
            
            # Minimum similarity threshold based on category và brand
            if product['category_name'] in premium_categories:
                min_similarity = 0.4 if product['brand_name'] in premium_brands else 0.35
            elif product['category_name'] in high_end_categories:
                min_similarity = 0.35 if product['brand_name'] in high_end_brands else 0.3
            else:
                min_similarity = 0.25
                
            scores_df = scores_df[scores_df['similarity'] > min_similarity]
            
            # Get recommendations by priority
            same_category_type = scores_df.loc[
                (scores_df['category'] == product['category_name']) & 
                (scores_df['product_type'] == product_type)
            ]
            same_category = scores_df.loc[
                (scores_df['category'] == product['category_name']) & 
                (scores_df['product_type'] != product_type)
            ]
            same_type = scores_df.loc[
                (scores_df['category'] != product['category_name']) & 
                (scores_df['product_type'] == product_type)
            ]
            others = scores_df.loc[
                (scores_df['category'] != product['category_name']) & 
                (scores_df['product_type'] != product_type)
            ]
            
            # Calculate recommendations count based on product type
            if product_type in ['vga', 'cpu', 'ram', 'mainboard']:
                n_same_category_type = min(4, len(same_category_type))
                n_same_category = min(1, len(same_category))
                n_same_type = min(1, len(same_type))
            else:
                n_same_category_type = min(3, len(same_category_type))
                n_same_category = min(2, len(same_category))
                n_same_type = min(1, len(same_type))
                
            n_others = min(
                n_items - n_same_category_type - n_same_category - n_same_type,
                len(others)
            )
            
            # Combine recommendations
            final_recs = pd.concat([
                same_category_type.nlargest(n_same_category_type, 'similarity'),
                same_category.nlargest(n_same_category, 'similarity'),
                same_type.nlargest(n_same_type, 'similarity'),
                others.nlargest(n_others, 'similarity')
            ])
            
            recommendations = self.product_features.iloc[final_recs['index']]
            
            return [{
                'id': int(row['id']),
                'name': row['name'],
                'category': row['category_name'],
                'brand': row['brand_name'],
                'price': float(row['min_price']),
                'similarity_score': float(scores_df.loc[
                    scores_df['index'] == row.name, 
                    'similarity'
                ].iloc[0])
            } for _, row in recommendations.iterrows()]

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
            'id': int(row['id']),
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

    def _filter_by_price(self, recommendations, base_price, threshold=0.5):
        """Lọc recommendations theo khoảng giá"""
        min_price = base_price * (1 - threshold)  # -50%
        max_price = base_price * (1 + threshold)  # +50%
        
        return recommendations[
            (recommendations['min_price'] >= min_price) & 
            (recommendations['max_price'] <= max_price)
        ]
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
        
        # Define related accessories mapping
        self.related_accessories = {
            'phone': {
                'primary': ['ốp lưng', 'case', 'bao da'],
                'secondary': ['tai nghe', 'sạc', 'cáp', 'kính cường lực', 'adapter']
            },
            'laptop': {
                'primary': ['chuột', 'mouse', 'bàn phím', 'keyboard', 'túi', 'balo'],
                'secondary': ['tai nghe', 'đế tản nhiệt', 'webcam', 'usb', 'hub']
            },
            'tablet': {
                'primary': ['bao da', 'case', 'bút cảm ứng', 'stylus'],
                'secondary': ['sạc', 'adapter', 'kính cường lực', 'cáp']
            },
            'smartwatch': {
                'primary': ['dây đeo', 'strap', 'dây da'],
                'secondary': ['sạc', 'dock', 'miếng dán']
            },
            'camera': {
                'primary': ['thẻ nhớ', 'pin', 'túi', 'balo'],
                'secondary': ['chân máy', 'đèn flash', 'filter', 'lens']
            },
            'headphone': {
                'primary': ['bao case', 'túi đựng', 'móc treo'],
                'secondary': ['đệm tai', 'dây cáp', 'adapter']
            }
        }
    
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
            
            # Ensure all fields exist
            product = {
                'id': product.get('id', 0),
                'name': product.get('name', ''),
                'category_name': product.get('category_name', ''),
                'brand_name': product.get('brand_name', ''),
                'min_price': product.get('min_price', 0),
                'description': product.get('description', '')
            }

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
                'category': self.product_features['category_name'].fillna(''),
                'brand': self.product_features['brand_name'].fillna(''),
                'price': self.product_features['min_price'].fillna(0),
                'name': self.product_features['name'].fillna(''),
                'description': self.product_features['description'].fillna('')
            })
            
            # Loại bỏ sản phẩm gốc
            scores_df = scores_df[scores_df['index'] != idx].copy()
            
            # Initial normalization of base similarities to 0-0.4 range
            max_sim = scores_df['similarity'].max()
            if max_sim > 0:
                scores_df['similarity'] = scores_df['similarity'] / max_sim * 0.4
            
            # Remove duplicates based on product name
            scores_df = scores_df.drop_duplicates(subset=['name'], keep='first')
            
            # Add category and brand bonuses (reduced values)
            scores_df.loc[scores_df['category'] == product['category_name'], 'similarity'] *= 1.25  # +25%
            scores_df.loc[scores_df['brand'] == product['brand_name'], 'similarity'] *= 1.15      # +15%
            
            # Cap at 0.7 before price range processing
            scores_df['similarity'] = scores_df['similarity'].clip(0, 0.7)
            
            # Price range bonus (reduced)
            base_price = product['min_price']
            if base_price > 0:  # Avoid division by zero
                price_diff = abs(scores_df['price'] - base_price) / base_price
                # Smaller bonus for similar price range
                scores_df.loc[price_diff <= 0.3, 'similarity'] *= 1.1  # +10% for ±30% price range
                # Penalty for very different prices
                scores_df.loc[price_diff > 0.5, 'similarity'] *= 0.8  # -20% for >50% price difference
            
            # Cap at 0.8 before accessory processing
            scores_df['similarity'] = scores_df['similarity'].clip(0, 0.8)
            
            # Detect if current product is an accessory
            is_accessory = any(
                keyword in product['name'].lower()
                for acc_list in self.related_accessories.values()
                for keywords in acc_list.values()
                for keyword in keywords
            )
            
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
            
            # Add bonus for related accessories or main products
            if not is_accessory and product_type in self.related_accessories:
                # Use smaller multiplicative bonuses
                for keyword in self.related_accessories[product_type]['primary']:
                    mask = (
                        scores_df['name'].str.lower().str.contains(keyword, na=False) |
                        scores_df['description'].str.lower().str.contains(keyword, na=False)
                    )
                    scores_df.loc[mask, 'similarity'] *= 1.1  # +10%
                    
                for keyword in self.related_accessories[product_type]['secondary']:
                    mask = (
                        scores_df['name'].str.lower().str.contains(keyword, na=False) |
                        scores_df['description'].str.lower().str.contains(keyword, na=False)
                    )
                    scores_df.loc[mask, 'similarity'] *= 1.05   # +5%
                    
                # Cap similarities at 0.95
                scores_df['similarity'] = scores_df['similarity'].clip(0, 0.95)
                
                # Adjust ratio based on product type and price
                if product_type in ['phone', 'tablet', 'laptop']:
                    if product['min_price'] > 15000000:  # > 15tr
                        n_similar = int(n_items * 0.4)  # 40% similar products
                        n_accessories = n_items - n_similar  # 60% accessories
                    else:
                        n_similar = int(n_items * 0.6)  # 60% similar products
                        n_accessories = n_items - n_similar  # 40% accessories
                else:
                    n_similar = int(n_items * 0.7)  # 70% similar products
                    n_accessories = n_items - n_similar  # 30% accessories
                    
                # Get similar products (exclude accessories)
                similar_products = scores_df[
                    ~scores_df['name'].str.lower().str.contains('|'.join(
                        sum([v['primary'] + v['secondary'] for v in self.related_accessories.values()], [])
                    ), na=False)
                ].nlargest(n_similar, 'similarity')
                
                # Get accessories
                accessories_mask = scores_df['name'].str.lower().str.contains('|'.join(
                    sum([v['primary'] + v['secondary'] for v in self.related_accessories.values()], [])
                ), na=False)
                accessories = scores_df[accessories_mask].nlargest(n_accessories, 'similarity')
                
                # Combine recommendations
                final_recs = pd.concat([similar_products, accessories])
            else:
                # If accessory or unknown type, recommend similar items
                final_recs = scores_df.nlargest(n_items, 'similarity')
                
            # Ensure final scores are <= 0.95
            final_recs['similarity'] = final_recs['similarity'].clip(0, 0.95)
            max_final_sim = final_recs['similarity'].max()
            if max_final_sim > 0.95:
                final_recs['similarity'] = (final_recs['similarity'] / max_final_sim) * 0.95
            
            # Sort by similarity
            final_recs = final_recs.sort_values('similarity', ascending=False)
            
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
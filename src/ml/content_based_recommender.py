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

    def recommend(self, product_id, n_items=8):
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
            
            # Detect product type early
            product_type = self._detect_product_type(product['name'])

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
            
            # Normalize initial similarities to 0-0.3 range
            max_sim = scores_df['similarity'].max()
            if max_sim > 0:
                scores_df['similarity'] = scores_df['similarity'] / max_sim * 0.3
            
            # Add bonuses sequentially with normalization after each step
            
            # 1. Category bonus (max 0.3)
            scores_df.loc[scores_df['category'] == product['category_name'], 'similarity'] += 0.3
            scores_df['similarity'] = scores_df['similarity'].clip(0, 0.6)
            
            # 2. Brand bonus (max 0.2)
            scores_df.loc[scores_df['brand'] == product['brand_name'], 'similarity'] += 0.2
            scores_df['similarity'] = scores_df['similarity'].clip(0, 0.8)
            
            # 3. Price range bonuses (max 0.15)
            base_price = product['min_price']
            if base_price > 0:
                price_diff = abs(scores_df['price'] - base_price) / base_price
                
                # Tăng bonus cho khoảng giá phù hợp
                scores_df.loc[price_diff <= 0.2, 'similarity'] += 0.15  # Very close
                scores_df.loc[(price_diff > 0.2) & (price_diff <= 0.3), 'similarity'] += 0.13  # Close
                scores_df.loc[(price_diff > 0.3) & (price_diff <= 0.5), 'similarity'] += 0.10  # Moderate
                
                # Tăng penalty cho khoảng giá xa
                scores_df.loc[price_diff > 0.5, 'similarity'] *= 0.5  # -50% for far prices
                
            # Normalize to 0.9 after price bonuses
            scores_df['similarity'] = scores_df['similarity'].clip(0, 0.9)
            
            # 4. Accessory bonuses
            if product_type in self.related_accessories:
                acc_bonus = np.zeros(len(scores_df))
                
                # Tăng bonus cho phụ kiện
                for keyword in self.related_accessories[product_type]['primary']:
                    mask = (
                        scores_df['name'].str.lower().str.contains(keyword, na=False) |
                        scores_df['description'].str.lower().str.contains(keyword, na=False)
                    )
                    acc_bonus = np.where(mask, 0.10, acc_bonus)  # +0.10 for primary
                    
                for keyword in self.related_accessories[product_type]['secondary']:
                    mask = (
                        scores_df['name'].str.lower().str.contains(keyword, na=False) |
                        scores_df['description'].str.lower().str.contains(keyword, na=False)
                    )
                    acc_bonus = np.where(mask, 0.07, acc_bonus)  # +0.07 for secondary
                    
                # Add accessory bonuses
                scores_df['similarity'] = scores_df['similarity'] + acc_bonus
                
                # Boost accessories in similar price range
                if base_price > 0:
                    price_diff = abs(scores_df['price'] - base_price) / base_price
                    acc_bonus = np.where(price_diff <= 0.5, acc_bonus * 1.2, acc_bonus)
                    
            # Final normalization
            scores_df['similarity'] = scores_df['similarity'].clip(0, 0.95)
            
            # Sort by similarity
            scores_df = scores_df.sort_values('similarity', ascending=False)
            
            # Get top recommendations
            recommendations = self.product_features.iloc[scores_df.head(n_items)['index']]
            
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

    def evaluate_model(self, test_products=None, k=5):
        """Đánh giá model với các metrics cơ bản"""
        if test_products is None:
            # Lấy ngẫu nhiên 20% sản phẩm để test
            test_products = self.product_features.sample(frac=0.2)['id'].tolist()
            
        metrics = {
            'category_accuracy': [],  # Tỷ lệ gợi ý cùng category
            'brand_accuracy': [],     # Tỷ lệ gợi ý cùng brand
            'price_range_accuracy': [],  # Tỷ lệ gợi ý trong khoảng giá phù hợp
            'accessory_ratio': [],    # Tỷ lệ phụ kiện trong gợi ý
            'diversity_score': [],    # Độ đa dạng của gợi ý
            'price_ranges': {         # Phân phối khoảng giá
                'very_close': 0,    # ±20%
                'close': 0,         # ±30%
                'moderate': 0,      # ±50%
                'far': 0           # >50%
            }
        }
        
        total_recs = 0  # Tổng số recommendations
        
        for product_id in test_products:
            # Lấy thông tin sản phẩm gốc
            original = self._get_product_details(product_id)
            if not original or not original['min_price']:
                continue
            
            # Lấy recommendations
            recs = self.recommend(product_id, n_items=k)
            if not recs:
                continue
            
            total_recs += len(recs)
            
            # Category accuracy
            same_category = sum(1 for r in recs if r['category'] == original['category_name'])
            metrics['category_accuracy'].append(same_category / k)
            
            # Brand accuracy
            same_brand = sum(1 for r in recs if r['brand'] == original['brand_name'])
            metrics['brand_accuracy'].append(same_brand / k)
            
            # Price range accuracy
            base_price = original['min_price']
            for rec in recs:
                diff = abs(rec['price'] - base_price) / base_price
                if diff <= 0.2:
                    metrics['price_ranges']['very_close'] += 1
                elif diff <= 0.3:
                    metrics['price_ranges']['close'] += 1
                elif diff <= 0.5:
                    metrics['price_ranges']['moderate'] += 1
                else:
                    metrics['price_ranges']['far'] += 1
                
            in_price_range = sum(1 for r in recs 
                               if 0.5 * base_price <= r['price'] <= 1.5 * base_price)
            metrics['price_range_accuracy'].append(in_price_range / k)
            
            # Accessory ratio
            is_accessory = any(
                keyword in original['name'].lower()
                for acc_list in self.related_accessories.values()
                for keywords in acc_list.values()
                for keyword in keywords
            )
            
            if not is_accessory:
                acc_count = sum(1 for r in recs if any(
                    keyword in r['name'].lower()
                    for acc_list in self.related_accessories.values()
                    for keywords in acc_list.values()
                    for keyword in keywords
                ))
                metrics['accessory_ratio'].append(acc_count / k)
                
            # Diversity score
            unique_cats = len(set(r['category'] for r in recs))
            unique_brands = len(set(r['brand'] for r in recs))
            diversity = (unique_cats + unique_brands) / (2 * k)
            metrics['diversity_score'].append(diversity)
        
        # Tính trung bình các metrics
        results = {
            'category_accuracy': np.mean(metrics['category_accuracy']),
            'brand_accuracy': np.mean(metrics['brand_accuracy']),
            'price_range_accuracy': np.mean(metrics['price_range_accuracy']),
            'accessory_ratio': np.mean(metrics['accessory_ratio']) if metrics['accessory_ratio'] else 0,
            'diversity_score': np.mean(metrics['diversity_score'])
        }
        
        # Thêm phân phối khoảng giá
        if total_recs > 0:
            results['price_distribution'] = {
                range_name: count/total_recs 
                for range_name, count in metrics['price_ranges'].items()
            }
        
        return results

    def evaluate_similarity_distribution(self):
        """Đánh giá phân phối của similarity scores"""
        all_scores = []
        
        # Lấy mẫu ngẫu nhiên 50 sản phẩm
        sample_products = self.product_features.sample(n=min(50, len(self.product_features)))
        
        for _, product in sample_products.iterrows():
            recs = self.recommend(product['id'], n_items=5)
            if recs:
                scores = [r['similarity_score'] for r in recs]
                all_scores.extend(scores)
        
        if all_scores:
            return {
                'mean': np.mean(all_scores),
                'std': np.std(all_scores),
                'min': np.min(all_scores),
                'max': np.max(all_scores),
                'median': np.median(all_scores)
            }
        return {}
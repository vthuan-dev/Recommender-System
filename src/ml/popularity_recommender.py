# src/ml/popularity_recommender.py
import pandas as pd
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from datetime import datetime
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import plotly.graph_objects as go

class PopularityRecommender:
    def __init__(self):
        self.recommendations = None
        self.products_df = None
        self.tfidf_matrix = None
        self.feature_names = None
        self.last_train_time = None
        
    def fit(self, conn):
        """Train model với data từ DB"""
        try:
            query = """
                SELECT 
                    p.id as product_id,
                    p.name,
                    p.image_url,
                    p.description,
                    p.created_at,
                    b.name as brand_name,
                    c.name as category_name,
                    COALESCE(r.review_count, 0) as review_count,
                    COALESCE(r.avg_rating, 0) as avg_rating,
                    COALESCE(o.order_count, 0) as order_count,
                    COALESCE(pv.total_sold, 0) as sold_count,
                    COALESCE(pv.min_price, 0) as min_price,
                    COALESCE(pv.max_price, 0) as max_price,
                    COALESCE(v.unique_viewers, 0) as unique_viewers,
                    COALESCE(v.total_views, 0) as total_views
                FROM products p
                LEFT JOIN brands b ON p.brand_id = b.id 
                LEFT JOIN categories c ON p.category_id = c.id
                LEFT JOIN (
                    SELECT 
                        product_id,
                        COUNT(id) as review_count,
                        AVG(rating) as avg_rating
                    FROM reviews 
                    GROUP BY product_id
                ) r ON p.id = r.product_id
                LEFT JOIN (
                    SELECT 
                        oi.product_id,
                        COUNT(DISTINCT o.id) as order_count
                    FROM orderitems oi
                    JOIN orders o ON oi.order_id = o.id
                    WHERE o.status != 'cancelled'
                    GROUP BY oi.product_id
                ) o ON p.id = o.product_id
                LEFT JOIN (
                    SELECT 
                        product_id,
                        SUM(sold_count) as total_sold,
                        MIN(price) as min_price,
                        MAX(price) as max_price
                    FROM productvariants
                    GROUP BY product_id
                ) pv ON p.id = pv.product_id
                LEFT JOIN (
                    SELECT 
                        product_id,
                        COUNT(DISTINCT user_id) as unique_viewers,
                        SUM(view_count) as total_views
                    FROM user_product_views
                    GROUP BY product_id
                ) v ON p.id = v.product_id
            """
            
            # Load và xử lý data
            products_df = pd.read_sql(query, conn)
            
            # Debug info
            print(f"Loaded {len(products_df)} products")
            print("\nMetrics summary:")
            print(products_df[['unique_viewers', 'total_views', 'sold_count']].describe())
            
            # Xử lý dữ liệu
            products_df = self._preprocess_data(products_df)
            products_df = self._calculate_enhanced_popularity(products_df)
            
            # Lưu recommendations và thời gian train
            self.recommendations = products_df.sort_values('popularity_score', ascending=False)
            self.last_train_time = datetime.now()
            
            print(f"\nTop 5 products by popularity:")
            print(self.recommendations[['name', 'popularity_score', 'total_views']].head())
            
            return True
            
        except Exception as e:
            print(f"Error during training: {str(e)}")
            return False

    def _preprocess_data(self, df):
        """Xử lý và chuẩn hóa dữ liệu"""
        # Xử lý missing values
        df['review_count'] = df['review_count'].fillna(0)
        df['avg_rating'] = df['avg_rating'].fillna(0)
        df['order_count'] = df['order_count'].fillna(0)
        df['sold_count'] = df['sold_count'].fillna(0)
        df['description'] = df['description'].fillna('')
        
        # Tính thời gian tồn tại của sản phẩm
        df['days_since_launch'] = (datetime.now() - pd.to_datetime(df['created_at'])).dt.days
        
        return df

    def _calculate_enhanced_popularity(self, df):
        """Tính điểm phổ biến với metrics tốt hơn"""
        scaler = MinMaxScaler()
        
        if len(df) > 0:
            # Chuẩn hóa các metrics
            metrics = [
                'review_count', 'avg_rating', 'sold_count', 
                'order_count', 'unique_viewers', 'total_views'
            ]
            for metric in metrics:
                df[f'{metric}_score'] = scaler.fit_transform(df[[metric]])
            
            # Tính thời gian tồn tại của sản phẩm
            df['days_since_launch'] = (datetime.now() - pd.to_datetime(df['created_at'])).dt.days
            df['recency_score'] = 1 / (1 + df['days_since_launch'] / 30)  # Giảm dần theo tháng
            
            # Tính popularity với trọng số mới
            df['popularity_score'] = (
                0.25 * df['total_views_score'] +      # Views vẫn quan trọng
                0.20 * df['sold_count_score'] +       # Doanh số quan trọng thứ 2
                0.15 * df['unique_viewers_score'] +    # Số người xem unique
                0.15 * df['avg_rating_score'] +        # Rating quan trọng
                0.15 * df['recency_score'] +          # Thêm độ mới
                0.10 * df['review_count_score']        # Review ít quan trọng hơn
            )
            
            # Thêm reason dựa trên metrics
            df['reason'] = df.apply(self._get_enhanced_reason, axis=1)
            
        return df

    def _get_enhanced_reason(self, row):
        """Tạo lý do gợi ý thông minh hơn"""
        reasons = []
        
        # Views & Engagement
        if row['total_views'] >= 122:
            views_ratio = int((row['total_views'] / 111.6 - 1) * 100)
            if row['unique_viewers'] >= 26:
                reasons.append(f"Hot {row['total_views']:,} lượt xem • {row['unique_viewers']} người quan tâm")
            else:
                reasons.append(f"Hot {row['total_views']:,} lượt xem")
        elif row['total_views'] >= 112:
            reasons.append(f"Phổ biến với {row['total_views']:,} lượt xem")
        
        # Rating & Reviews    
        if row['avg_rating'] >= 4.0 and row['review_count'] >= 15:
            reasons.append(f"Đánh giá xuất sắc {row['avg_rating']:.1f}★ ({row['review_count']} đánh giá)")
        elif row['avg_rating'] >= 3.5 and row['review_count'] >= 10:
            reasons.append(f"Đánh giá tốt {row['avg_rating']:.1f}★ ({row['review_count']} đánh giá)")
            
        # Doanh số & Độ mới
        if row['days_since_launch'] <= 30:
            sales_per_day = row['sold_count'] / max(1, row['days_since_launch'])
            if sales_per_day >= 2:
                reasons.append(f"Bán {int(sales_per_day)} sản phẩm/ngày")
            elif row['sold_count'] >= 29:
                reasons.append(f"Mới & Bán chạy ({int(row['sold_count'])} đã bán)")
        elif row['sold_count'] >= 100:
            reasons.append(f"Best seller ({int(row['sold_count'])} đã bán)")
        elif row['sold_count'] >= 50:
            reasons.append(f"Bán chạy ({int(row['sold_count'])} đã bán)")
        
        return " • ".join(reasons[:2])

    def _get_price_score(self, row):
        """Tính điểm giá dựa trên phân khúc"""
        category = row['category_name']
        price = row['min_price']
        
        # Định nghĩa phân khúc giá theo danh mục
        segments = {
            'Điện thoại': [(0, 5e6, 1), (5e6, 15e6, 0.8), (15e6, float('inf'), 0.6)],
            'Laptop văn phòng': [(0, 10e6, 1), (10e6, 20e6, 0.8), (20e6, float('inf'), 0.6)],
            'default': [(0, 2e6, 1), (2e6, 5e6, 0.8), (5e6, float('inf'), 0.6)]
        }
        
        # Lấy phân khúc phù hợp
        price_ranges = segments.get(category, segments['default'])
        
        # Tính điểm
        for min_price, max_price, score in price_ranges:
            if min_price <= price < max_price:
                return score
        return 0.5

    def _create_content_features(self, df):
        """Tạo đặc trưng từ nội dung sản phẩm"""
        # Kết hợp text features
        df['content'] = df['name'] + ' ' + df['description'] + ' ' + \
                       df['category_name'] + ' ' + df['brand_name']
                       
        # Tạo TF-IDF matrix
        tfidf = TfidfVectorizer(stop_words='english')
        self.tfidf_matrix = tfidf.fit_transform(df['content'])
        self.feature_names = tfidf.get_feature_names_out()

    def recommend(self, limit=8, category=None, min_price=None, max_price=None, brand=None):
        """Cải thiện recommendations với phân phối tốt hơn"""
        filtered_df = self.recommendations.copy()
        
        # 1. Phân nhóm theo giá chi tiết hơn
        price_ranges = [
            (0, 2000000, 'Phổ thông'),
            (2000000, 5000000, 'Tầm trung thấp'),
            (5000000, 15000000, 'Tầm trung cao'),
            (15000000, float('inf'), 'Cao cấp')
        ]
        
        filtered_df['price_segment'] = filtered_df.apply(
            lambda x: next(
                (segment for min_p, max_p, segment in price_ranges 
                 if min_p <= x['min_price'] < max_p), 
                'Unknown'
            ),
            axis=1
        )
        
        # 2. Đa dạng hóa kết quả
        diverse_results = []
        seen_categories = set()
        seen_brands = set()
        segments_count = {'Cao cấp': 0, 'Tầm trung cao': 0, 'Tầm trung thấp': 0, 'Phổ thông': 0}
        max_per_segment = 2
        
        # Sort by popularity within each segment
        for segment in ['Cao cấp', 'Tầm trung cao', 'Tầm trung thấp', 'Phổ thông']:
            segment_df = filtered_df[filtered_df['price_segment'] == segment]
            
            for _, product in segment_df.iterrows():
                if len(diverse_results) >= limit:
                    break
                    
                if segments_count[segment] >= max_per_segment:
                    continue
                    
                # Kiểm tra category và brand
                if (product['category_name'] not in seen_categories and 
                    product['brand_name'] not in seen_brands):
                    
                    # Format metrics
                    product['metrics'] = {
                        'avg_rating': round(product['avg_rating'], 1),
                        'review_count': int(product['review_count']),
                        'sold_count': int(product['sold_count']),
                        'total_views': int(product['total_views']),
                        'unique_viewers': int(product['unique_viewers'])
                    }
                    
                    diverse_results.append(product)
                    seen_categories.add(product['category_name'])
                    seen_brands.add(product['brand_name'])
                    segments_count[segment] += 1
        
        return diverse_results

    def _diversify_results(self, df, max_per_category=2, max_per_brand=2):
        """Đa dạng hóa kết quả theo danh mục, thương hiệu và phân khúc giá"""
        diverse_df = pd.DataFrame()
        
        # Định nghĩa phân khúc giá theo danh mục
        price_segments = {
            'Điện thoại': [
                (0, 5000000, 'Phổ thông'),
                (5000000, 15000000, 'Tầm trung'),
                (15000000, float('inf'), 'Cao cấp')
            ],
            'Laptop văn phòng': [
                (0, 10000000, 'Phổ thông'),
                (10000000, 20000000, 'Tầm trung'),
                (20000000, float('inf'), 'Cao cấp')
            ],
            'default': [
                (0, 2000000, 'Phổ thông'),
                (2000000, 5000000, 'Tầm trung'),
                (5000000, float('inf'), 'Cao cấp')
            ]
        }
        
        # Đa dạng hóa theo danh mục
        for category in df['category_name'].unique():
            category_df = df[df['category_name'] == category]
            
            # Lấy phân khúc giá phù hợp với danh mục
            segments = price_segments.get(category, price_segments['default'])
            
            # Đa dạng theo thương hiệu và phân khúc giá
            brand_diverse = pd.DataFrame()
            for brand in category_df['brand_name'].unique():
                brand_df = category_df[category_df['brand_name'] == brand]
                
                # Đảm bảo mỗi phân khúc giá có đại diện
                price_diverse = pd.DataFrame()
                for min_price, max_price, _ in segments:
                    price_df = brand_df[
                        (brand_df['min_price'] >= min_price) & 
                        (brand_df['min_price'] < max_price)
                    ].head(1)  # Lấy 1 SP mỗi phân khúc
                    
                    price_diverse = pd.concat([price_diverse, price_df])
                
                brand_diverse = pd.concat([
                    brand_diverse, 
                    price_diverse.head(max_per_brand)  # Giới hạn SP/thương hiệu
                ])
            
            diverse_df = pd.concat([
                diverse_df, 
                brand_diverse.head(max_per_category)  # Giới hạn SP/danh mục
            ])
        
        # Sắp xếp theo điểm phổ biến và đảm bảo đủ limit
        return diverse_df.sort_values(['popularity_score', 'avg_rating'], 
                                    ascending=[False, False])

    def get_recommendations_data(self):
        """Get raw recommendations data for evaluation"""
        try:
            if self.recommendations is None:
                return {
                    'recommendations': [],
                    'metadata': {
                        'last_trained': None
                    }
                }
                
            # Convert recommendations DataFrame to list of dicts
            recommendations = self.recommendations.to_dict('records')
            
            # Format data structure
            formatted_recs = []
            for rec in recommendations:
                formatted_rec = {
                    'product_id': rec['product_id'],
                    'name': rec['name'],
                    'brand_name': rec['brand_name'],
                    'category_name': rec['category_name'],
                    'image_url': rec['image_url'],
                    'min_price': rec['min_price'],
                    'max_price': rec['max_price'],
                    'metrics': {
                        'avg_rating': rec['avg_rating'],
                        'review_count': rec['review_count'],
                        'sold_count': rec['sold_count'],
                        'popularity_score': rec['popularity_score']
                    }
                }
                formatted_recs.append(formatted_rec)
                
            return {
                'recommendations': formatted_recs,
                'metadata': {
                    'last_trained': self.last_train_time.isoformat() if self.last_train_time else None
                }
            }
            
        except Exception as e:
            print(f"Error getting recommendations data: {str(e)}")
            return {
                'recommendations': [],
                'metadata': {
                    'last_trained': None,
                    'error': str(e)
                }
            }

    def plot_analytics(self):
        """Tạo dashboard phân tích"""
        
        # Set up the matplotlib figure
        plt.style.use('seaborn')
        fig = plt.figure(figsize=(20, 12))
        
        # 1. Popularity Score Distribution
        plt.subplot(2, 3, 1)
        sns.histplot(data=self.recommendations, x='popularity_score', bins=20)
        plt.title('Phân phối Popularity Score')
        
        # 2. Top 10 Popular Products
        plt.subplot(2, 3, 2)
        top_10 = self.recommendations.head(10)
        sns.barplot(data=top_10, y='name', x='popularity_score')
        plt.title('Top 10 Sản phẩm phổ biến nhất')
        
        # 3. Category Distribution
        plt.subplot(2, 3, 3)
        category_counts = self.recommendations['category_name'].value_counts()
        plt.pie(category_counts.values, labels=category_counts.index, autopct='%1.1f%%')
        plt.title('Phân phối theo danh mục')
        
        # 4. Metrics Correlation
        plt.subplot(2, 3, 4)
        metrics = ['total_views', 'sold_count', 'unique_viewers', 'avg_rating']
        sns.heatmap(self.recommendations[metrics].corr(), annot=True, cmap='coolwarm')
        plt.title('Tương quan giữa các metrics')
        
        # 5. Views vs Sales
        plt.subplot(2, 3, 5)
        plt.scatter(self.recommendations['total_views'], 
                   self.recommendations['sold_count'])
        plt.xlabel('Tổng lượt xem')
        plt.ylabel('Số lượng bán')
        plt.title('Mối quan hệ Views - Sales')
        
        # 6. Price Distribution
        plt.subplot(2, 3, 6)
        sns.boxplot(data=self.recommendations, y='category_name', x='min_price')
        plt.title('Phân phối giá theo danh mục')
        
        plt.tight_layout()
        plt.savefig('popularity_analytics.png')
        plt.show()

    def create_interactive_dashboard(self):
        """Tạo dashboard tương tác với Plotly"""
        
        # 1. Popularity Score Distribution
        fig1 = px.histogram(self.recommendations, 
                           x='popularity_score',
                           title='Phân phối Popularity Score')
        
        # 2. Top Products
        fig2 = px.bar(self.recommendations.head(10),
                      x='name', y='popularity_score',
                      title='Top 10 Sản phẩm phổ biến nhất')
        
        # 3. Category Distribution
        fig3 = px.pie(self.recommendations,
                      names='category_name',
                      title='Phân phối theo danh mục')
        
        # 4. Metrics Scatter Plot
        fig4 = px.scatter(self.recommendations,
                         x='total_views', y='sold_count',
                         size='popularity_score',
                         color='category_name',
                         hover_data=['name'],
                         title='Phân tích đa chiều Metrics')
        
        # Show all plots
        fig1.show()
        fig2.show()
        fig3.show()
        fig4.show()
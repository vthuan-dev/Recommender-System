<template>
    <div class="search-page container py-4">
      <nav aria-label="breadcrumb">
        <ol class="breadcrumb">
          <li class="breadcrumb-item"><router-link to="/">Trang chủ</router-link></li>
          <li class="breadcrumb-item active">Kết quả tìm kiếm</li>
        </ol>
      </nav>
  
      <div class="search-header">
        <h2>Kết quả tìm kiếm cho "{{ searchQuery }}"</h2>
        <p>Tìm thấy {{ totalResults }} sản phẩm</p>
      </div>
  
      <!-- Loading state -->
      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Đang tải...</span>
        </div>
      </div>
  
      <!-- No results -->
      <div v-else-if="!loading && products.length === 0" class="no-results">
        <i class="fas fa-search fa-3x mb-3"></i>
        <h3>Không tìm thấy sản phẩm nào</h3>
        <p>Vui lòng thử lại với từ khóa khác</p>
      </div>
  
      <!-- Results grid -->
      <div v-else class="row">
        <div v-for="product in products" :key="product.id" class="col-md-3 mb-4">
          <div class="product-card">
            <router-link :to="`/products/${product.id}`" class="product-link">
              <img :src="product.image_url" :alt="product.name" class="product-image">
              <div class="product-info">
                <h3 class="product-name">{{ product.name }}</h3>
                <div class="product-price">{{ formatPrice(product.min_price) }}</div>
                <div class="product-rating" v-if="product.avg_rating">
                  <i v-for="n in 5" :key="n" class="fas fa-star"
                     :class="{ 'text-warning': n <= Math.round(product.avg_rating) }">
                  </i>
                  <span>({{ product.review_count }})</span>
                </div>
              </div>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import axios from 'axios'
  
  export default {
    name: 'SearchPage',
    setup() {
      const route = useRoute()
      const products = ref([])
      const loading = ref(true)
      const searchQuery = ref('')
      const totalResults = ref(0)
  
      const fetchSearchResults = async () => {
        loading.value = true
        try {
          const response = await axios.get('http://localhost:3000/api/search', {
            params: {
              q: route.query.q
            }
          })
          products.value = response.data.products
          totalResults.value = response.data.total
          searchQuery.value = route.query.q
        } catch (error) {
          console.error('Lỗi tìm kiếm:', error)
        } finally {
          loading.value = false
        }
      }
  
      const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(price)
      }
  
      // Watch for route query changes
      watch(() => route.query.q, () => {
        fetchSearchResults()
      })
  
      onMounted(() => {
        fetchSearchResults()
      })
  
      return {
        products,
        loading,
        searchQuery,
        totalResults,
        formatPrice
      }
    }
  }
  </script>
  
  <style scoped>
  .search-page {
    min-height: 80vh;
    padding: 2rem 0;
  }
  
  .search-header {
    margin-bottom: 2.5rem;
    text-align: center;
    padding: 2rem 0;
    background: #f8f9fa;
    border-radius: 12px;
  }
  
  .search-header h2 {
    color: #2c3e50;
    font-size: 1.8rem;
    font-weight: 600;
    margin-bottom: 1rem;
  }
  
  .search-header p {
    color: #6c757d;
    font-size: 1.1rem;
    margin: 0;
  }
  
  .no-results {
    text-align: center;
    padding: 4rem 0;
    color: #6c757d;
    background: #f8f9fa;
    border-radius: 12px;
    margin: 2rem 0;
  }
  
  .no-results i {
    color: #dee2e6;
    margin-bottom: 1.5rem;
  }
  
  .no-results h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: #2c3e50;
  }
  
  /* Card styling */
  .product-card {
    background: white;
    border: none;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s ease;
    height: 100%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    position: relative;
  }
  
  .product-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
  }
  
  .product-link {
    text-decoration: none;
    color: inherit;
    display: block;
    height: 100%;
  }
  
  .product-image {
    width: 100%;
    height: 240px;
    object-fit: contain;
    background: #f8f9fa;
    padding: 1rem;
    transition: transform 0.3s ease;
  }
  
  .product-card:hover .product-image {
    transform: scale(1.05);
  }
  
  .product-info {
    padding: 1.25rem;
    position: relative;
  }
  
  .product-name {
    font-size: 1rem;
    font-weight: 500;
    margin: 0 0 0.75rem;
    color: #2c3e50;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    line-height: 1.5;
    height: 3em;
  }
  
  .product-price {
    color: #e74c3c;
    font-weight: 600;
    font-size: 1.2rem;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .product-rating {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.9rem;
    color: #ffc107;
  }
  
  .product-rating span {
    color: #6c757d;
    margin-left: 6px;
    font-size: 0.85rem;
  }
  
  /* Loading spinner */
  .spinner-border {
    width: 3rem;
    height: 3rem;
  }
  
  /* Grid layout */
  .row {
    margin: -12px;
  }
  
  .col-md-3 {
    padding: 12px;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .search-header {
      padding: 1.5rem 1rem;
      margin-bottom: 1.5rem;
    }
  
    .search-header h2 {
      font-size: 1.4rem;
    }
  
    .product-image {
      height: 180px;
    }
  
    .product-info {
      padding: 1rem;
    }
  
    .product-name {
      font-size: 0.9rem;
    }
  
    .product-price {
      font-size: 1.1rem;
    }
  }
  
  /* Badge styles */
  .discount-badge {
    position: absolute;
    top: 10px;
    left: 10px;
    background: #e74c3c;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.85rem;
    font-weight: 500;
    z-index: 1;
  }
  
  /* Add to cart button */
  .add-to-cart {
    position: absolute;
    bottom: 1rem;
    right: 1rem;
    background: #3498db;
    color: white;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    opacity: 0;
    transform: translateY(10px);
  }
  
  .product-card:hover .add-to-cart {
    opacity: 1;
    transform: translateY(0);
  }
  
  .add-to-cart:hover {
    background: #2980b9;
    transform: scale(1.1);
  }
  </style>
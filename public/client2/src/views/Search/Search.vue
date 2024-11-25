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
  }
  
  .search-header {
    margin-bottom: 2rem;
  }
  
  .search-header h2 {
    color: #333;
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }
  
  .search-header p {
    color: #666;
    margin: 0;
  }
  
  .no-results {
    text-align: center;
    padding: 3rem 0;
    color: #666;
  }
  
  .product-card {
    border: 1px solid #eee;
    border-radius: 8px;
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .product-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  }
  
  .product-link {
    text-decoration: none;
    color: inherit;
  }
  
  .product-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }
  
  .product-info {
    padding: 1rem;
  }
  
  .product-name {
    font-size: 1rem;
    margin: 0 0 0.5rem;
    color: #333;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .product-price {
    color: #1a73e8;
    font-weight: 600;
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
  }
  
  .product-rating {
    font-size: 0.9rem;
  }
  
  .product-rating span {
    color: #666;
    margin-left: 5px;
  }
  </style>
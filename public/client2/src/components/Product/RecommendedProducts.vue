<template>
  <section class="recommendations-section">
    <div class="container py-5">
      <div class="section-header text-center mb-5">
        <h6 class="text-primary text-uppercase fw-bold">Dành riêng cho bạn</h6>
        <h2 class="section-title">Gợi ý sản phẩm</h2>
      </div>
      
      <div class="row g-4">
        <div v-for="product in recommendedProducts" 
             :key="product.product_id" 
             class="col-6 col-md-3">
          <ProductCard 
            :product="product"
            @add-to-wishlist="$emit('add-to-wishlist', product)"
            @add-to-cart="$emit('add-to-cart', product)"
          />
          <!-- Hiển thị lý do gợi ý -->
          <div class="recommendation-reason mt-2">
            <i class="fas fa-info-circle"></i>
            {{ product.reason }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { ref, onMounted } from 'vue'
import axiosInstance from '@/utils/axios'
import ProductCard from './ProductCard.vue'

export default {
  name: 'RecommendedProducts',
  components: {
    ProductCard
  },
  emits: ['add-to-wishlist', 'add-to-cart'],
  setup() {
    const recommendedProducts = ref([])

    const loadRecommendations = async () => {
      try {
        const response = await axiosInstance.get('/api/recommended-products')
        recommendedProducts.value = response.data
      } catch (error) {
        console.error('Error loading recommendations:', error)
      }
    }

    onMounted(() => {
      loadRecommendations()
    })

    return {
      recommendedProducts
    }
  }
}
</script>

<style scoped>
.recommendation-reason {
  font-size: 0.9rem;
  color: #6c757d;
  padding: 0.5rem;
  background: #f8f9fa;
  border-radius: 0.5rem;
  margin-top: 0.5rem;
}

.recommendation-reason i {
  color: #0d6efd;
  margin-right: 0.5rem;
}
</style> 
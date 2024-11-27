<template>
  <section class="recommended-products py-5">
    <div class="container">
      <div class="section-title mb-4">
        <h2>Gợi ý cho bạn</h2>
        <p class="text-muted">Dựa trên xu hướng mua sắm</p>
      </div>

      <div v-if="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <div v-else class="row g-4">
        <div v-for="product in recommendations" 
             :key="product.id" 
             class="col-6 col-md-4 col-lg-3"
        >
          <ProductCard 
            :product="product"
            @add-to-wishlist="addToWishlist"
            @add-to-cart="addToCart"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import ProductCard from './ProductCard.vue'
import axios from 'axios'

export default {
  name: 'RecommendedProducts',
  components: {
    ProductCard
  },
  data() {
    return {
      recommendations: [],
      loading: true
    }
  },
  async created() {
    try {
      const response = await axios.get('http://localhost:5000/api/home-recommendations')
      if (response.data.success) {
        // Format data nếu cần
        this.recommendations = response.data.recommendations.map(rec => ({
          id: rec.product_id,
          name: rec.name,
          image_url: rec.image_url,
          brand_name: rec.brand_name,
          min_price: rec.min_price,
          max_price: rec.max_price,
          metrics: rec.metrics,
          reason: rec.reason // Nếu muốn hiển thị lý do gợi ý
        }))
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error)
    } finally {
      this.loading = false
    }
  },
  methods: {
    addToWishlist(product) {
      this.$emit('add-to-wishlist', product)
    },
    addToCart(product) {
      this.$emit('add-to-cart', product)
    }
  }
}
</script>

<style scoped>
.recommended-products {
  background-color: #f8f9fa;
}

.section-title {
  text-align: center;
}

.section-title h2 {
  font-size: 2rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

/* Optional: Add recommendation reason */
.recommendation-reason {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0, 97, 242, 0.9);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  z-index: 2;
}
</style> 
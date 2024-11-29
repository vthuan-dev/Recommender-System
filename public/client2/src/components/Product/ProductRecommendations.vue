<template>
  <div class="container py-5">
    <div class="section-header text-center mb-5">
      <h6 class="text-primary text-uppercase fw-bold">{{ subtitle }}</h6>
      <h2 class="section-title">{{ title }}</h2>
    </div>
    <div class="row g-4">
      <div v-for="product in recommendations" 
           :key="product.id" 
           class="col-6 col-md-3">
        <ProductCard 
          :product="product"
          @add-to-wishlist="$emit('add-to-wishlist', product)"
          @add-to-cart="$emit('add-to-cart', product)"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import ProductCard from './ProductCard.vue'
import axios from 'axios'

export default {
  name: 'ProductRecommendations',
  components: {
    ProductCard
  },
  props: {
    userId: {
      type: Number,
      required: true
    }
  },
  setup(props) {
    const store = useStore()
    const isAuthenticated = computed(() => store.state.auth.isAuthenticated)
    const recommendations = ref([])

    const title = computed(() => 
      isAuthenticated.value ? 'Gợi ý sản phẩm' : 'Sản phẩm phổ biến'
    )
    const subtitle = computed(() => 
      isAuthenticated.value ? 'Dành riêng cho bạn' : 'Được nhiều người quan tâm'
    )

    const loadRecommendations = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/collaborative/recommend`, {
          params: {
            user_id: props.userId
          }
        })
        if (response.data.success) {
          recommendations.value = response.data.recommendations
        }
      } catch (error) {
        console.error('Error loading recommendations:', error)
        // Fallback to popularity recommendations
        try {
          const fallbackResponse = await axios.get('http://localhost:5001/api/popularity/recommend', {
            params: { limit: 8 }
          })
          if (fallbackResponse.data.success) {
            recommendations.value = fallbackResponse.data.recommendations
          }
        } catch (fallbackError) {
          console.error('Fallback error:', fallbackError)
        }
      }
    }

    onMounted(() => {
      loadRecommendations()
    })

    return {
      recommendations,
      title,
      subtitle
    }
  }
}
</script>
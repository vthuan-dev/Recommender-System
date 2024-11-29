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

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import ProductCard from './ProductCard.vue'

const store = useStore()
const isAuthenticated = computed(() => store.state.auth.isAuthenticated)

const title = computed(() => 
  isAuthenticated.value ? 'Gợi ý sản phẩm' : 'Sản phẩm phổ biến'
)
const subtitle = computed(() => 
  isAuthenticated.value ? 'Dành riêng cho bạn' : 'Được nhiều người quan tâm'
)

const { userId } = defineProps({
  userId: {
    type: Number,
    required: true
  }
})
</script>
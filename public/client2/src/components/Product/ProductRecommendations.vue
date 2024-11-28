<template>
    <div class="recommendations-section">
      <h3 class="section-title">{{ title }}</h3>
      <div class="products-grid">
        <div v-for="product in recommendations" 
             :key="product.id" 
             class="product-card">
          <router-link :to="`/product/${product.product_id}`">
            <img :src="product.image_url" :alt="product.name">
            <div class="product-info">
              <h4>{{ product.name }}</h4>
              <div class="price">
                {{ formatPrice(product.min_price) }}
              </div>
              <div class="rating">
                <i class="fas fa-star"></i>
                {{ product.avg_rating.toFixed(1) }}
                ({{ product.review_count }})
              </div>
            </div>
          </router-link>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from 'vue';
  import axios from 'axios';
  
  export default {
    name: 'ProductRecommendations',
    props: {
      userId: {
        type: [Number, String],
        required: true
      }
    },
    setup(props) {
      const recommendations = ref([]);
      const title = ref('Gợi ý cho bạn');
  
      const loadRecommendations = async () => {
        try {
          const response = await axios.get(
            `http://localhost:3000/api/recommendations/user/${props.userId}`
          );
          recommendations.value = response.data.recommendations;
          
          if (response.data.source === 'popularity') {
            title.value = 'Sản phẩm phổ biến';
          }
        } catch (error) {
          console.error('Error loading recommendations:', error);
        }
      };
  
      onMounted(loadRecommendations);
  
      return {
        recommendations,
        title
      };
    }
  };
  </script>
<template>
  <div class="product-card">
    <router-link 
      :to="{ 
        name: 'ProductDetail',
        params: { id: product.id }
      }" 
      class="product-link"
    >
      <div class="product-card">
        <div class="card border-0 rounded-4 shadow-hover h-100">
          <div class="product-image">
            <img 
              :src="getImageUrl(product.image_url)" 
              :alt="product.name"
              @error="handleImageError"
            >
            <div class="product-actions">
              <button class="action-btn" @click.prevent="$emit('add-to-wishlist', product)">
                <i class="fas fa-heart"></i>
              </button>
              <button class="action-btn" @click.prevent="$emit('add-to-cart', product)">
                <i class="fas fa-shopping-cart"></i>
              </button>
            </div>
          </div>
          <div class="card-body">
            <h5 class="product-title">{{ product.name }}</h5>
            <div class="product-price">
              <span class="new-price">{{ formatPrice(product.min_price) }}</span>
              <span v-if="product.max_price > product.min_price" 
                    class="old-price text-muted text-decoration-line-through ms-2">
                {{ formatPrice(product.max_price) }}
              </span>
            </div>
            <div class="brand-name text-muted small">
              {{ product.brand_name }}
            </div>
          </div>
        </div>
      </div>
    </router-link>
  </div>
</template>

<script>
export default {
  name: 'ProductCard',
  props: {
    product: {
      type: Object,
      required: true
    }
  },
  methods: {
    formatPrice(price) {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price)
    },
    getImageUrl(imageUrl) {
      if (!imageUrl) {
        return '/assets/images/default-product.png'
      }
      
      // Nếu là URL đầy đủ
      if (imageUrl.startsWith('http')) {
        return imageUrl
      }
      
      // Thêm base URL cho đường dẫn tương đối
      return `http://localhost:3000${imageUrl}`
    },
    handleImageError(event) {
      event.target.src = '/assets/images/default-product.png'
    }
  }
}
</script>

<style scoped>
.product-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.product-card {
  transition: all 0.3s ease;
}

.product-image {
  position: relative;
  padding-top: 100%;
  overflow: hidden;
}

.product-image img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-actions {
  position: absolute;
  right: 1rem;
  top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  opacity: 0;
  transform: translateX(20px);
  transition: all 0.3s ease;
  z-index: 2;
}

.product-card:hover .product-actions {
  opacity: 1;
  transform: translateX(0);
}

.action-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: white;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: #0061f2;
  color: white;
}

.shadow-hover:hover {
  transform: translateY(-5px);
  box-shadow: 0 1rem 3rem rgba(0,0,0,.175)!important;
}

.product-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 2.4em;
  margin-bottom: 0.5rem;
}

.product-price {
  margin-bottom: 0.5rem;
}

.new-price {
  font-weight: bold;
  color: #dc3545;
  font-size: 1.1rem;
}

.old-price {
  font-size: 0.9rem;
}

.brand-name {
  color: #6c757d;
}
</style>
<template>
  <div class="product-card">
    <router-link 
      v-if="isValidProduct"
      :to="`/products/${productId}`"
      class="product-link"
    >
      <div class="card border-0 rounded-4 shadow-hover h-100">
        <div v-if="product.max_price > product.min_price" class="discount-badge">
          -{{ calculateDiscount(product.max_price, product.min_price) }}%
        </div>
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
            <span class="new-price">{{ formattedPrice.min }}</span>
            <span v-if="product.max_price > product.min_price" 
                  class="old-price text-muted text-decoration-line-through ms-2">
              {{ formattedPrice.max }}
            </span>
          </div>
          <div class="product-metrics small text-muted">
            <span v-if="product.metrics?.avg_rating" class="me-2">
              <i class="fas fa-star text-warning"></i>
              {{ product.metrics.avg_rating.toFixed(1) }}
            </span>
            <span v-if="product.metrics?.review_count" class="me-2">
              <i class="fas fa-comment-dots"></i>
              {{ product.metrics.review_count }} đánh giá
            </span>
            <span v-if="product.metrics?.sold_count">
              <i class="fas fa-shopping-cart"></i>
              {{ product.metrics.sold_count }} đã bán
            </span>
          </div>
          <div v-if="recommendationReason" class="recommendation-reason">
            <span class="badge bg-soft-primary rounded-pill">
              <i class="fas fa-thumbs-up me-1"></i>
              {{ recommendationReason }}
            </span>
          </div>
        </div>
      </div>
    </router-link>
    <div v-else class="card border-0 rounded-4 shadow-hover h-100">
      <div v-if="product.max_price > product.min_price" class="discount-badge">
        -{{ calculateDiscount(product.max_price, product.min_price) }}%
      </div>
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
          <span class="new-price">{{ formattedPrice.min }}</span>
          <span v-if="product.max_price > product.min_price" 
                class="old-price text-muted text-decoration-line-through ms-2">
            {{ formattedPrice.max }}
          </span>
        </div>
        <div class="product-metrics small text-muted">
          <span v-if="product.metrics?.avg_rating" class="me-2">
            <i class="fas fa-star text-warning"></i>
            {{ product.metrics.avg_rating.toFixed(1) }}
          </span>
          <span v-if="product.metrics?.review_count" class="me-2">
            <i class="fas fa-comment-dots"></i>
            {{ product.metrics.review_count }} đánh giá
          </span>
          <span v-if="product.metrics?.sold_count">
            <i class="fas fa-shopping-cart"></i>
            {{ product.metrics.sold_count }} đã bán
          </span>
        </div>
        <div v-if="recommendationReason" class="recommendation-reason">
          <span class="badge bg-soft-primary rounded-pill">
            <i class="fas fa-thumbs-up me-1"></i>
            {{ recommendationReason }}
          </span>
        </div>
      </div>
    </div>
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
  computed: {
    formattedPrice() {
      const minPrice = this.product.min_price || 0
      const maxPrice = this.product.max_price || 0
      return {
        min: this.formatPrice(minPrice),
        max: maxPrice > minPrice ? this.formatPrice(maxPrice) : null
      }
    },
    isValidProduct() {
      return this.product && (this.productId != null);
    },
    productId() {
      const id = this.product.id || this.product.product_id || this.product._id;
      console.log('Product ID computed:', id, 'for product:', this.product);
      return id;
    },
    recommendationReason() {
      if (!this.product.reason) return null;
      
      // Format reason dựa trên source
      if (this.product.source === 'collaborative') {
        return 'Dựa trên lịch sử xem của bạn';
      } else if (this.product.source === 'content') {
        return 'Sản phẩm tương tự';
      }
      return this.product.reason;
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
    },
    calculateDiscount(oldPrice, newPrice) {
      return Math.round((oldPrice - newPrice) / oldPrice * 100)
    },
    handleProductClick() {
      // Prevent default scroll behavior
      if (this.$route.name === 'ProductDetail') {
        this.$router.push(`/products/${this.product.id}`).catch(() => {})
      }
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
  max-width: 300px;
  margin: 0 auto;
}

.product-image {
  position: relative;
  padding-top: 100%;
  overflow: hidden;
  max-height: 300px;
}

.product-image img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  padding: 10px;
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
  font-size: 1rem;
  line-height: 1.4;
  height: 2.8em;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.product-price {
  margin-bottom: 0.5rem;
}

.new-price {
  font-weight: bold;
  color: #dc3545;
  font-size: 1rem;
}

.old-price {
  font-size: 0.85rem;
}

.brand-name {
  color: #6c757d;
}

.card {
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.recommendation-reason {
  font-size: 0.85rem;
  margin-top: 8px;
  display: block;
}

.recommendation-reason .badge {
  font-weight: normal;
  padding: 0.5em 0.8em;
  display: inline-block;
  white-space: normal;
  text-align: left;
  line-height: 1.4;
}

.product-metrics {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  font-size: 0.8rem;
  margin-top: 8px;
}

.product-metrics i {
  margin-right: 0.25rem;
}

.discount-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: #dc3545;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  z-index: 2;
}

.product-card:hover .product-actions {
  opacity: 1;
  transform: translateX(0);
}

.product-card:hover .card {
  transform: translateY(-5px);
  box-shadow: 0 0.5rem 1rem rgba(0,0,0,0.15);
}

.recommendation-reason {
  margin-top: 0.5rem;
}

.bg-soft-primary {
  background-color: rgba(13, 110, 253, 0.1);
  color: #0d6efd;
  font-size: 0.85rem;
  padding: 0.35rem 0.75rem;
  display: inline-block;
}

.rounded-pill {
  border-radius: 50rem;
}

.badge {
  display: inline-block;
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
  font-weight: 500;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  vertical-align: baseline;
  border-radius: 50rem;
}
</style>
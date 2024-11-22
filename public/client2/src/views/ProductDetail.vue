<template>
  <div class="container py-4">
    <!-- Breadcrumb -->
    <nav aria-label="breadcrumb">
      <ol class="breadcrumb">
        <li class="breadcrumb-item"><router-link to="/">Trang chủ</router-link></li>
        <li class="breadcrumb-item"><router-link to="/products">Sản phẩm</router-link></li>
        <li class="breadcrumb-item active">{{ product?.name }}</li>
      </ol>
    </nav>

    <div class="row">
      <!-- Hình ảnh sản phẩm -->
      <div class="col-md-6">
        <div class="product-image-container">
          <img :src="product?.image_url" :alt="product?.name" class="img-fluid main-image">
          <button class="favorite-btn" @click="toggleFavorite">
            <i class="fas" :class="isFavorited ? 'fa-heart text-danger' : 'fa-heart-o'"></i>
          </button>
        </div>
      </div>

      <!-- Thông tin sản phẩm -->
      <div class="col-md-6">
        <div class="product-info">
          <!-- Tên và đánh giá -->
          <h1 class="product-title">{{ product?.name }}</h1>
          <div class="rating-section">
            <div class="stars">
              <i v-for="n in 5" :key="n" class="fas fa-star" 
                 :class="n <= product?.avg_rating ? 'text-warning' : 'text-muted'"></i>
            </div>
            <span>{{ product?.review_count }} đánh giá</span>
          </div>

          <!-- Phiên bản -->
          <div class="variants-section mt-4">
            <h6>Chọn phiên bản</h6>
            <div class="variant-options">
              <button v-for="variant in product?.variants" 
                      :key="variant.id"
                      class="variant-btn"
                      :class="{ active: selectedVariant?.id === variant.id }"
                      @click="selectVariant(variant)">
                <div class="variant-name">{{ variant.name }}</div>
                <div class="variant-price">{{ formatPrice(variant.price) }}</div>
              </button>
            </div>
          </div>

          <!-- Màu sắc -->
          <div class="colors-section mt-4" v-if="colors.length">
            <h6>Chọn màu</h6>
            <div class="color-options">
              <button v-for="color in colors" 
                      :key="color"
                      class="color-btn"
                      :class="{ active: selectedColor === color }"
                      @click="selectColor(color)">
                {{ color }}
              </button>
            </div>
          </div>

          <!-- Giá -->
          <div class="price-section mt-4">
            <div class="current-price">{{ formatPrice(selectedVariant?.price || product?.price) }}</div>
            <div class="original-price" v-if="hasDiscount">
              <span class="old-price">{{ formatPrice(product?.original_price) }}</span>
              <span class="discount">-{{ calculateDiscount }}%</span>
            </div>
          </div>

          <!-- Khuyến mãi -->
          <div class="promotions mt-4">
            <h6>Khuyến mãi đặc biệt</h6>
            <ul class="promotion-list">
              <li><i class="fas fa-gift text-danger"></i> Giảm thêm 500.000đ khi thanh toán qua VNPay</li>
              <li><i class="fas fa-gift text-danger"></i> Tặng PMH 500.000đ mua các sản phẩm phụ kiện</li>
            </ul>
          </div>

          <!-- Nút mua hàng -->
          <div class="purchase-buttons mt-4">
            <button class="btn btn-danger btn-lg me-3" @click="buyNow">
              MUA NGAY
              <small>Giao hàng miễn phí hoặc nhận tại shop</small>
            </button>
            <button class="btn btn-outline-primary btn-lg" @click="addToCart">
              <i class="fas fa-cart-plus"></i>
              Thêm vào giỏ
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Thông tin chi tiết -->
    <div class="row mt-5">
      <div class="col-12">
        <ul class="nav nav-tabs" id="productTabs">
          <li class="nav-item">
            <a class="nav-link active" data-bs-toggle="tab" href="#description">Mô tả</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" data-bs-toggle="tab" href="#specs">Thông số kỹ thuật</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" data-bs-toggle="tab" href="#reviews">
              Đánh giá ({{ product?.review_count }})
            </a>
          </li>
        </ul>

        <div class="tab-content mt-3">
          <div class="tab-pane fade show active" id="description">
            <div v-html="product?.description"></div>
          </div>
          <div class="tab-pane fade" id="specs">
            <!-- Thông số kỹ thuật -->
          </div>
          <div class="tab-pane fade" id="reviews">
            <div class="reviews-section">
              <div v-for="review in product?.recent_reviews" 
                   :key="review.id" 
                   class="review-item">
                <div class="reviewer-info">
                  <img :src="review.avatar_url" class="avatar" />
                  <div>
                    <div class="reviewer-name">{{ review.fullname }}</div>
                    <div class="review-date">{{ formatDate(review.created_at) }}</div>
                  </div>
                </div>
                <div class="review-rating">
                  <i v-for="n in 5" :key="n" class="fas fa-star"
                     :class="n <= review.rating ? 'text-warning' : 'text-muted'"></i>
                </div>
                <div class="review-content">{{ review.comment }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Sản phẩm liên quan -->
    <div class="related-products mt-5">
      <h3>Sản phẩm liên quan</h3>
      <div class="row">
        <div v-for="product in relatedProducts" 
             :key="product.id" 
             class="col-md-3">
          <ProductCard :product="product" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import ProductCard from '@/components/Product/ProductCard.vue'
import axios from 'axios'

export default {
  name: 'ProductDetail',
  components: {
    ProductCard
  },
  setup() {
    const route = useRoute()
    const product = ref(null)
    const selectedVariant = ref(null)
    const selectedColor = ref(null)
    const isFavorited = ref(false)
    const relatedProducts = ref([])

    const fetchProductDetail = async () => {
      try {
        const response = await axios.get(`/api/products/${route.params.id}`)
        product.value = response.data.data
        if (product.value.variants?.length) {
          selectedVariant.value = product.value.variants[0]
        }
      } catch (error) {
        console.error('Error fetching product:', error)
      }
    }

    const selectVariant = (variant) => {
      selectedVariant.value = variant
    }

    const selectColor = (color) => {
      selectedColor.value = color
    }

    const formatPrice = (price) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price)
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('vi-VN')
    }

    const addToCart = async () => {
      // Implement add to cart logic
    }

    const buyNow = async () => {
      // Implement buy now logic
    }

    const toggleFavorite = async () => {
      // Implement toggle favorite logic
    }

    onMounted(() => {
      fetchProductDetail()
    })

    return {
      product,
      selectedVariant,
      selectedColor,
      isFavorited,
      relatedProducts,
      selectVariant,
      selectColor,
      formatPrice,
      formatDate,
      addToCart,
      buyNow,
      toggleFavorite
    }
  }
}
</script>

<style scoped>
.product-image-container {
  position: relative;
  margin-bottom: 20px;
}

.main-image {
  width: 100%;
  height: auto;
  border-radius: 8px;
}

.favorite-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.variant-options, .color-options {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.variant-btn, .color-btn {
  padding: 10px 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  cursor: pointer;
}

.variant-btn.active, .color-btn.active {
  border-color: #dc3545;
  color: #dc3545;
}

.price-section {
  margin: 20px 0;
}

.current-price {
  font-size: 24px;
  font-weight: bold;
  color: #dc3545;
}

.old-price {
  text-decoration: line-through;
  color: #6c757d;
  margin-right: 10px;
}

.discount {
  color: #dc3545;
}

.promotion-list {
  list-style: none;
  padding: 0;
}

.promotion-list li {
  margin-bottom: 10px;
  padding-left: 20px;
}

.purchase-buttons .btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px 30px;
}

.purchase-buttons small {
  font-size: 12px;
  margin-top: 5px;
}

.review-item {
  border-bottom: 1px solid #eee;
  padding: 20px 0;
}

.reviewer-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
}

.review-date {
  color: #6c757d;
  font-size: 14px;
}

.review-content {
  margin-top: 10px;
}
</style>
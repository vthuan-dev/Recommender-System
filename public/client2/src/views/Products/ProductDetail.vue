<template>
  <div class="container py-4">
      <AppToast ref="toastRef" />

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Đang tải...</span>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="alert alert-danger" role="alert">
      {{ error }}
    </div>

    <!-- Product content -->
    <div v-else-if="product">
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
              <button class="btn btn-danger me-2" @click="buyNow">
                <span>MUA NGAY</span>
                <small>Giao hàng miễn phí</small>
              </button>
              <button class="btn btn-outline-primary" @click="addToCart">
                <i class="fas fa-cart-plus"></i>
                <span>Thêm vào giỏ</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Thay thế phần tabs bằng hiển thị trực tiếp -->
      <div class="product-details mt-5">
        <!-- Phần mô tả -->
        <div class="description-section mb-5">
          <h4 class="section-title">Mô tả sản phẩm</h4>
          <div class="description-content p-4 bg-white rounded shadow-sm">
            <div v-html="product?.description"></div>
          </div>
        </div>

        <!-- Phần đánh giá -->
        <div class="reviews-section mt-4">
          <h3>Đánh giá sản phẩm</h3>
          
          <!-- Danh sách đánh giá -->
          <div v-if="reviews.length > 0">
            <div v-for="review in reviews" :key="review.id" class="review-item mb-4">
              <!-- Header đánh giá -->
              <div class="review-header d-flex justify-content-between">
                <div class="user-info d-flex align-items-center">
                  <img :src="review.user.avatar_url || '/default-avatar.png'" 
                       class="rounded-circle me-2" 
                       alt="User Avatar"
                       width="40">
                  <div>
                    <strong>{{ review.user.name }}</strong>
                    <div class="rating">
                      <i v-for="n in 5" 
                         :key="n"
                         class="fas fa-star"
                         :class="n <= review.rating ? 'text-warning' : 'text-muted'">
                      </i>
                    </div>
                    <small class="text-muted">{{ formatDate(review.created_at) }}</small>
                  </div>
                </div>
                <div class="verification-status">
                  <span v-if="review.is_verified" class="badge bg-success">
                    <i class="fas fa-check-circle"></i> Đã xác minh
                  </span>
                </div>
              </div>

              <!-- Nội dung đánh giá -->
              <div class="review-content mt-3">
                <p>{{ review.comment }}</p>
              </div>

              <!-- Danh sách replies -->
              <div v-if="review.replies && review.replies.length > 0" class="replies-section mt-3">
                <div v-for="reply in review.replies" 
                     :key="reply.id" 
                     class="reply-item ms-4 mt-2 p-3">
                  <div class="reply-header d-flex align-items-center">
                    <img :src="reply.user.avatar_url || '/default-avatar.png'" 
                         class="rounded-circle me-2" 
                         width="30"
                         alt="Reply User">
                    <div>
                      <strong class="reply-user-name">
                        <i v-if="reply.user.is_admin" class="fas fa-shield-alt me-1 text-primary"></i>
                        {{ reply.user.name }}
                      </strong>
                      <small class="text-muted d-block">{{ formatDate(reply.created_at) }}</small>
                    </div>
                  </div>
                  <div class="reply-content mt-2">
                    {{ reply.content }}
                  </div>
                </div>
              </div>

              <!-- Form reply -->
              <div v-if="isAuthenticated" class="reply-form mt-3 ms-4">
                <div class="input-group">
                  <textarea 
                    v-model="review.newReplyContent"
                    class="form-control"
                    placeholder="Thêm phản hồi của bạn..."
                    rows="2">
                  </textarea>
                  <button 
                    class="btn btn-primary"
                    @click="submitReply(review)"
                    :disabled="!review.newReplyContent?.trim()">
                    Gửi
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-4">
            <p class="text-muted mb-0">Chưa có đánh giá nào cho sản phẩm này</p>
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
  </div>
</template>
<script>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ProductCard from '@/components/Product/ProductCard.vue'
import axios from 'axios'
import AppToast from '@/components/Toast/Toast.vue'
// import Swal from 'sweetalert2'
import { useToast } from 'vue-toastification'

export default {
  name: 'ProductDetail',
  components: {
    ProductCard,
    AppToast
  },
  setup() {
    const route = useRoute()
    const router = useRouter();
    const product = ref(null)
    const selectedVariant = ref(null)
    const selectedColor = ref(null)
    const colors = ref([])
    const isFavorited = ref(false)
    const relatedProducts = ref([])
    const loading = ref(true)
    const error = ref(null)
    const reviews = ref([])
    const currentPage = ref(1)
    const totalPages = ref(1)
    const canReview = ref(false)
    const newReview = ref({
      rating: 0,
      content: '',
      images: []
    })
    const isAuthenticated = computed(() => !!localStorage.getItem('token'))
    const quantity = ref(1)
    const selectedProvince = ref('')
    const selectedDistrict = ref('')
    const selectedWard = ref('')
    const provinces = ref([])
    const districts = ref([])
    const wards = ref([])
    const showReviewForm = ref(false)
    const toastRef = ref(null)
    const toast = useToast()

    // Computed properties
    const hasDiscount = computed(() => {
      return product.value?.original_price && product.value?.price < product.value?.original_price
    })

    const calculateDiscount = computed(() => {
      if (!hasDiscount.value) return 0
      const discount = ((product.value.original_price - product.value.price) / product.value.original_price) * 100
      return Math.round(discount)
    })

    const hasReviewed = computed(() => {
      return reviews.value.some(review => review.user_id === localStorage.getItem('userId'))
    })

    const getReviewTooltipMessage = computed(() => {
      if (hasReviewed.value) {
        return 'Bạn đã đánh giá sản phẩm này rồi'
      }
      return 'Bạn cần mua và nhận sản phẩm này để có thể đánh giá'
    })

    // Methods
    const fetchProductDetail = async () => {
      try {
        loading.value = true
        error.value = null
        console.log('Fetching product ID:', route.params.id)
        
        const response = await axios.get(`http://localhost:3000/api/products/${route.params.id}`)
        console.log('API Response:', response.data)
        
        product.value = response.data
        
        if (product.value?.variants?.length > 0) {
          selectedVariant.value = product.value.variants[0]
          colors.value = [...new Set(product.value.variants
            .map(v => v.color)
            .filter(Boolean))]
        }
        await fetchReviews()
      } catch (err) {
        console.error('Error fetching product:', err)
        error.value = 'Không thể tải thông tin sản phẩm'
        loading.value = false
      } finally {
        loading.value = false
      }
    }

    const fetchReviews = async (page = 1) => {
      try {
        const response = await axios.get(
          `http://localhost:3000/api/products/${route.params.id}/reviews?page=${page}&limit=5`
        );
        reviews.value = response.data.reviews;
        totalPages.value = response.data.pagination.totalPages;
        currentPage.value = page;
      } catch (error) {
        console.error('Error fetching reviews:', error);
        toast.error('Không thể tải đánh giá sản phẩm');
      }
    };

    const calculateRatingPercentage = (stars) => {
      if (!reviews.value.length) return 0
      const count = getRatingCount(stars)
      return (count / reviews.value.length) * 100
    }

    const getRatingCount = (stars) => {
      return reviews.value.filter(review => review.rating === stars).length
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

    const selectVariant = (variant) => {
      selectedVariant.value = variant
      if (variant.color) {
        selectedColor.value = variant.color
      }
    }

    const selectColor = (color) => {
      selectedColor.value = color
      const variantWithColor = product.value.variants.find(v => v.color === color)
      if (variantWithColor) {
        selectedVariant.value = variantWithColor
      }
    }

    const toggleFavorite = async () => {
      isFavorited.value = !isFavorited.value
    }

    const checkLogin = () => {
      const token = localStorage.getItem('token')
      if (!token) {
        toastRef.value.showToast('Vui lòng đăng nhập để tiếp tục mua hàng', 'error')
        // Lưu URL hiện tại để sau khi đăng nhập xong quay lại
        localStorage.setItem('redirectUrl', router.currentRoute.value.fullPath)
        router.push('/login')
        return false
      }
      return true
    }

    const buyNow = async () => {
      if (!checkLogin()) return
      
      try {
        await addToCart()
        router.push('/cart')
      } catch (error) {
        console.error('Buy now error:', error)
        toastRef.value.showToast(
          error.response?.data?.message || 'Có lỗi xảy ra',
          'error'
        )
      }
    }

    const addToCart = async () => {
      if (!checkLogin()) return
      
      if (!selectedVariant.value) {
        toast.warning('Vui lòng chọn phiên bản sản phẩm trước khi thêm vào giỏ hàng', {
          position: "top-right",
          timeout: 3000,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
        return
      }

      try {
        const response = await axios.post(
          'http://localhost:3000/api/cart/add',
          {
            productId: product.value.id,
            variantId: selectedVariant.value.id,
            quantity: 1
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        )

        if (response.status === 200) {
          toast.success('Đã thêm sản phẩm vào giỏ hàng', {
            position: "top-right",
            timeout: 2000,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          })
        }
      } catch (error) {
        console.error('Lỗi khi thêm vào giỏ hàng:', error)
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi thêm vào giỏ hàng', {
          position: "top-right",
          timeout: 3000,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
        })
      }
    }

    const changePage = (page) => {
      fetchReviews(page)
    }

    const checkCanReview = async () => {
      try {
        if (!isAuthenticated.value) {
          canReview.value = false;
          return;
        }

        const response = await axios.get(
          `http://localhost:3000/api/products/${route.params.id}/can-review`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        
        console.log('Can review response:', response.data);
        canReview.value = response.data.canReview;
        
        // Hiển thị thông báo nếu cần
        if (!canReview.value) {
          toastRef.value.showToast('Bạn cần mua và nhận sản phẩm này để có thể đánh giá', 'info');
        }
      } catch (error) {
        console.error('Error checking review permission:', error);
        canReview.value = false;
      }
    };

    const handleImageUpload = (event) => {
      const files = Array.from(event.target.files)
      if (files.length + newReview.value.images.length > 5) {
        alert('Bạn chỉ có thể tải lên tối đa 5 ảnh')
        return
      }

      files.forEach(file => {
        const reader = new FileReader()
        reader.onload = (e) => {
          newReview.value.images.push(e.target.result)
        }
        reader.readAsDataURL(file)
      })
    }

    const removeImage = (index) => {
      newReview.value.images.splice(index, 1)
    }

    const submitReview = async () => {
      try {
        if (!newReview.value.rating || !newReview.value.content) {
          toastRef.value.showToast('Vui lòng nhp đầy đủ đánh giá và nội dung', 'warning');
          return;
        }

        const reviewData = {
          rating: newReview.value.rating,
          content: newReview.value.content.trim()
        };

        // Gọi trực tiếp API đánh giá
        const response = await axios.post(
          `http://localhost:3000/api/products/${route.params.id}/reviews`,
          reviewData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.status === 201) {
          newReview.value = { rating: 0, content: '', images: [] };
          await fetchReviews();
          await checkCanReview();
          toastRef.value.showToast('Cảm ơn bạn đã đánh giá sản phẩm!', 'success');
        }
      } catch (error) {
        console.error('Review error:', error);
        toastRef.value.showToast(
          error.response?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá',
          'error'
        );
      }
    };

    const submitReply = async (review) => {
      try {
        const response = await axios.post(`/api/reviews/${review.id}/replies`, {
          content: review.newReplyContent
        });
        
        if (!review.replies) review.replies = [];
        review.replies.push(response.data.reply);
        review.newReplyContent = '';
        
        toast.success('Đã gửi phản hồi thành công');
      } catch (error) {
        console.error('Error submitting reply:', error);
        toast.error('Lỗi khi gửi phản hồi: ' + (error.response?.data?.message || error.message));
      }
    };

    // Lifecycle hooks
    onMounted(() => {
      fetchProductDetail()
      fetchReviews()
      checkCanReview()
      loadProvinces()
      // Kiểm tra query parameters
      if (route.query.tab === 'reviews') {
        if (route.query.showReviewForm === 'true') {
          showReviewForm.value = true
          // Scroll đến form đánh giá
          setTimeout(() => {
            const reviewForm = document.querySelector('.review-form')
            if (reviewForm) {
              reviewForm.scrollIntoView({ behavior: 'smooth' })
            }
          }, 100)
        }
      }
    })

    const loadProvinces = async () => {
      try {
        const response = await axios.get('https://provinces.open-api.vn/api/p/')
        provinces.value = response.data
      } catch (error) {
        console.error('Error loading provinces:', error)
      }
    }

    const handleProvinceChange = async () => {
      try {
        selectedDistrict.value = ''
        selectedWard.value = ''
        districts.value = []
        const response = await axios.get(`https://provinces.open-api.vn/api/d/p/${selectedProvince.value}`)
        districts.value = response.data
      } catch (error) {
        console.error('Error loading districts:', error)
      }
    }

    const handleDistrictChange = async () => {
      try {
        const response = await axios.get(`https://provinces.open-api.vn/api/w/d/${selectedDistrict.value}`)
        wards.value = response.data
      } catch (error) {
        console.error('Error loading wards:', error)
      }
    }

    return {
      product,
      selectedVariant,
      selectedColor,
      colors,
      isFavorited,
      relatedProducts,
      loading,
      error,
      reviews,
      currentPage,
      totalPages,
      hasDiscount,
      calculateDiscount,
      calculateRatingPercentage,
      getRatingCount,
      formatPrice,
      formatDate,
      selectVariant,
      selectColor,
      toggleFavorite,
      buyNow,
      changePage,
      canReview,
      newReview,
      isAuthenticated,
      handleImageUpload,
      removeImage,
      submitReview,
      addToCart,
      quantity,
      checkLogin,
      selectedProvince,
      selectedDistrict,
      selectedWard,
      provinces,
      districts,
      wards,
      handleProvinceChange,
      handleDistrictChange,
      showReviewForm,
      toastRef,
      getReviewTooltipMessage,
      submitReply
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

.purchase-buttons {
  display: flex;
  gap: 10px;
}

.purchase-buttons .btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 20px;
  font-size: 14px;
  min-width: 140px;
}

.purchase-buttons .btn i {
  font-size: 16px;
  margin-bottom: 2px;
}

.purchase-buttons .btn span {
  font-weight: 500;
}

.purchase-buttons small {
  font-size: 11px;
  opacity: 0.8;
  margin-top: 2px;
}

.review-item {
  background-color: #fff;
  transition: all 0.3s ease;
}

.review-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.review-image {
  transition: transform 0.2s ease;
}

.review-image:hover {
  transform: scale(1.05);
}

.stars i {
  font-size: 0.9rem;
}

.review-content {
  color: #333;
  line-height: 1.5;
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

.review-summary {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.rating-bar .progress {
  background-color: #e9ecef;
  border-radius: 5px;
}

.review-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
}

.product-details {
  margin-top: 3rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #333;
  position: relative;
  padding-bottom: 0.5rem;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 50px;
  height: 3px;
  background-color: #dc3545;
}

.description-content, 
.review-form-container,
.reviews-list {
  border: 1px solid #eee;
  transition: box-shadow 0.3s ease;
}

.description-content:hover, 
.review-form-container:hover,
.reviews-list:hover {
  box-shadow: 0 5px 15px rgba(0,0,0,0.08) !important;
}

.review-item {
  transition: background-color 0.3s ease;
}

.review-item:hover {
  background-color: #f8f9fa;
}

.review-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.review-image:hover {
  transform: scale(1.05);
}

.avatar {
  width: 50px;
  height: 50px;
  object-fit: cover;
}

.stars i {
  font-size: 0.9rem;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .section-title {
    font-size: 1.25rem;
  }
  
  .review-image {
    width: 80px;
    height: 80px;
  }
  
  .avatar {
    width: 40px;
    height: 40px;
  }
}

.disabled-review-form {
  position: relative;
  opacity: 0.7;
  cursor: not-allowed;
}

.disabled-review-form::before {
  content: attr(data-tooltip-content);
  position: absolute;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 12px;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 4px;
  font-size: 14px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
}

.disabled-review-form:hover::before {
  opacity: 1;
  visibility: visible;
}

.disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

.stars-input.disabled i {
  color: #ccc !important;
}

.form-control.disabled {
  background-color: #f8f9fa;
  resize: none;
}

.btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Custom toast styles */
.Vue-Toastification__toast {
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
}

.Vue-Toastification__toast--success {
  background-color: #4caf50;
}

.Vue-Toastification__toast--error {
  background-color: #f44336;
}

.Vue-Toastification__toast--warning {
  background-color: #ff9800;
}

.Vue-Toastification__progress-bar {
  background-color: rgba(255, 255, 255, 0.3);
}

.verification-status .badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.badge.verified {
  background-color: #10b981;
  color: white;
}

.badge.unverified {
  background-color: #f3f4f6;
  color: #6b7280;
}

.verification-status i {
  font-size: 0.9rem;
}

/* Hiệu ứng hover */
.badge.verified:hover {
  background-color: #059669;
}

.badge.unverified:hover {
  background-color: #e5e7eb;
}

/* Responsive */
@media (max-width: 768px) {
  .verification-status .badge {
    font-size: 0.75rem;
    padding: 0.4rem 0.8rem;
  }
  
  .review-header {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .verification-status {
    align-self: flex-start;
  }
}

.admin-reply {
  margin-top: 1rem;
  padding-left: 1rem;
  border-left: 2px solid #e5e7eb;
}

.admin-reply .reply-content {
  background-color: #f8f9fa;
  border-radius: 0.5rem;
  border-left: 3px solid #0d6efd;
}

.admin-avatar {
  width: 32px;
  height: 32px;
  object-fit: cover;
  border-radius: 50%;
}

.admin-name {
  color: #0d6efd;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.admin-name i {
  color: #0d6efd;
}

/* Responsive styles */
@media (max-width: 768px) {
  .admin-reply {
    margin-left: 0.5rem;
  }
  
  .reply-content {
    padding: 0.75rem !important;
  }
  
  .admin-name {
    font-size: 0.85rem;
  }
}

.review-item {
  border-bottom: 1px solid #eee;
  padding-bottom: 1.5rem;
}

.reply {
  position: relative;
}

.reply::before {
  content: '';
  position: absolute;
  left: -20px;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: #e5e7eb;
}

.reply-content {
  background-color: #f8f9fa;
  border-radius: 0.5rem;
}

.reply-form .input-group {
  gap: 0.5rem;
}

.reply-form textarea {
  border-radius: 0.5rem;
  resize: none;
}

.reply-user-name .fa-shield-alt {
  color: #0d6efd;
}

@media (max-width: 768px) {
  .reply-form .input-group {
    flex-direction: column;
  }
  
  .reply-form button {
    width: 100%;
    margin-top: 0.5rem;
  }
}
</style>


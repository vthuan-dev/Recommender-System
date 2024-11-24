<template>
  <div class="container py-4">
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

      <!-- Phần mô tả sản phẩm -->
      <div class="product-section">
        <h3 class="section-title">Mô tả sản phẩm</h3>
        <div class="product-description">
          <div v-html="product?.description"></div>
        </div>
      </div>

      <!-- Phần đánh giá -->
      <div class="product-section">
        <h3 class="section-title">Đánh giá sản phẩm</h3>
        
        <!-- Form đánh giá -->
        <div v-if="isAuthenticated">
          <div v-if="canReview" class="review-form">
            <h5 class="review-title">Viết đánh giá của bạn</h5>
            <p class="review-subtitle">Bạn cảm thấy sản phẩm này như thế nào?</p>
            
            <div class="stars-rating">
              <div class="stars-input">
                <template v-for="rating in 5" :key="rating">
                  <div class="rating-star-wrapper" 
                       @mouseover="hoverRating = rating"
                       @mouseleave="hoverRating = 0"
                       @click="newReview.rating = rating">
                    <i class="fas fa-star"
                       :class="[
                         rating <= (hoverRating || newReview.rating) 
                           ? 'text-yellow-400' 
                           : 'text-gray-300'
                       ]">
                    </i>
                  </div>
                </template>
                <span v-if="newReview.rating" class="rating-label">
                  {{ getRatingLabel(newReview.rating) }}
                </span>
              </div>
            </div>

            <textarea 
              v-model="newReview.content"
              class="review-input"
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
              rows="4"
            ></textarea>

            <button 
              class="submit-review-btn"
              :disabled="!newReview.rating || !newReview.content.trim()"
              @click="submitReview"
            >
              <i class="fas fa-paper-plane"></i>
              Gửi đánh giá
            </button>
          </div>
          <div v-else class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>
            Bạn cần mua và nhận sản phẩm này để có thể đánh giá
          </div>
        </div>
        <div v-else class="alert alert-info">
          <i class="fas fa-info-circle me-2"></i>
          Vui lòng <router-link to="/login">đăng nhập</router-link> để đánh giá sản phẩm
        </div>

        <!-- Danh sách đánh giá -->
        <div class="reviews-list">
          <!-- Existing reviews here -->
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
import Swal from 'sweetalert2'

export default {
  name: 'ProductDetail',
  components: {
    ProductCard
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
    const hoverRating = ref(0)

    // Computed properties
    const hasDiscount = computed(() => {
      return product.value?.original_price && product.value?.price < product.value?.original_price
    })

    const calculateDiscount = computed(() => {
      if (!hasDiscount.value) return 0
      const discount = ((product.value.original_price - product.value.price) / product.value.original_price) * 100
      return Math.round(discount)
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
        )
        reviews.value = response.data.reviews
        totalPages.value = response.data.pagination.totalPages
        currentPage.value = page
      } catch (error) {
        console.error('Error fetching reviews:', error)
      }
    }

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
        Swal.fire({
          title: 'Bạn chưa đăng nhập',
          text: 'Vui lòng đăng nhập để tiếp tục mua hàng',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Đăng nhập ngay',
          cancelButtonText: 'Để sau',
          reverseButtons: true
        }).then((result) => {
          if (result.isConfirmed) {
            // Lưu URL hiện tại để sau khi đăng nhập xong quay lại
            localStorage.setItem('redirectUrl', router.currentRoute.value.fullPath)
            router.push('/login')
          }
        })
        return false
      }
      return true
    }

    const buyNow = async () => {
      try {
        // Thêm vào giỏ hàng trước
        await addToCart();
        
        // Đợi một chút để đảm bảo sản phẩm đã được thêm vào giỏ hàng
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Lấy thông tin giỏ hàng mới nhất
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3000/api/cart', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        // Tìm cart item mới thêm vào
        const cartItem = response.data.items.find(item => 
          item.product_id === product.value.id && 
          (!selectedVariant.value || item.variant_id === selectedVariant.value?.id)
        );

        if (cartItem) {
          // Lưu ID cart item đã chọn
          localStorage.setItem('preSelectedCartItem', cartItem.id.toString());
          
          // Chuyển đến trang giỏ hàng
          router.push('/cart');
        } else {
          throw new Error('Không tìm thấy sản phẩm trong giỏ hàng');
        }

      } catch (error) {
        console.error('Buy now error:', error);
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: error.response?.data?.message || error.message || 'Có lỗi xảy ra'
        });
      }
    };

    const addToCart = async () => {
      if (!checkLogin()) return
      
      if (!selectedVariant.value) {
        Swal.fire({
          icon: 'warning',
          title: 'Vui lòng chọn phiên bản',
          text: 'Hãy chọn phiên bản sản phẩm trước khi thêm vào giỏ hàng'
        })
        return
      }

      try {
        // Hiển thị loading
        Swal.fire({
          title: 'Đang xử lý...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading()
          }
        })

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
          Swal.fire({
            title: 'Thành công!',
            text: 'Đã thêm sản phẩm vào giỏ hàng',
            icon: 'success',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Đến giỏ hàng',
            cancelButtonText: 'Tiếp tục mua sắm'
          }).then((result) => {
            if (result.isConfirmed) {
              router.push('/cart')
            }
          })
        }
      } catch (error) {
        console.error('Lỗi khi thêm vào giỏ hàng:', error)
        Swal.fire({
          title: 'Lỗi!',
          text: error.response?.data?.message || 'Có lỗi xảy ra khi thêm vào giỏ hàng',
          icon: 'error',
          confirmButtonText: 'Đóng'
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
          Swal.fire({
            icon: 'info',
            title: 'Thông báo',
            text: response.data.message
          });
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
          Swal.fire({
            icon: 'warning',
            title: 'Thiếu thông tin',
            text: 'Vui lòng nhập đầy đủ đánh giá và nội dung'
          });
          return;
        }

        // Hiển thị loading
        Swal.fire({
          title: 'Đang xử lý...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

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
          
          Swal.fire({
            icon: 'success',
            title: 'Thành công',
            text: 'Cảm ơn bạn đã đánh giá sản phẩm!'
          });
        }
      } catch (error) {
        console.error('Review error:', error);
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: error.response?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá'
        });
      }
    };

    const getRatingLabel = (rating) => {
      const labels = {
        1: 'Rất không hài lòng',
        2: 'Không hài lòng',
        3: 'Bình thường',
        4: 'Hài lòng',
        5: 'Rất hài lòng'
      }
      return labels[rating]
    }

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
      hoverRating,
      getRatingLabel
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

.nav-tabs {
  border-bottom: none;
}

.nav-tabs .nav-link {
  border: none;
  border-bottom: 1px solid #ddd;
  border-radius: 0;
  padding: 10px 20px;
}

.nav-tabs .nav-link.active {
  border-bottom: 2px solid #dc3545;
}

/* Thêm responsive cho mobile */
@media (max-width: 576px) {
  .purchase-buttons {
    flex-direction: column;
  }
  
  .purchase-buttons .btn {
    width: 100%;
    padding: 10px;
  }
}

/* Thêm style cho Sweetalert */
.swal2-popup {
  font-size: 0.9rem;
}

.swal2-html-container ul {
  text-align: left;
  margin: 1em auto;
}

.swal2-html-container ul li {
  margin: 0.5em 0;
}

.swal2-html-container ul li i {
  margin-right: 8px;
}

.tab-pane {
  transition: opacity 0.3s ease-in-out;
}

.tab-pane.fade {
  opacity: 0;
}

.tab-pane.fade.show {
  opacity: 1;
}

.review-form {
  background: #ffffff;
  max-width: 500px;
  margin: 0 auto;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
}

.review-form h5 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 1rem;
}

.rating-input p {
  font-size: 0.95rem;
  color: #4b5563;
  margin-bottom: 0.75rem;
}

.stars-input {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.rating-star-wrapper i {
  font-size: 1.5rem;
}

textarea {
  width: 100%;
  min-height: 80px;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.95rem;
  margin-bottom: 1rem;
}

button {
  width: 100%;
  padding: 0.75rem;
  font-size: 0.95rem;
  border-radius: 8px;
}

.rating-label {
  font-size: 0.8rem;
}

/* Mobile Responsive */
@media (max-width: 640px) {
  .review-form {
    padding: 1rem;
  }
  
  .stars-input {
    padding: 0.5rem;
  }
  
  .rating-star-wrapper i {
    font-size: 1.25rem;
  }
}

.review-form {
  background: #ffffff;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.review-form h5 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 1.5rem;
  position: relative;
}

.review-form h5::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 50px;
  height: 3px;
  background: #3b82f6;
  border-radius: 2px;
}

.rating-input p {
  color: #4b5563;
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.stars-input {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 12px;
}

.rating-star-wrapper {
  cursor: pointer;
  transition: transform 0.2s ease;
}

.rating-star-wrapper:hover {
  transform: scale(1.1);
}

.rating-star-wrapper i {
  font-size: 2rem;
  transition: all 0.3s ease;
}

.rating-star-wrapper i.text-yellow-400 {
  color: #fbbf24;
  filter: drop-shadow(0 0 2px rgba(251, 191, 36, 0.3));
}

.rating-star-wrapper i.text-gray-300 {
  color: #d1d5db;
}

textarea {
  width: 100%;
  min-height: 120px;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 1rem;
  resize: none;
  transition: all 0.3s ease;
}

textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

button {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

button:not(:disabled):hover {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
}

button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

button i {
  font-size: 1.1rem;
}

.rating-label {
  font-size: 0.875rem;
  color: #6b7280;
}

@media (max-width: 640px) {
  .review-form {
    padding: 1.5rem;
  }
  
  .stars-input {
    padding: 0.75rem;
  }
  
  .rating-star-wrapper i {
    font-size: 1.75rem;
  }
}

/* Animation cho sao */
@keyframes starPop {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.rating-star-wrapper.active i {
  animation: starPop 0.3s ease;
}

.product-info {
  padding: 1.5rem;
}

.product-title {
  font-size: 2rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 1rem;
}

.rating-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stars {
  display: flex;
  gap: 0.25rem;
}

.stars i {
  font-size: 1.25rem;
  color: #d1d5db;
}

.stars i.text-warning {
  color: #fbbf24;
}

.variants-section {
  margin-bottom: 2rem;
}

.variants-section h6 {
  font-size: 1.1rem;
  color: #4b5563;
  margin-bottom: 1rem;
}

.variant-options {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.variant-btn {
  flex: 1;
  min-width: 150px;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.variant-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #3b82f6, #60a5fa);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 1;
}

.variant-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.variant-btn.active {
  border-color: #3b82f6;
  background: linear-gradient(45deg, #eff6ff, #f8fafc);
}

.variant-btn.active::before {
  opacity: 0.05;
}

.variant-name {
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 0.5rem;
  position: relative;
  z-index: 2;
}

.variant-price {
  font-size: 1.1rem;
  font-weight: 600;
  color: #3b82f6;
  position: relative;
  z-index: 2;
}

/* Responsive */
@media (max-width: 768px) {
  .variant-options {
    flex-direction: column;
  }
  
  .variant-btn {
    width: 100%;
  }
}

/* Animation cho active state */
@keyframes selectPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

.variant-btn.active {
  animation: selectPulse 0.3s ease;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e5e7eb;
}

.product-reviews {
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

.review-form {
  max-width: 600px;
  margin: 0 auto;
  background: #ffffff;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 15px rgba(0, 0, 0, 0.05);
}

.review-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.review-subtitle {
  color: #6b7280;
  font-size: 0.95rem;
  margin-bottom: 1rem;
}

.stars-rating {
  background: #f8fafc;
  padding: 0.75rem;
  border-radius: 8px;
}

.review-input {
  width: 100%;
  min-height: 80px;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 1rem;
  resize: none;
  transition: all 0.2s ease;
}

.review-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  outline: none;
}

.submit-review-btn {
  width: 100%;
  padding: 0.75rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.submit-review-btn:hover:not(:disabled) {
  background: #2563eb;
  transform: translateY(-1px);
}

.submit-review-btn:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .review-form {
    padding: 1rem;
  }
  
  .section-title {
    font-size: 1.25rem;
  }
}

.product-section {
  margin-bottom: 3rem;
  padding: 2rem;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e5e7eb;
  position: relative;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 60px;
  height: 2px;
  background: #3b82f6;
  border-radius: 2px;
}

/* Giữ nguyên các CSS khác cho review form */
</style>

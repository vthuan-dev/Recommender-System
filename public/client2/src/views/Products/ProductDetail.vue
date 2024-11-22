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

      <!-- Tabs thông tin chi tiết -->
      <div class="product-details mt-5">
        <ul class="nav nav-tabs" id="productTabs" role="tablist">
          <li class="nav-item" role="presentation">
            <a class="nav-link" 
               data-bs-toggle="tab" 
               href="#description" 
               role="tab" 
               aria-selected="false">
              Mô tả
            </a>
          </li>
          <li class="nav-item" role="presentation">
            <a class="nav-link" 
               data-bs-toggle="tab" 
               href="#specs" 
               role="tab" 
               aria-selected="false">
              Thông số kỹ thuật
            </a>
          </li>
          <li class="nav-item" role="presentation">
            <a class="nav-link active" 
               data-bs-toggle="tab" 
               href="#reviews" 
               role="tab" 
               aria-selected="true">
              Đánh giá ({{ product?.review_count || 0 }})
            </a>
          </li>
        </ul>
        
        <div class="tab-content" id="productTabsContent">
          <!-- Tab mô tả -->
          <div class="tab-pane fade" 
               id="description" 
               role="tabpanel">
            <div v-html="product?.description"></div>
          </div>

          <!-- Tab thông số kỹ thuật -->
          <div class="tab-pane fade" 
               id="specs" 
               role="tabpanel">
            <table class="table table-striped">
              <tbody>
                <tr v-for="(spec, index) in product?.specifications" 
                    :key="index">
                  <td class="fw-bold" style="width: 200px">{{ spec.name }}</td>
                  <td>{{ spec.value }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Tab đánh giá -->
          <div class="tab-pane fade show active" 
               id="reviews" 
               role="tabpanel">
            <!-- Form đánh giá -->
            <div v-if="canReview" class="review-form mb-4">
              <h5>Viết đánh giá của bạn</h5>
              <div class="rating-input mb-3">
                <span>Đánh giá của bạn:</span>
                <div class="stars-input">
                  <i v-for="n in 5" 
                     :key="n" 
                     class="fas fa-star" 
                     :class="{ 'text-warning': n <= newReview.rating }"
                     @click="newReview.rating = n"
                     style="cursor: pointer">
                  </i>
                </div>
              </div>
              <div class="mb-3">
                <textarea 
                  v-model="newReview.content"
                  class="form-control" 
                  rows="3" 
                  placeholder="Nhập nhận xét của bạn về sản phẩm">
                </textarea>
              </div>
              <div class="mb-3">
                <label class="form-label">Thêm hình ảnh (tối đa 5 ảnh)</label>
                <input 
                  type="file" 
                  class="form-control" 
                  accept="image/*" 
                  multiple 
                  @change="handleImageUpload"
                >
                <div class="preview-images mt-2" v-if="newReview.images.length">
                  <img 
                    v-for="(img, index) in newReview.images" 
                    :key="index" 
                    :src="img" 
                    class="review-image me-2"
                    @click="removeImage(index)"
                  >
                </div>
              </div>
              <button 
                class="btn btn-primary" 
                @click="submitReview"
                :disabled="!newReview.rating || !newReview.content">
                Gửi đánh giá
              </button>
            </div>

            <div v-else-if="isAuthenticated" class="alert alert-warning">
              Bạn cần mua sản phẩm này để có thể đánh giá
            </div>

            <div v-else class="alert alert-info">
              Vui lòng <router-link to="/login">đăng nhập</router-link> để đánh giá sản phẩm
            </div>

            <!-- Tổng quan đánh giá -->
            <div class="review-overview row mb-4">
              <div class="col-md-4 text-center border-end">
                <h2 class="display-4 mb-0">{{ (product?.avg_rating || 0).toFixed(1) }}</h2>
                <div class="stars mb-2">
                  <i v-for="n in 5" :key="n" 
                     class="fas fa-star"
                     :class="n <= (product?.avg_rating || 0) ? 'text-warning' : 'text-muted'">
                  </i>
                </div>
                <p class="text-muted">{{ product?.review_count || 0 }} đánh giá</p>
              </div>
              <div class="col-md-8">
                <div v-for="n in 5" :key="n" class="rating-bar mb-2">
                  <div class="d-flex align-items-center">
                    <div style="width: 60px">{{ 6-n }} sao</div>
                    <div class="progress flex-grow-1" style="height: 8px">
                      <div class="progress-bar bg-warning" 
                           :style="{ width: calculateRatingPercentage(6-n) + '%' }">
                      </div>
                    </div>
                    <div style="width: 60px" class="text-end">
                      {{ getRatingCount(6-n) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Danh sách đánh giá -->
            <div class="reviews-list">
              <div v-if="reviews && reviews.length > 0">
                <div v-for="review in reviews" 
                     :key="review.id" 
                     class="review-item">
                  <div class="reviewer-info">
                    <img :src="review.avatar_url || '/default-avatar.png'" 
                         :alt="review.fullname" 
                         class="avatar">
                    <div>
                      <h6 class="mb-0">{{ review.fullname }}</h6>
                      <div class="stars">
                        <i v-for="n in 5" :key="n" 
                           class="fas fa-star"
                           :class="n <= review.rating ? 'text-warning' : 'text-muted'">
                        </i>
                      </div>
                      <small class="text-muted">{{ formatDate(review.created_at) }}</small>
                    </div>
                  </div>
                  <div class="review-content mt-2">
                    {{ review.content }}
                  </div>
                  <div class="review-images mt-2" v-if="review.images?.length">
                    <img v-for="(image, index) in review.images" 
                         :key="index" 
                         :src="image" 
                         class="review-image me-2"
                         @click="showImageModal(image)">
                  </div>
                </div>
              </div>
              <div v-else class="text-center py-5">
                <p class="text-muted mb-0">Chưa có đánh giá nào cho sản phẩm này</p>
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
      if (!checkLogin()) return
      
      if (!selectedVariant.value) {
        Swal.fire({
          icon: 'warning',
          title: 'Vui lòng chọn phiên bản',
          text: 'Hãy chọn phiên bản sản phẩm trước khi mua hàng'
        })
        return
      }

      try {
        await addToCart()
        router.push('/checkout')
      } catch (error) {
        console.error('Error buying now:', error)
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Có lỗi xảy ra. Vui lòng thử lại sau.'
        })
      }
    }

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
      if (!isAuthenticated.value) return
      try {
        const response = await axios.get(
          `http://localhost:3000/api/products/${route.params.id}/can-review`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        )
        canReview.value = response.data.canReview
      } catch (error) {
        console.error('Error checking review permission:', error)
      }
    }

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
        await axios.post(
          `http://localhost:3000/api/products/${route.params.id}/reviews`,
          newReview.value,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        )
        
        // Reset form và refresh đánh giá
        newReview.value = { rating: 0, content: '', images: [] }
        await fetchReviews()
        await checkCanReview()
        
        alert('Cảm ơn bạn đã đánh giá sản phẩm!')
      } catch (error) {
        alert(error.response?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá')
      }
    }

    // Lifecycle hooks
    onMounted(() => {
      fetchProductDetail()
      fetchReviews()
      checkCanReview()
      loadProvinces()
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
      handleDistrictChange
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
</style>

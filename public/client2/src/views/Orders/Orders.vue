<template>
  <div class="checkout-page">
    <!-- Header Section -->
    <div class="checkout-header">
      <div class="container">
        <div class="progress-steps">
          <div class="step active">
            <div class="step-icon">
              <i class="fas fa-shopping-cart"></i>
            </div>
            <span>Giỏ hàng</span>
          </div>
          <div class="step-line"></div>
          <div class="step active">
            <div class="step-icon">
              <i class="fas fa-shipping-fast"></i>
            </div>
            <span>Thông tin giao hàng</span>
          </div>
          <div class="step-line"></div>
          <div class="step">
            <div class="step-icon">
              <i class="fas fa-credit-card"></i>
            </div>
            <span>Thanh toán</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="container py-5">
      <div class="row">
        <!-- Left Column - Shipping Information -->
        <div class="col-lg-8">
          <div class="checkout-section">
            <h3 class="section-title">
              <i class="fas fa-map-marker-alt me-2"></i>
              Thông tin giao hàng
            </h3>
            <div class="card shadow-sm">
              <div class="card-body">
                <form @submit.prevent="handleSubmit" class="shipping-form">
                  <div class="row g-3">
                    <div class="col-md-6">
                      <div class="form-floating">
                        <input 
                          type="text" 
                          class="form-control" 
                          id="fullName"
                          v-model="shippingInfo.fullName"
                          required
                        >
                        <label for="fullName">Họ và tên</label>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="form-floating">
                        <input 
                          type="tel" 
                          class="form-control" 
                          id="phone"
                          v-model="shippingInfo.phone"
                          required
                        >
                        <label for="phone">Số điện thoại</label>
                      </div>
                    </div>
                    <div class="col-12">
                      <div class="form-floating">
                        <input 
                          type="email" 
                          class="form-control" 
                          id="email"
                          v-model="shippingInfo.email"
                          required
                        >
                        <label for="email">Email</label>
                      </div>
                    </div>
                    <div class="col-md-4">
                      <select class="form-select" v-model="shippingInfo.province" required>
                        <option value="">Chọn tỉnh/thành</option>
                        <!-- Add provinces -->
                      </select>
                    </div>
                    <div class="col-md-4">
                      <select class="form-select" v-model="shippingInfo.district" required>
                        <option value="">Chọn quận/huyện</option>
                        <!-- Add districts -->
                      </select>
                    </div>
                    <div class="col-md-4">
                      <select class="form-select" v-model="shippingInfo.ward" required>
                        <option value="">Chọn phường/xã</option>
                        <!-- Add wards -->
                      </select>
                    </div>
                    <div class="col-12">
                      <div class="form-floating">
                        <textarea 
                          class="form-control" 
                          id="address"
                          v-model="shippingInfo.address"
                          style="height: 100px"
                          required
                        ></textarea>
                        <label for="address">Địa chỉ cụ thể</label>
                      </div>
                    </div>
                    <div class="col-12">
                      <div class="form-floating">
                        <textarea 
                          class="form-control" 
                          id="note"
                          v-model="shippingInfo.note"
                          style="height: 100px"
                        ></textarea>
                        <label for="note">Ghi chú đơn hàng (không bắt buộc)</label>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <!-- Shipping Method -->
            <div class="mt-4">
              <h3 class="section-title">
                <i class="fas fa-truck me-2"></i>
                Phương thức vận chuyển
              </h3>
              <div class="card shadow-sm">
                <div class="card-body">
                  <div class="shipping-methods">
                    <div 
                      v-for="method in shippingMethods" 
                      :key="method.id"
                      class="shipping-method-item"
                      :class="{ active: selectedShipping === method.id }"
                      @click="selectedShipping = method.id"
                    >
                      <div class="d-flex align-items-center">
                        <div class="custom-radio me-3">
                          <input 
                            type="radio" 
                            :id="'shipping-' + method.id"
                            :value="method.id"
                            v-model="selectedShipping"
                          >
                          <span class="radio-mark"></span>
                        </div>
                        <div class="shipping-method-info">
                          <h6 class="mb-1">{{ method.name }}</h6>
                          <p class="text-muted mb-0">{{ method.description }}</p>
                        </div>
                        <div class="shipping-method-price ms-auto">
                          {{ formatPrice(method.price) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column - Order Summary -->
        <div class="col-lg-4">
          <div class="order-summary sticky-top">
            <h3 class="section-title">
              <i class="fas fa-receipt me-2"></i>
              Tổng đơn hàng
            </h3>
            <div class="card shadow-sm">
              <div class="card-body">
                <div class="order-items">
                  <div v-for="item in cartItems" :key="item.id" class="order-item">
                    <div class="item-image">
                      <img :src="item.image_url" :alt="item.product_name">
                      <span class="item-quantity">{{ item.quantity }}</span>
                    </div>
                    <div class="item-info">
                      <h6>{{ item.product_name }}</h6>
                      <p class="text-muted">{{ item.variant_name }}</p>
                    </div>
                    <div class="item-price">
                      {{ formatPrice(item.total_price) }}
                    </div>
                  </div>
                </div>

                <hr>

                <div class="price-details">
                  <div class="price-row">
                    <span>Tạm tính</span>
                    <span>{{ formatPrice(subtotal) }}</span>
                  </div>
                  <div class="price-row">
                    <span>Phí vận chuyển</span>
                    <span>{{ formatPrice(shippingFee) }}</span>
                  </div>
                  <div class="price-row discount" v-if="discount">
                    <span>Giảm giá</span>
                    <span>-{{ formatPrice(discount) }}</span>
                  </div>
                  <div class="price-row total">
                    <strong>Tổng cộng</strong>
                    <strong>{{ formatPrice(total) }}</strong>
                  </div>
                </div>

                <div class="promo-code mt-3">
                  <div class="input-group">
                    <input 
                      type="text" 
                      class="form-control" 
                      placeholder="Mã giảm giá"
                      v-model="promoCode"
                    >
                    <button 
                      class="btn btn-outline-primary" 
                      type="button"
                      @click="applyPromoCode"
                    >
                      Áp dụng
                    </button>
                  </div>
                </div>

                <button 
                  class="btn btn-primary w-100 mt-4 checkout-btn"
                  @click="proceedToPayment"
                >
                  <i class="fas fa-lock me-2"></i>
                  Tiến hành thanh toán
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'

export default {
  name: 'CheckoutView',
  setup() {
    const store = useStore()
    const router = useRouter()
    
    const shippingInfo = ref({
      fullName: '',
      phone: '',
      email: '',
      province: '',
      district: '',
      ward: '',
      address: '',
      note: ''
    })

    const selectedShipping = ref(1)
    const promoCode = ref('')
    const loading = ref(false)

    const shippingMethods = [
      {
        id: 1,
        name: 'Giao hàng tiêu chuẩn',
        description: 'Nhận hàng trong 3-5 ngày',
        price: 30000
      },
      {
        id: 2,
        name: 'Giao hàng nhanh',
        description: 'Nhận hàng trong 1-2 ngày',
        price: 45000
      }
    ]

    const cartItems = computed(() => store.state.cart.items)
    const subtotal = computed(() => store.state.cart.total)
    const shippingFee = computed(() => {
      const method = shippingMethods.find(m => m.id === selectedShipping.value)
      return method ? method.price : 0
    })
    const discount = computed(() => store.state.cart.discount)
    const total = computed(() => subtotal.value + shippingFee.value - discount.value)

    const formatPrice = (price) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price)
    }

    const applyPromoCode = async () => {
      if (!promoCode.value) return
      
      try {
        loading.value = true
        await store.dispatch('applyPromoCode', promoCode.value)
        Swal.fire({
          icon: 'success',
          title: 'Thành công!',
          text: 'Đã áp dụng mã giảm giá'
        })
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: error.message || 'Không thể áp dụng mã giảm giá'
        })
      } finally {
        loading.value = false
      }
    }

    const proceedToPayment = async () => {
      // Validate form
      if (!validateForm()) return

      try {
        loading.value = true
        // Save shipping info
        await store.dispatch('saveShippingInfo', {
          ...shippingInfo.value,
          shippingMethod: selectedShipping.value
        })
        // Navigate to payment page
        router.push('/payment')
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: 'Không thể xử lý đơn hàng. Vui lòng thử lại'
        })
      } finally {
        loading.value = false
      }
    }

    const validateForm = () => {
      // Add your validation logic here
      return true
    }

    return {
      shippingInfo,
      selectedShipping,
      shippingMethods,
      promoCode,
      cartItems,
      subtotal,
      shippingFee,
      discount,
      total,
      formatPrice,
      applyPromoCode,
      proceedToPayment
    }
  }
}
</script>

<style scoped>
.checkout-page {
  background-color: #f8f9fa;
  min-height: 100vh;
}

.checkout-header {
  background: white;
  padding: 2rem 0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  margin-bottom: 2rem;
}

.progress-steps {
  display: flex;
  justify-content: center;
  align-items: center;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
}

.step-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
  color: #6c757d;
}

.step.active .step-icon {
  background: #0d6efd;
  color: white;
}

.step-line {
  flex: 1;
  height: 2px;
  background: #e9ecef;
  margin: 0 1rem;
  position: relative;
  top: -25px;
  z-index: 0;
}

.section-title {
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: #2c3e50;
}

.shipping-method-item {
  padding: 1rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.shipping-method-item:hover {
  border-color: #0d6efd;
}

.shipping-method-item.active {
  border-color: #0d6efd;
  background-color: #f8f9ff;
}

.custom-radio {
  position: relative;
  width: 20px;
  height: 20px;
}

.radio-mark {
  position: absolute;
  top: 0;
  left: 0;
  width: 20px;
  height: 20px;
  border: 2px solid #dee2e6;
  border-radius: 50%;
}

.shipping-method-item.active .radio-mark {
  border-color: #0d6efd;
}

.shipping-method-item.active .radio-mark:after {
  content: '';
  position: absolute;
  top: 4px;
  left: 4px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #0d6efd;
}

.order-summary {
  top: 2rem;
}

.order-items {
  max-height: 300px;
  overflow-y: auto;
}

.order-item {
  display: flex;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #dee2e6;
}

.item-image {
  position: relative;
  width: 60px;
  height: 60px;
  margin-right: 1rem;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.item-quantity {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #0d6efd;
  color: white;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}

.price-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
}

.price-row.total {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 2px solid #dee2e6;
}

.checkout-btn {
  padding: 1rem;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .order-summary {
    position: static !important;
    margin-top: 2rem;
  }
  
  .progress-steps {
    flex-direction: column;
    gap: 1rem;
  }
  
  .step-line {
    display: none;
  }
}
</style>

<!-- Cart.vue -->
<template>
  <div class="container py-4">
    <!-- Loading state -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner-grow text-primary" role="status">
        <span class="visually-hidden">Đang tải...</span>
      </div>
    </div>

    <!-- Empty cart -->
    <div v-else-if="!cartItems?.length" class="empty-cart text-center py-5">
      <div class="empty-cart-content">
        <i class="fas fa-shopping-bag fa-4x mb-4"></i>
        <h3>Giỏ hàng của bạn đang trống</h3>
        <p class="text-muted">Hãy thêm sản phẩm vào giỏ hàng để mua sắm</p>
        <router-link to="/products" class="btn btn-primary btn-lg mt-3">
          <i class="fas fa-arrow-left me-2"></i>Tiếp tục mua sắm
        </router-link>
      </div>
    </div>

    <!-- Cart content -->
    <div v-else class="row g-4">
      <!-- Cart items -->
      <div class="col-lg-8">
        <div class="card cart-card">
          <div class="card-header bg-white py-3">
            <div class="d-flex align-items-center justify-content-between">
              <h5 class="mb-0">
                <i class="fas fa-shopping-cart me-2"></i>
                Giỏ hàng của bạn ({{ totalItems }} sản phẩm)
              </h5>
              <button class="btn btn-outline-danger btn-sm" @click="clearCart">
                <i class="fas fa-trash-alt me-1"></i>Xóa tất cả
              </button>
            </div>
          </div>
          
          <div class="card-body p-0">
            <transition-group name="cart-item" tag="div" class="cart-items">
              <div v-for="item in cartItems" :key="item.id" 
                   class="cart-item p-4 border-bottom">
                <div class="row align-items-center">
                  <!-- Product image -->
                  <div class="col-lg-2 col-md-3 mb-3 mb-md-0">
                    <img :src="item.image_url" :alt="item.product_name" 
                         class="img-fluid rounded product-image">
                  </div>
                  
                  <!-- Product info -->
                  <div class="col-lg-4 col-md-4">
                    <h6 class="product-name">{{ item.product_name }}</h6>
                    <p class="variant-name mb-2">{{ item.variant_name }}</p>
                    <div class="product-price">{{ formatPrice(item.price) }}</div>
                  </div>
                  
                  <!-- Quantity -->
                  <div class="col-lg-3 col-md-3">
                    <div class="quantity-control">
                      <button class="btn btn-quantity" 
                              @click="updateQuantity(item.id, item.quantity - 1)"
                              :disabled="item.quantity <= 1">
                        <i class="fas fa-minus"></i>
                      </button>
                      <input type="number" class="form-control quantity-input" 
                             v-model.number="item.quantity"
                             @change="updateQuantity(item.id, item.quantity)">
                      <button class="btn btn-quantity" 
                              @click="updateQuantity(item.id, item.quantity + 1)">
                        <i class="fas fa-plus"></i>
                      </button>
                    </div>
                  </div>
                  
                  <!-- Subtotal -->
                  <div class="col-lg-2 col-md-2 text-end">
                    <div class="subtotal">{{ formatPrice(item.total_price) }}</div>
                  </div>
                  
                  <!-- Remove button -->
                  <div class="col-lg-1 col-md-12 text-end mt-3 mt-md-0">
                    <button class="btn btn-remove" @click="removeItem(item.id)">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                </div>
              </div>
            </transition-group>
          </div>
        </div>
      </div>

      <!-- Order summary -->
      <div class="col-lg-4">
        <div class="card summary-card sticky-top">
          <div class="card-header bg-white py-3">
            <h5 class="mb-0">
              <i class="fas fa-receipt me-2"></i>Tổng đơn hàng
            </h5>
          </div>
          <div class="card-body">
            <div class="summary-item d-flex justify-content-between mb-3">
              <span>Tạm tính</span>
              <span class="fw-bold">{{ formatPrice(subtotal) }}</span>
            </div>
            <div class="summary-item d-flex justify-content-between mb-3">
              <span>Phí vận chuyển</span>
              <span>{{ formatPrice(shippingFee) }}</span>
            </div>
            <div class="summary-item d-flex justify-content-between mb-3">
              <span>Giảm giá</span>
              <span class="text-success">-{{ formatPrice(discount) }}</span>
            </div>
            
            <hr class="my-4">
            
            <div class="summary-total d-flex justify-content-between mb-4">
              <span class="fw-bold">Tổng cộng</span>
              <span class="total-amount">{{ formatPrice(total) }}</span>
            </div>

            <button class="btn btn-primary btn-lg w-100 mb-3" @click="checkout">
              <i class="fas fa-lock me-2"></i>Thanh toán ngay
            </button>

            <div class="text-center">
              <router-link to="/products" class="btn btn-link">
                <i class="fas fa-arrow-left me-1"></i>Tiếp tục mua sắm
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'

export default {
  name: 'Cart',
  setup() {
    const loading = ref(true)
    const cartItems = ref([])
    const error = ref(null)

    // API base URL - sửa lại port cho đúng với server
    const API_URL = 'http://localhost:3000/api'

    // Constants
    const shippingFee = ref(30000)
    const discount = ref(0)

    // Computed properties
    const subtotal = computed(() => {
      return cartItems.value.reduce((sum, item) => sum + item.total_price, 0)
    })

    const total = computed(() => {
      return subtotal.value + shippingFee.value - discount.value
    })

    const totalItems = computed(() => {
      return cartItems.value.reduce((sum, item) => sum + item.quantity, 0)
    })

    // Methods
    const fetchCartItems = async () => {
      try {
        loading.value = true
        const token = localStorage.getItem('token')
        const response = await axios.get('http://localhost:3000/api/cart', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        cartItems.value = response.data.items || []
        console.log('Cart data:', response.data)
      } catch (err) {
        console.error('Lỗi khi lấy dữ liệu giỏ hàng:', err)
        error.value = err.response?.data?.message || 'Không thể tải giỏ hàng'
      } finally {
        loading.value = false
      }
    }

    const updateQuantity = async (itemId, newQuantity) => {
      try {
        if (newQuantity < 1) return
        
        const token = localStorage.getItem('token')
        await axios.put(`${API_URL}/cart/update`, {
          cartItemId: itemId,
          quantity: newQuantity
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        
        await fetchCartItems() // Refresh cart data
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: err.response?.data?.message || 'Không thể cập nhật số lượng'
        })
      }
    }

    const removeItem = async (itemId) => {
      try {
        const token = localStorage.getItem('token')
        await axios.delete(`${API_URL}/cart/remove/${itemId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        
        await fetchCartItems() // Refresh cart data
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: err.response?.data?.message || 'Không thể xóa sản phẩm'
        })
      }
    }

    const clearCart = async () => {
      try {
        const result = await Swal.fire({
          title: 'Xác nhận xóa',
          text: 'Bạn có chắc muốn xóa tất cả sản phẩm trong giỏ hàng?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Xóa tất cả',
          cancelButtonText: 'Hủy'
        })

        if (result.isConfirmed) {
          const token = localStorage.getItem('token')
          await axios.delete(`${API_URL}/cart/clear`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
          cartItems.value = []
          Swal.fire('Đã xóa!', 'Giỏ hàng đã được xóa.', 'success')
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: err.response?.data?.message || 'Không thể xóa giỏ hàng'
        })
      }
    }

    const formatPrice = (price) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price)
    }

    const checkout = () => {
      // Implement checkout logic
    }

    // Lifecycle hooks
    onMounted(() => {
      fetchCartItems()
    })

    return {
      loading,
      cartItems,
      error,
      subtotal,
      shippingFee,
      discount,
      total,
      totalItems,
      formatPrice,
      updateQuantity,
      removeItem,
      clearCart,
      checkout
    }
  }
}
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.cart-card, .summary-card {
  border: none;
  box-shadow: 0 0 15px rgba(0,0,0,0.05);
  border-radius: 12px;
}

.product-image {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
}

.product-name {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.variant-name {
  color: #6c757d;
  font-size: 0.9rem;
}

.quantity-control {
  display: flex;
  align-items: center;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  overflow: hidden;
}

.btn-quantity {
  border: none;
  background: #f8f9fa;
  padding: 8px 12px;
  color: #495057;
}

.btn-quantity:hover {
  background: #e9ecef;
}

.quantity-input {
  width: 60px;
  border: none;
  text-align: center;
  font-weight: 500;
}

.btn-remove {
  color: #dc3545;
  padding: 8px;
  border-radius: 50%;
}

.btn-remove:hover {
  background: #fee2e2;
}

.total-amount {
  font-size: 1.5rem;
  font-weight: 700;
  color: #dc3545;
}

.summary-card {
  position: sticky;
  top: 20px;
}

/* Animation cho cart items */
.cart-item-enter-active,
.cart-item-leave-active {
  transition: all 0.3s ease;
}

.cart-item-enter-from,
.cart-item-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Responsive styles */
@media (max-width: 768px) {
  .quantity-control {
    width: 100%;
    margin: 1rem 0;
  }
  
  .product-image {
    height: 80px;
  }
  
  .summary-card {
    position: static;
    margin-top: 1rem;
  }
}
</style>
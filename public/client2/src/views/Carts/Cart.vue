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
        <router-link to="/products" class="continue-shopping-link">
          <span class="icon-wrapper">
            <i class="fas fa-arrow-left"></i>
          </span>
          <span class="text">Tiếp tục mua sắm</span>
        </router-link>
      </div>
    </div>

    <!-- Cart content -->
    <div v-else class="row g-4">
      <!-- Cart items -->
      <div class="col-lg-8">
        <div class="cart-card">
          <!-- Cart Header -->
          <div class="cart-header">
            <div class="header-content">
              <h5 class="cart-title">
                <div class="title-icon">
                  <i class="fas fa-shopping-cart"></i>
                </div>
                <span class="title-text">
                  Giỏ hàng của bạn
                  <span class="item-count">({{ totalItems }} sản phẩm)</span>
                </span>
              </h5>

              <button class="clear-cart-btn" @click="clearCart">
                <div class="btn-content">
                  <i class="fas fa-trash-alt"></i>
                  <span>Xóa tất cả</span>
                </div>
              </button>
            </div>
          </div>

          <!-- Cart Items -->
          <div class="cart-body">
            <transition-group name="cart-items" tag="div" class="cart-items-container">
              <div v-for="item in cartItems" 
                   :key="item.id" 
                   class="cart-item"
                   :class="{ 'item-hover': hoveredItem === item.id }"
                   @mouseenter="hoveredItem = item.id"
                   @mouseleave="hoveredItem = null">
                
                <!-- Thêm checkbox chọn sản phẩm -->
                <div class="item-select">
                  <input 
                    type="checkbox" 
                    :checked="selectedItems.includes(item.id)"
                    @change="toggleSelectItem(item.id)"
                    class="form-check-input custom-checkbox"
                  >
                </div>

                <!-- Product Image -->
                <div class="item-image-container">
                  <img :src="item.image_url" :alt="item.product_name">
                  <div class="image-overlay"></div>
                </div>

                <!-- Product Info -->
                <div class="item-details">
                  <h6 class="item-name">{{ item.product_name }}</h6>
                  <p class="item-variant">{{ item.variant_name }}</p>
                  <div class="item-price">{{ formatPrice(item.price) }}</div>
                </div>

                <!-- Quantity Controls -->
                <div class="quantity-wrapper">
                  <div class="quantity-controls">
                    <button class="qty-btn" 
                            @click="updateQuantity(item.id, item.quantity - 1)"
                            :disabled="item.quantity <= 1">
                      <i class="fas fa-minus"></i>
                    </button>
                    <input type="number" 
                           v-model.number="item.quantity"
                           @change="updateQuantity(item.id, item.quantity)"
                           class="qty-input">
                    <button class="qty-btn" 
                            @click="updateQuantity(item.id, item.quantity + 1)">
                      <i class="fas fa-plus"></i>
                    </button>
                  </div>
                </div>

                <!-- Subtotal -->
                <div class="item-subtotal">
                  {{ formatPrice(item.total_price) }}
                </div>

                <!-- Remove Button -->
                <button class="remove-btn" @click="removeItem(item.id)">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </transition-group>
          </div>
        </div>
      </div>

      <!-- Order summary -->
      <div class="col-lg-4">
        <div class="card summary-card sticky-top">
          <!-- Order Summary Header -->
          <div class="summary-header">
            <h5 class="summary-title">
              <i class="fas fa-receipt"></i>
              <span>Tổng đơn hàng</span>
            </h5>
          </div>
          <div class="card-body">
            <!-- Discount Code Input -->
            <div class="discount-section mb-4">
              <div class="discount-header">
                <i class="fas fa-tag"></i>
                <span>Mã giảm giá</span>
              </div>
              <div class="discount-input-group">
                <input 
                  type="text" 
                  v-model="discountCode"
                  placeholder="Nhập mã giảm giá"
                  class="discount-input"
                  :class="{ 'is-invalid': discountError }"
                >
                <button 
                  @click="applyDiscount" 
                  class="apply-discount-btn"
                  :disabled="!discountCode || isApplying"
                >
                  <span v-if="!isApplying">Áp dụng</span>
                  <i v-else class="fas fa-spinner fa-spin"></i>
                </button>
              </div>
              <transition name="fade" mode="out-in">
                <div v-if="discountError" key="error" class="discount-error">
                  <i class="fas fa-exclamation-circle"></i>
                  {{ discountError }}
                </div>
                <div v-else-if="discountSuccess" key="success" class="discount-success">
                  <i class="fas fa-check-circle"></i>
                  {{ discountSuccess }}
                </div>
              </transition>
            </div>

            <!-- Summary Items -->
            <div class="summary-item d-flex justify-content-between mb-3">
              <span>Tạm tính ({{ selectedItems.length }} sản phẩm)</span>
              <span class="fw-bold">{{ formatPrice(selectedSubtotal) }}</span>
            </div>
            <div class="summary-item d-flex justify-content-between mb-3">
              <span>Phí vận chuyển</span>
              <span>{{ formatPrice(shippingFee) }}</span>
            </div>
            <div class="summary-item d-flex justify-content-between mb-3">
              <span>Giảm giá</span>
              <span :class="{'text-success': discount > 0}">
                -{{ formatPrice(discount) }}
              </span>
            </div>
            
            <hr class="my-4">
            
            <div class="summary-total d-flex justify-content-between mb-4">
              <span class="fw-bold">Tổng cộng</span>
              <span class="total-amount">{{ formatPrice(total) }}</span>
            </div>

            <button 
              class="checkout-button" 
              @click="handleCheckout"
              :disabled="selectedItems.length === 0"
            >
              <div class="button-content">
                <i class="fas fa-lock"></i>
                <span>Thanh toán {{ selectedItems.length }} sản phẩm</span>
              </div>
            </button>

            <div class="text-center">
              <router-link to="/products" class="continue-shopping-link">
                <span class="icon-wrapper">
                  <i class="fas fa-arrow-left"></i>
                </span>
                <span class="text">Tiếp tục mua sắm</span>
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
import { useRouter } from 'vue-router'
import axios from 'axios'
import Swal from 'sweetalert2'

export default {
  name: 'ShoppingCartView',
  setup() {
    const router = useRouter()
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

    const selectedItems = ref([])

    // Computed cho tổng tiền các sản phẩm được chọn
    const selectedSubtotal = computed(() => {
      return cartItems.value
        .filter(item => selectedItems.value.includes(item.id))
        .reduce((sum, item) => sum + item.total_price, 0)
    })

    // Toggle chọn/bỏ chọn sản phẩm
    const toggleSelectItem = (itemId) => {
      const index = selectedItems.value.indexOf(itemId)
      if (index === -1) {
        selectedItems.value.push(itemId)
      } else {
        selectedItems.value.splice(index, 1)
      }
    }

    // Chọn tất cả sản phẩm
    const selectAllItems = () => {
      if (selectedItems.value.length === cartItems.value.length) {
        selectedItems.value = []
      } else {
        selectedItems.value = cartItems.value.map(item => item.id)
      }
    }

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
        // Sắp xếp items theo thời gian tạo mới nhất
        cartItems.value = (response.data.items || []).sort((a, b) => {
          return new Date(b.created_at) - new Date(a.created_at)
        })
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

    // Sửa lại hàm handleCheckout
    const handleCheckout = () => {
      if (selectedItems.value.length === 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Chưa chọn sản phẩm',
          text: 'Vui lòng chọn ít nhất một sản phẩm để thanh toán'
        })
        return
      }

      // Lọc và format dữ liệu sản phẩm được chọn
      const checkoutItems = cartItems.value
        .filter(item => selectedItems.value.includes(item.id))
        .map(item => ({
          id: item.id,
          productId: item.product_id,
          variantId: item.variant_id,
          name: item.product_name,
          image: item.image_url,
          variantName: item.variant_name,
          price: item.price,
          quantity: item.quantity,
          total_price: item.total_price
        }))

      // Lưu vào localStorage
      localStorage.setItem('checkoutItems', JSON.stringify(checkoutItems))
      
      router.push('/checkout')
    }

    // Khi thêm sản phẩm mới vào giỏ hàng
    const addToCart = async (productData) => {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.post(`${API_URL}/cart/add`, productData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        // Thêm sản phẩm mới vào đầu mảng
        cartItems.value.unshift(response.data)
      } catch (err) {
        console.error('Lỗi khi thêm vào giỏ hàng:', err)
        throw err
      }
    }

    // Lifecycle hooks
    onMounted(() => {
      fetchCartItems()
    })

    // Add these if they're missing
    const discountError = ref(null)
    const discountSuccess = ref(null)
    const discountCode = ref('')
    const isApplying = ref(false)

    const applyDiscount = async () => {
      try {
        isApplying.value = true
        discountError.value = null
        discountSuccess.value = null
        
        // Add your discount application logic here
        
        discountSuccess.value = 'Mã giảm giá đã được áp dụng thành công!'
      } catch (err) {
        discountError.value = err.response?.data?.message || 'Không thể áp dụng mã giảm giá'
      } finally {
        isApplying.value = false
      }
    }

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
      checkout,
      selectedItems,
      selectedSubtotal,
      toggleSelectItem,
      selectAllItems,
      handleCheckout,
      addToCart,
      discountError,
      discountSuccess,
      discountCode,
      isApplying,
      applyDiscount,
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

.cart-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: transform 0.3s ease;
}

.cart-header {
  padding: 1.5rem;
  background: linear-gradient(145deg, #ffffff, #f8fafc);
  border-radius: 16px 16px 0 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cart-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.title-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  font-size: 1.2rem;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
  transition: all 0.3s ease;
}

.cart-title:hover .title-icon {
  transform: rotate(-10deg) scale(1.05);
  box-shadow: 0 6px 15px rgba(59, 130, 246, 0.35);
}

.title-text {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.item-count {
  font-size: 0.9rem;
  color: #64748b;
  font-weight: 500;
}

.clear-cart-btn {
  position: relative;
  padding: 8px 16px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: #ef4444;
  font-weight: 500;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
}

.btn-content {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
  z-index: 1;
}

.btn-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #fee2e2, #fecaca);
  opacity: 0;
  transition: all 0.3s ease;
}

.clear-cart-btn:hover {
  transform: translateY(-2px);
}

.clear-cart-btn:hover .btn-background {
  opacity: 1;
}

.clear-cart-btn i {
  font-size: 1rem;
  transition: all 0.3s ease;
}

.clear-cart-btn:hover i {
  transform: rotate(15deg) scale(1.1);
}

/* Animation for initial load */
@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.cart-header {
  animation: slideInFromTop 0.5s ease forwards;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .cart-header {
    background: linear-gradient(145deg, #1e293b, #1a1f36);
  }

  .cart-title {
    color: #f1f5f9;
  }

  .item-count {
    color: #94a3b8;
  }

  .clear-cart-btn {
    color: #f87171;
  }

  .btn-background {
    background: linear-gradient(145deg, rgba(254, 226, 226, 0.1), rgba(254, 202, 202, 0.1));
  }
}

/* Responsive */
@media (max-width: 768px) {
  .cart-header {
    padding: 1rem;
  }

  .cart-title {
    font-size: 1.1rem;
  }

  .title-icon {
    width: 35px;
    height: 35px;
    font-size: 1rem;
  }

  .clear-cart-btn {
    padding: 6px 12px;
    font-size: 0.9rem;
  }
}

.cart-items-container {
  padding: 1rem;
}

.cart-item {
  position: relative;
  display: grid;
  grid-template-columns: 40px 100px 2fr 1fr 1fr;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  margin-bottom: 0.75rem;
  background: #fff;
  border-radius: 12px;
  transition: all 0.3s ease;
  border: 1px solid #f0f0f0;
}

.cart-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border-color: #e5e7eb;
}

.item-image-container {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 8px;
  overflow: hidden;
}

.item-image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.cart-item:hover .item-image-container img {
  transform: scale(1.05);
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.item-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
  line-height: 1.2;
}

.item-variant {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0;
}

.item-price {
  font-size: 0.9rem;
  font-weight: 600;
  color: #3b82f6;
}

.quantity-controls {
  display: flex;
  align-items: center;
  background: #f8fafc;
  border-radius: 6px;
  padding: 0.15rem;
}

.qty-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 4px;
  color: #64748b;
  transition: all 0.2s ease;
}

.qty-btn:hover:not(:disabled) {
  background: #e2e8f0;
  color: #3b82f6;
}

.qty-input {
  width: 35px;
  text-align: center;
  border: none;
  background: transparent;
  font-size: 0.9rem;
  font-weight: 500;
}

.item-subtotal {
  font-size: 0.95rem;
  font-weight: 600;
  color: #3b82f6;
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 28px;
  height: 28px;
  border: none;
  background: #fff;
  color: #ef4444;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.remove-btn:hover {
  background: #fee2e2;
  transform: rotate(90deg);
  color: #dc2626;
}

.remove-btn i {
  font-size: 0.9rem;
}

/* Responsive */
@media (max-width: 768px) {
  .remove-btn {
    width: 24px;
    height: 24px;
    top: 6px;
    right: 6px;
  }

  .remove-btn i {
    font-size: 0.8rem;
  }
}

/* Animations */
.cart-items-enter-active,
.cart-items-leave-active {
  transition: all 0.5s ease;
}

.cart-items-enter-from,
.cart-items-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.cart-items-move {
  transition: transform 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .cart-item {
    grid-template-columns: 30px 80px 1fr auto;
    gap: 0.75rem;
    padding: 0.75rem;
  }

  .item-image-container {
    width: 80px;
    height: 80px;
  }

  .item-name {
    font-size: 0.85rem;
  }

  .item-variant {
    font-size: 0.75rem;
  }

  .item-price {
    font-size: 0.85rem;
  }

  .quantity-controls {
    padding: 0.1rem;
  }

  .qty-btn {
    width: 24px;
    height: 24px;
  }

  .qty-input {
    width: 30px;
    font-size: 0.85rem;
  }

  .remove-btn {
    width: 24px;
    height: 24px;
    font-size: 0.85rem;
  }
}

.summary-header {
  padding: 1.5rem;
  background: linear-gradient(145deg, #ffffff, #f8f9ff);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.summary-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
}

.summary-title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1f36;
  position: relative;
}

.summary-title i {
  font-size: 1.5rem;
  background: linear-gradient(45deg, #3b82f6, #2563eb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  padding: 8px;
  border-radius: 12px;
  box-shadow: 
    0 2px 10px rgba(59, 130, 246, 0.1),
    inset 0 0 0 1px rgba(59, 130, 246, 0.1);
  transition: all 0.3s ease;
}

.summary-header:hover .summary-title i {
  transform: rotate(15deg) scale(1.1);
  box-shadow: 
    0 4px 15px rgba(59, 130, 246, 0.2),
    inset 0 0 0 1px rgba(59, 130, 246, 0.2);
}

.summary-title span {
  position: relative;
  padding-bottom: 4px;
}

.summary-title span::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  transition: width 0.3s ease;
}

.summary-header:hover .summary-title span::after {
  width: 100%;
}

/* Animation for icon on page load */
@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.summary-title i {
  animation: slideInFromTop 0.5s ease forwards;
}

/* Responsive styles */
@media (max-width: 768px) {
  .summary-header {
    padding: 1.25rem;
  }

  .summary-title {
    font-size: 1.1rem;
  }

  .summary-title i {
    font-size: 1.3rem;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .summary-header {
    background: linear-gradient(145deg, #1a1f36, #151929);
  }

  .summary-title {
    color: #ffffff;
  }

  .summary-title i {
    box-shadow: 
      0 2px 10px rgba(59, 130, 246, 0.2),
      inset 0 0 0 1px rgba(59, 130, 246, 0.2);
  }
}

.continue-shopping-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  text-decoration: none;
  color: #64748b;
  font-weight: 500;
  transition: all 0.3s ease;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(145deg, #f8fafc, #f1f5f9);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.continue-shopping-link:hover {
  color: #3b82f6;
  transform: translateX(-4px);
  background: linear-gradient(145deg, #f1f5f9, #e2e8f0);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(45deg, #3b82f6, #2563eb);
  color: white;
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.continue-shopping-link:hover .icon-wrapper {
  transform: translateX(-4px) rotate(-45deg);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.text {
  position: relative;
}

.text::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  transition: width 0.3s ease;
}

.continue-shopping-link:hover .text::after {
  width: 100%;
}

/* Animation on hover */
.continue-shopping-link::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to right,
    transparent,
    rgba(59, 130, 246, 0.1),
    transparent
  );
  transition: 0.5s;
}

.continue-shopping-link:hover::before {
  left: 100%;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .continue-shopping-link {
    background: linear-gradient(145deg, #1e293b, #1a1f36);
    color: #94a3b8;
    border-color: rgba(255, 255, 255, 0.05);
  }

  .continue-shopping-link:hover {
    background: linear-gradient(145deg, #1a1f36, #151929);
    color: #60a5fa;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .continue-shopping-link {
    width: 100%;
    justify-content: center;
    padding: 12px 20px;
  }
}

/* Animation for initial load */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.continue-shopping-link {
  animation: slideIn 0.5s ease forwards;
}

.discount-section {
  background: linear-gradient(145deg, #f8fafc, #f1f5f9);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}

.discount-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #1e293b;
  font-weight: 500;
}

.discount-header i {
  color: #3b82f6;
}

.discount-input-group {
  display: flex;
  gap: 8px;
}

.discount-input {
  flex: 1;
  padding: 10px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
  background: white;
}

.discount-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.discount-input.is-invalid {
  border-color: #ef4444;
}

.apply-discount-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(145deg, #3b82f6, #2563eb);
  color: white;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;
}

.apply-discount-btn:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
}

.apply-discount-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.discount-error, 
.discount-success {
  margin-top: 8px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.discount-error {
  color: #ef4444;
}

.discount-success {
  color: #10b981;
}

/* Animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.fa-spinner {
  animation: spin 1s linear infinite;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .discount-section {
    background: linear-gradient(145deg, #1e293b, #1a1f36);
  }

  .discount-header {
    color: #f1f5f9;
  }

  .discount-input {
    background: #1a1f36;
    border-color: #334155;
    color: #f1f5f9;
  }

  .discount-input:focus {
    border-color: #60a5fa;
    box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .discount-input-group {
    flex-direction: column;
  }

  .apply-discount-btn {
    width: 100%;
  }
}

/* Responsive Styles */
@media (max-width: 768px) {
  .discount-section {
    padding: 1rem;
    margin-bottom: 1rem;
    background: linear-gradient(145deg, #f8fafc, #f1f5f9);
  }

  .discount-header {
    font-size: 0.9rem;
    margin-bottom: 10px;
  }

  .discount-input-group {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .discount-input {
    width: 100%;
    padding: 12px;
    font-size: 0.9rem;
    border-radius: 10px;
  }

  .apply-discount-btn {
    width: 100%;
    padding: 12px;
    font-size: 0.9rem;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: linear-gradient(145deg, #3b82f6, #2563eb);
  }

  .apply-discount-btn i {
    font-size: 0.8rem;
  }

  /* Animation for mobile */
  .apply-discount-btn:active {
    transform: scale(0.98);
  }

  /* Improved touch target size */
  .discount-header i {
    font-size: 1.1rem;
    padding: 4px;
  }

  /* Better error/success message display */
  .discount-error,
  .discount-success {
    font-size: 0.85rem;
    padding: 8px 12px;
    border-radius: 8px;
    margin-top: 10px;
    text-align: center;
    width: 100%;
  }

  .discount-error {
    background-color: rgba(239, 68, 68, 0.1);
  }

  .discount-success {
    background-color: rgba(16, 185, 129, 0.1);
  }
}

/* Small phones */
@media (max-width: 480px) {
  .discount-section {
    padding: 0.875rem;
    border-radius: 10px;
  }

  .discount-header {
    font-size: 0.85rem;
  }

  .discount-input {
    padding: 10px;
    font-size: 0.85rem;
  }

  .apply-discount-btn {
    padding: 10px;
    font-size: 0.85rem;
  }

  /* Stack icon and text in header for very small screens */
  .discount-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

/* Landscape orientation */
@media (max-width: 768px) and (orientation: landscape) {
  .discount-input-group {
    grid-template-columns: 2fr 1fr;
    gap: 8px;
  }

  .apply-discount-btn {
    width: auto;
    white-space: nowrap;
  }
}

/* Dark mode for mobile */
@media (prefers-color-scheme: dark) and (max-width: 768px) {
  .discount-section {
    background: linear-gradient(145deg, #1e293b, #1a1f36);
  }

  .discount-input {
    background: #1a1f36;
    border-color: #334155;
  }

  .discount-error {
    background-color: rgba(239, 68, 68, 0.15);
  }

  .discount-success {
    background-color: rgba(16, 185, 129, 0.15);
  }
}

/* Loading state for mobile */
@media (max-width: 768px) {
  .apply-discount-btn:disabled {
    background: linear-gradient(145deg, #94a3b8, #64748b);
  }

  .fa-spinner {
    font-size: 0.9rem;
  }
}

/* Touch device optimizations */
@media (hover: none) {
  .apply-discount-btn:not(:disabled):hover {
    transform: none;
    box-shadow: none;
  }

  .apply-discount-btn:not(:disabled):active {
    transform: scale(0.98);
    background: linear-gradient(145deg, #2563eb, #1d4ed8);
  }
}

.checkout-button {
  position: relative;
  width: 100%;
  padding: 16px 24px;
  border: none;
  border-radius: 16px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
  margin-bottom: 1rem;
  z-index: 1; /* Đảm bảo nút có thể click */
}

.button-content {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  z-index: 2; /* Đảm bảo nội dung luôn hiển thị trên cùng */
}

/* Hover effect sử dụng pseudo-element thay vì div riêng biệt */
.checkout-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: -1; /* Đặt dưới nội dung */
}

.checkout-button:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 8px 20px rgba(37, 99, 235, 0.25),
    0 4px 8px rgba(37, 99, 235, 0.15);
}

.checkout-button:hover::before {
  opacity: 1;
}

.checkout-button:active {
  transform: translateY(1px);
}

.checkout-button i {
  font-size: 1.1rem;
  transition: transform 0.3s ease;
}

.checkout-button:hover i {
  transform: scale(1.1);
}

/* Shine effect */
.checkout-button::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  transform: rotate(45deg);
  transition: 0.5s;
  z-index: 1;
}

.checkout-button:hover::after {
  left: 100%;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .checkout-button {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  }
}

/* Mobile responsive */
@media (max-width: 768px) {
  .checkout-button {
    padding: 14px 20px;
    font-size: 1rem;
  }

  .button-content {
    gap: 8px;
  }

  .checkout-button i {
    font-size: 1rem;
  }
}

/* Touch device optimizations */
@media (hover: none) {
  .checkout-button:hover {
    transform: none;
    box-shadow: 
      0 4px 12px rgba(37, 99, 235, 0.2),
      0 2px 4px rgba(37, 99, 235, 0.1);
  }

  .checkout-button:active {
    transform: scale(0.98);
    background: linear-gradient(145deg, #2563eb, #1d4ed8);
  }
}

.item-select {
  display: flex;
  align-items: center;
  padding: 0 1rem;
}

.custom-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  border: 2px solid #e2e8f0;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.custom-checkbox:checked {
  background-color: #3b82f6;
  border-color: #3b82f6;
}

.cart-item {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  gap: 1rem;
  align-items: center;
}

.checkout-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  background: linear-gradient(135deg, #94a3b8, #64748b);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.discount-error,
.discount-success {
  margin-top: 8px;
  padding: 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.discount-error {
  color: #ef4444;
  background-color: rgba(239, 68, 68, 0.1);
}

.discount-success {
  color: #10b981;
  background-color: rgba(16, 185, 129, 0.1);
}
</style>
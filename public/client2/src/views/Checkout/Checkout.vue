<template>
    <div class="checkout-page">
      <div class="container py-4">
        <!-- Progress Steps -->
        <div class="checkout-steps mb-4">
          <div class="step active">
            <div class="step-icon">
              <i class="fas fa-shopping-cart"></i>
            </div>
            <span>Xác nhận đơn hàng</span>
          </div>
          <div class="step-line"></div>
          <div class="step">
            <div class="step-icon">
              <i class="fas fa-map-marker-alt"></i>
            </div>
            <span>Địa chỉ giao hàng</span>
          </div>
          <div class="step-line"></div>
          <div class="step">
            <div class="step-icon">
              <i class="fas fa-credit-card"></i>
            </div>
            <span>Thanh toán</span>
          </div>
        </div>
  
        <div class="row">
          <!-- Left Column - Order Details -->
          <div class="col-lg-8">
            <div class="card shadow-sm mb-4">
              <div class="card-header bg-white">
                <h5 class="mb-0">Thông tin đơn hàng</h5>
              </div>
              <div class="card-body">
                <div v-for="item in checkoutItems" :key="item.variantId" class="checkout-item">
                  <div class="d-flex align-items-center">
                    <img :src="item.image" :alt="item.name" class="item-image">
                    <div class="item-details ms-3">
                      <h6 class="mb-1">{{ item.name }}</h6>
                      <p class="text-muted mb-1">Phiên bản: {{ item.variantName }}</p>
                      <div class="d-flex align-items-center">
                        <div class="quantity-control">
                          <button @click="updateQuantity(item, -1)" :disabled="item.quantity <= 1">-</button>
                          <span>{{ item.quantity }}</span>
                          <button @click="updateQuantity(item, 1)">+</button>
                        </div>
                        <div class="price ms-3">
                          {{ formatPrice(item.price * item.quantity) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
  
            <!-- Shipping Address -->
            <div class="card shadow-sm mb-4">
              <div class="card-header bg-white">
                <h5 class="mb-0">Địa chỉ giao hàng</h5>
              </div>
              <div class="card-body">
                <div v-if="addresses.length > 0" class="address-list">
                  <div v-for="address in addresses" :key="address.id" 
                       class="address-item" 
                       :class="{ active: selectedAddress === address.id }"
                       @click="selectAddress(address.id)">
                    <div class="address-content">
                      <h6>{{ address.fullName }}</h6>
                      <p class="mb-0">{{ address.phone }}</p>
                      <p class="mb-0">{{ formatAddress(address) }}</p>
                    </div>
                    <div class="address-action">
                      <input type="radio" :checked="selectedAddress === address.id">
                    </div>
                  </div>
                </div>
                <button @click="showAddAddressModal" class="btn btn-outline-primary mt-3">
                  <i class="fas fa-plus"></i> Thêm địa chỉ mới
                </button>
              </div>
            </div>
          </div>
  
          <!-- Right Column - Order Summary -->
          <div class="col-lg-4">
            <div class="card shadow-sm order-summary">
              <div class="card-header bg-white">
                <h5 class="mb-0">Tổng đơn hàng</h5>
              </div>
              <div class="card-body">
                <div class="summary-item">
                  <span>Tạm tính</span>
                  <span>{{ formatPrice(subtotal) }}</span>
                </div>
                <div class="summary-item">
                  <span>Phí vận chuyển</span>
                  <span>{{ formatPrice(shippingFee) }}</span>
                </div>
                <hr>
                <div class="summary-item total">
                  <strong>Tổng cộng</strong>
                  <strong class="text-danger">{{ formatPrice(total) }}</strong>
                </div>
                <button @click="placeOrder" 
                        class="btn btn-danger w-100 mt-3" 
                        :disabled="!canPlaceOrder">
                  Đặt hàng
                </button>
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
  import { Modal } from 'bootstrap'
  
  export default {
    name: 'Checkout',
    setup() {
      const router = useRouter()
      const checkoutItems = ref([])
      const addresses = ref([])
      const selectedAddress = ref(null)
      const shippingFee = ref(30000) // Phí ship mặc định
      const newAddress = ref({
        fullName: '',
        phone: '',
        city: '',
        district: '',
        addressLine1: '',
        postalCode: '',
        isDefault: false
      })
      
      const submitting = ref(false)
      const addressModal = ref(null)
      const cities = ref([])
      const districts = ref([])
  
      // Load checkout items from localStorage
      onMounted(() => {
        const items = localStorage.getItem('checkoutItems')
        if (items) {
          checkoutItems.value = JSON.parse(items)
        } else {
          router.push('/cart')
        }
        fetchAddresses()
      })
  
      // Fetch user addresses
      const fetchAddresses = async () => {
        try {
          const token = localStorage.getItem('token')
          const response = await axios.get('http://localhost:3000/api/addresses', {
            headers: { Authorization: `Bearer ${token}` }
          })
          addresses.value = response.data
          if (response.data.length > 0) {
            selectedAddress.value = response.data[0].id
          }
        } catch (error) {
          console.error('Error fetching addresses:', error)
        }
      }
  
      // Computed properties
      const subtotal = computed(() => {
        return checkoutItems.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      })
  
      const total = computed(() => {
        return subtotal.value + shippingFee.value
      })
  
      const canPlaceOrder = computed(() => {
        return checkoutItems.value.length > 0 && selectedAddress.value !== null
      })
  
      // Methods
      const updateQuantity = (item, change) => {
        const newQuantity = item.quantity + change
        if (newQuantity >= 1) {
          item.quantity = newQuantity
        }
      }
  
      const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(price)
      }
  
      const formatAddress = (address) => {
        return `${address.address_line1}, ${address.city}, ${address.state}`
      }
  
      const placeOrder = async () => {
        try {
          const token = localStorage.getItem('token')
          const orderData = {
            addressId: selectedAddress.value,
            items: checkoutItems.value.map(item => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity
            }))
          }
  
          const response = await axios.post('http://localhost:3000/api/orders', orderData, {
            headers: { Authorization: `Bearer ${token}` }
          })
  
          // Clear checkout items
          localStorage.removeItem('checkoutItems')
  
          // Show success message
          await Swal.fire({
            icon: 'success',
            title: 'Đặt hàng thành công!',
            text: `Mã đơn hàng của bạn là: ${response.data.orderId}`,
            confirmButtonText: 'Xem đơn hàng'
          })
  
          // Redirect to order detail
          router.push(`/orders/${response.data.orderId}`)
        } catch (error) {
          console.error('Error placing order:', error)
          Swal.fire({
            icon: 'error',
            title: 'Đặt hàng thất bại',
            text: error.response?.data?.message || 'Vui lòng thử lại sau'
          })
        }
      }
  
      const showAddAddressModal = () => {
        if (!addressModal.value) {
          addressModal.value = new Modal(document.getElementById('addAddressModal'))
        }
        addressModal.value.show()
      }
  
      const submitNewAddress = async () => {
        try {
          submitting.value = true
          const token = localStorage.getItem('token')
          
          const addressData = {
            address_line1: newAddress.value.addressLine1,
            city: newAddress.value.city,
            state: newAddress.value.district,
            postal_code: newAddress.value.postalCode,
            country: 'VN',
            is_default: newAddress.value.isDefault
          }
  
          const response = await axios.post(
            'http://localhost:3000/api/addresses',
            addressData,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          )
  
          // Thêm địa chỉ mới vào danh sách
          addresses.value.push(response.data)
          
          // Nếu là địa chỉ mặc định, cập nhật selection
          if (newAddress.value.isDefault) {
            selectedAddress.value = response.data.id
          }
  
          // Reset form và đóng modal
          newAddress.value = {
            fullName: '',
            phone: '',
            city: '',
            district: '',
            addressLine1: '',
            postalCode: '',
            isDefault: false
          }
          
          addressModal.value.hide()
  
          Swal.fire({
            icon: 'success',
            title: 'Thêm địa chỉ thành công!',
            showConfirmButton: false,
            timer: 1500
          })
        } catch (error) {
          Swal.fire({
            icon: 'error',
            title: 'Lỗi!',
            text: error.response?.data?.message || 'Không thể thêm địa chỉ mới'
          })
        } finally {
          submitting.value = false
        }
      }
  
      // Load danh sách tỉnh/thành phố
      const loadCities = async () => {
        try {
          const response = await axios.get('https://provinces.open-api.vn/api/p/')
          cities.value = response.data
        } catch (error) {
          console.error('Error loading cities:', error)
        }
      }
  
      // Load danh sách quận/huyện khi chọn tỉnh/thành phố
      const loadDistricts = async (cityCode) => {
        try {
          const response = await axios.get(`https://provinces.open-api.vn/api/p/${cityCode}?depth=2`)
          districts.value = response.data.districts
        } catch (error) {
          console.error('Error loading districts:', error)
        }
      }
  
      onMounted(() => {
        loadCities()
      })
  
      return {
        checkoutItems,
        addresses,
        selectedAddress,
        shippingFee,
        subtotal,
        total,
        canPlaceOrder,
        updateQuantity,
        formatPrice,
        formatAddress,
        placeOrder,
        newAddress,
        submitting,
        showAddAddressModal,
        submitNewAddress,
        cities,
        districts,
        loadDistricts
      }
    }
  }
  </script>
  
  <style scoped>
  .checkout-page {
    background-color: #f8f9fa;
    min-height: 100vh;
  }
  
  .checkout-steps {
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 2rem 0;
  }
  
  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .step-icon {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #e9ecef;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.5rem;
  }
  
  .step.active .step-icon {
    background-color: #dc3545;
    color: white;
  }
  
  .step-line {
    width: 100px;
    height: 2px;
    background-color: #e9ecef;
    margin: 0 1rem;
  }
  
  .item-image {
    width: 100px;
    height: 100px;
    object-fit: cover;
    border-radius: 8px;
  }
  
  .quantity-control {
    display: flex;
    align-items: center;
    border: 1px solid #dee2e6;
    border-radius: 4px;
  }
  
  .quantity-control button {
    border: none;
    background: none;
    padding: 0.5rem 1rem;
  }
  
  .quantity-control span {
    padding: 0 1rem;
    border-left: 1px solid #dee2e6;
    border-right: 1px solid #dee2e6;
  }
  
  .address-item {
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .address-item.active {
    border-color: #dc3545;
  }
  
  .summary-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }
  
  .summary-item.total {
    font-size: 1.2rem;
    margin-top: 1rem;
  }
  
  .order-summary {
    position: sticky;
    top: 2rem;
  }
  
  @media (max-width: 768px) {
    .checkout-steps {
      flex-direction: column;
    }
    
    .step-line {
      height: 20px;
      width: 2px;
      margin: 0.5rem 0;
    }
    
    .order-summary {
      position: static;
      margin-top: 1rem;
    }
  }
  </style>
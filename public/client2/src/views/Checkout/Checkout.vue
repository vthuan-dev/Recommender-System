<template>
    <div class="checkout-page">
      <div class="container py-4">
        <!-- Progress Steps -->
        <div class="checkout-steps mb-4">
          <div class="step" :class="{ active: currentStep === 1, completed: currentStep > 1 }">
            <div class="step-icon">
              <i class="material-icons">{{ currentStep > 1 ? 'check' : 'shopping_cart' }}</i>
            </div>
            <span>Xác nhận đơn hàng</span>
          </div>
          <div class="step-line" :class="{ active: currentStep >= 2 }"></div>
          <div class="step" :class="{ active: currentStep === 2, completed: currentStep > 2 }">
            <div class="step-icon">
              <i class="material-icons">{{ currentStep > 2 ? 'check' : 'location_on' }}</i>
            </div>
            <span>Địa chỉ giao hàng</span>
          </div>
          <div class="step-line" :class="{ active: currentStep >= 3 }"></div>
          <div class="step" :class="{ active: currentStep === 3, completed: currentStep > 3 }">
            <div class="step-icon">
              <i class="material-icons">{{ currentStep > 3 ? 'check' : 'payment' }}</i>
            </div>
            <span>Thanh toán</span>
          </div>
          <div class="step-line" :class="{ active: currentStep >= 4 }"></div>
          <div class="step" :class="{ active: currentStep === 4 }">
            <div class="step-icon">
              <i class="material-icons">fact_check</i>
            </div>
            <span>Xác nhận thông tin</span>
          </div>
        </div>
  
        <!-- Step 1: Xác nhận đơn hàng -->
        <div v-if="currentStep === 1">
          <div class="row">
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
            </div>
  
            <!-- Order Summary -->
            <div class="col-lg-4">
              <div class="card shadow-sm order-summary">
                <div class="card-header bg-white">
                  <h5 class="mb-0">Tổng đơn hàng</h5>
                </div>
                <div class="card-body order-summary-content">
                  <div class="summary-item">
                    <span class="summary-label">Tạm tính</span>
                    <span class="summary-value">11.253.818 ₫</span>
                  </div>
                  
                  <div class="summary-item">
                    <span class="summary-label">
                      <i class="material-icons">local_shipping</i>
                      Phí vận chuyển
                    </span>
                    <span class="summary-value">30.000 ₫</span>
                  </div>

                  <div class="summary-divider">
                    <hr>
                  </div>

                  <div class="summary-item total">
                    <strong class="summary-label">Tổng cộng</strong>
                    <strong class="summary-value gradient-text">11.283.818 ₫</strong>
                  </div>

                  <button class="checkout-button" @click="handleNextStep" :disabled="!canProceed">
                    <span>{{ buttonText }}</span>
                    <i class="material-icons">arrow_forward</i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Step 2: Địa chỉ giao hàng -->
        <div v-if="currentStep === 2">
          <div class="row">
            <div class="col-lg-8">
              <div class="card shadow-sm mb-4">
                <div class="card-header bg-white d-flex justify-content-between align-items-center">
                  <h5 class="mb-0">Địa chỉ giao hàng</h5>
                  <button @click="showAddAddressModal" class="btn btn-outline-primary btn-sm">
                    <i class="fas fa-plus"></i> Thêm địa chỉ mới
                  </button>
                </div>
                <div class="card-body">
                  <div v-if="addresses.length > 0" class="address-list">
                    <div v-for="address in displayedAddresses" 
                         :key="address.id" 
                         class="address-item" 
                         :class="{ active: selectedAddress === address.id }"
                         @click="selectAddress(address.id)">
                      <div class="address-content">
                        <div class="d-flex align-items-start">
                          <div class="flex-grow-1">
                            <h6 class="mb-1">{{ address.address_line1 }}</h6>
                            <p class="mb-1" v-if="address.address_line2">
                              {{ address.address_line2 }}
                            </p>
                            <p class="mb-1">{{ address.city }}</p>
                            <p class="mb-0">{{ address.postal_code }}</p>
                          </div>
                          <div class="address-badge" v-if="address.is_default">
                            <span class="badge bg-primary">Mặc định</span>
                          </div>
                        </div>
                      </div>
                      <div class="form-check">
                        <input 
                          type="radio" 
                          class="form-check-input" 
                          :checked="selectedAddress === address.id"
                          @click.stop
                        >
                      </div>
                    </div>
                    
                    <!-- Nút xem thêm/thu gọn -->
                    <div v-if="addresses.length > 3" class="text-center mt-3">
                      <button 
                        @click="toggleAddressDisplay" 
                        class="btn btn-link toggle-addresses"
                      >
                        {{ isExpanded ? 'Thu gọn' : `Xem thêm ${addresses.length - 3} địa chỉ` }}
                        <i :class="isExpanded ? 'fas fa-chevron-up' : 'fas fa-chevron-down'" class="ms-1"></i>
                      </button>
                    </div>
                  </div>
                  <div v-else class="text-center py-3">
                    <p class="mb-3">Bạn chưa có địa chỉ giao hàng nào</p>
                    <button @click="showAddAddressModal" class="btn btn-primary">
                      <i class="fas fa-plus"></i> Thêm địa chỉ mới
                    </button>
                  </div>
                </div>
              </div>
              <div class="d-flex justify-content-between mt-3">
                <button @click="previousStep" class="btn btn-outline-secondary">
                  <i class="fas fa-arrow-left"></i> Quay lại
                </button>
                <button 
                  @click="proceedToPayment" 
                  class="btn btn-primary"
                  :disabled="!selectedAddress"
                >
                  Tiếp tục thanh toán <i class="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
  
            <!-- Order Summary cho step 2 -->
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
                  <button 
                    @click="nextStep" 
                    class="btn btn-primary w-100 mt-3"
                    :disabled="!selectedAddress"
                  >
                    Tiếp tục <i class="fas fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Step 3: Thanh toán -->
        <div v-if="currentStep === 3">
          <div class="row">
            <div class="col-lg-8">
              <div class="card shadow-sm mb-4">
                <div class="card-header bg-white">
                  <h5 class="mb-0">Phương thức thanh toán</h5>
                </div>
                <div class="card-body">
                  <!-- COD -->
                  <div class="payment-method" 
                       :class="{ active: selectedPaymentMethod === 'cod' }"
                       @click="selectPayment('cod')">
                    <div class="d-flex align-items-center">
                      <div class="payment-icon">
                        <i class="fas fa-truck"></i>
                      </div>
                      <div class="payment-details ms-3">
                        <h6>Thanh toán khi nhận hàng (COD)</h6>
                        <p class="mb-0">Thanh toán bằng tiền mặt khi nhận được hàng</p>
                      </div>
                      <div class="form-check ms-auto">
                        <input type="radio" 
                               class="form-check-input" 
                               :checked="selectedPaymentMethod === 'cod'"
                               @click.stop>
                      </div>
                    </div>
                  </div>

                  <!-- MoMo -->
                  <div class="payment-method mt-3" 
                       data-method="momo"
                       :class="{ active: selectedPaymentMethod === 'momo' }"
                       @click="selectPayment('momo')">
                    <div class="d-flex align-items-center">
                      <div class="payment-icon">
                        <img src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-MoMo-Circle.png" alt="MoMo">
                      </div>
                      <div class="payment-details ms-3">
                        <h6>Ví MoMo</h6>
                        <p class="mb-0">Thanh toán qua ví điện tử MoMo</p>
                      </div>
                      <div class="form-check ms-auto">
                        <input type="radio" 
                               class="form-check-input" 
                               :checked="selectedPaymentMethod === 'momo'"
                               @click.stop>
                      </div>
                    </div>
                  </div>

                  <!-- Banking -->
                  <div class="payment-method mt-3" 
                       :class="{ active: selectedPaymentMethod === 'banking' }"
                       @click="selectPayment('banking')">
                    <div class="d-flex align-items-center">
                      <div class="payment-icon">
                        <i class="fas fa-university"></i>
                      </div>
                      <div class="payment-details ms-3">
                        <h6>Chuyển khoản ngân hàng</h6>
                        <p class="mb-0">Thực hiện thanh toán qua tài khoản ngân hàng</p>
                      </div>
                      <div class="form-check ms-auto">
                        <input type="radio" 
                               class="form-check-input" 
                               :checked="selectedPaymentMethod === 'banking'"
                               @click.stop>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
  
            <!-- Order Summary -->
            <div class="col-lg-4">
              <div class="card shadow-sm order-summary">
                <div class="card-header bg-white">
                  <h5 class="mb-0">Tổng đơn hàng</h5>
                </div>
                <div class="card-body">
                  <div class="summary-item">
                    <span class="summary-label">Tạm tính</span>
                    <span class="summary-value">{{ formatPrice(subtotal) }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="summary-label">Phí vận chuyển</span>
                    <span class="summary-value">{{ formatPrice(shippingFee) }}</span>
                  </div>
                  <div class="summary-divider">
                    <hr>
                  </div>
                  <div class="summary-item total">
                    <strong class="summary-label">Tổng cộng</strong>
                    <strong class="summary-value gradient-text">{{ formatPrice(total) }}</strong>
                  </div>
                  <button class="checkout-button" 
                          @click="handleNextStep" 
                          :disabled="!selectedPaymentMethod">
                    <span>Tiếp tục</span>
                    <i class="material-icons">arrow_forward</i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Step 4: Xác nhận thông tin -->
        <div v-if="currentStep === 4">
          <div class="row">
            <div class="col-lg-8">
              <!-- Thông tin người nhận -->
              <div class="confirmation-section mb-4">
                <div class="section-title">
                  <i class="material-icons">person</i>
                  <h5 class="mb-0">Thông tin người nhận</h5>
                </div>
                <div class="section-content">
                  <div class="recipient-info">
                    <p class="info-item"><strong>Địa chỉ:</strong> {{ selectedAddress?.address_line1 }}</p>
                    <p class="info-item"><strong>Thành phố:</strong> {{ selectedAddress?.city }}</p>
                    <p class="info-item mb-0"><strong>Mã bưu điện:</strong> {{ selectedAddress?.postal_code }}</p>
                  </div>
                </div>
              </div>

              <!-- Danh sách sản phẩm -->
              <div class="confirmation-section mb-4">
                <div class="section-title">
                  <i class="material-icons">shopping_cart</i>
                  <h5 class="mb-0">Danh sách sản phẩm</h5>
                </div>
                <div class="product-list">
                  <div v-for="item in checkoutItems" :key="item.variantId" class="product-item">
                    <div class="d-flex align-items-center">
                      <img :src="item.image" :alt="item.name" class="confirmation-item-image">
                      <div class="ms-3 flex-grow-1">
                        <h6 class="product-name">{{ item.name }}</h6>
                        <p class="variant-name mb-1">Phiên bản: {{ item.variantName }}</p>
                        <div class="d-flex justify-content-between align-items-center">
                          <span class="quantity">Số lượng: {{ item.quantity }}</span>
                          <span class="price">{{ formatPrice(item.price * item.quantity) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Phương thức thanh toán -->
              <div class="confirmation-section">
                <div class="section-title">
                  <i class="material-icons">payment</i>
                  <h5 class="mb-0">Phương thức thanh toán</h5>
                </div>
                <div class="section-content">
                  <div class="payment-info">
                    <div class="selected-payment">
                      <i :class="getPaymentIcon"></i>
                      <span>{{ getPaymentMethod }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Order Summary -->
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
                  <div class="summary-divider">
                    <hr>
                  </div>
                  <div class="summary-item total">
                    <strong>Tổng cộng</strong>
                    <strong class="gradient-text">{{ formatPrice(total) }}</strong>
                  </div>
                  <button class="checkout-button confirm-button" @click="placeOrder">
                    <span>Hoàn tất đơn hàng</span>
                    <i class="material-icons">check_circle</i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Add Address Modal -->
      <div class="modal fade" id="addAddressModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content address-modal">
            <div class="modal-header border-0">
              <h5 class="modal-title fw-bold">Thêm địa chỉ mới</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <form @submit.prevent="submitNewAddress" class="address-form">
                <!-- Tỉnh/Thành phố -->
                <div class="form-floating mb-3 fade-in">
                  <select 
                    v-model="selectedProvince"
                    class="form-select custom-select"
                    id="province"
                    required
                    @change="handleProvinceChange"
                  >
                    <option value="">Chọn Tỉnh/Thành phố</option>
                    <option 
                      v-for="province in provinces" 
                      :key="province.code"
                      :value="province.code"
                    >
                      {{ province.name }}
                    </option>
                  </select>
                  <label for="province">Tỉnh/Thành phố <span class="text-danger">*</span></label>
                </div>

                <!-- Quận/Huyện -->
                <div class="form-floating mb-3 fade-in" style="animation-delay: 0.1s">
                  <select 
                    v-model="selectedDistrict"
                    class="form-select custom-select"
                    id="district"
                    required
                    @change="handleDistrictChange"
                    :disabled="!selectedProvince"
                  >
                    <option value="">Chn Quận/Huyện</option>
                    <option 
                      v-for="district in districts" 
                      :key="district.code"
                      :value="district.code"
                    >
                      {{ district.name }}
                    </option>
                  </select>
                  <label for="district">Quận/Huyện <span class="text-danger">*</span></label>
                </div>

                <!-- Phường/Xã -->
                <div class="form-floating mb-3 fade-in" style="animation-delay: 0.2s">
                  <select 
                    v-model="selectedWard"
                    class="form-select custom-select"
                    id="ward"
                    required
                    :disabled="!selectedDistrict"
                  >
                    <option value="">Chọn Phường/Xã</option>
                    <option 
                      v-for="ward in wards" 
                      :key="ward.code"
                      :value="ward.code"
                    >
                      {{ ward.name }}
                    </option>
                  </select>
                  <label for="ward">Phường/Xã <span class="text-danger">*</span></label>
                </div>

                <!-- Địa chỉ chi tiết -->
                <div class="form-floating mb-3 fade-in" style="animation-delay: 0.3s">
                  <input 
                    v-model="newAddress.address_line1"
                    type="text"
                    class="form-control custom-input"
                    id="address1"
                    required
                    placeholder="Số nhà, tên đường"
                  >
                  <label for="address1">Địa chỉ chi tiết <span class="text-danger">*</span></label>
                </div>
                
                <!-- Địa chỉ bổ sung -->
                <div class="form-floating mb-3 fade-in" style="animation-delay: 0.4s">
                  <input 
                    v-model="newAddress.address_line2"
                    type="text"
                    class="form-control custom-input"
                    id="address2"
                    placeholder="Căn hộ, tầng, tòa nhà (nếu có)"
                  >
                  <label for="address2">Địa ch bổ sung</label>
                </div>

                <!-- Mã bưu điện -->
                <div class="form-floating mb-4 fade-in" style="animation-delay: 0.5s">
                  <input 
                    v-model="newAddress.postal_code"
                    type="text"
                    class="form-control custom-input"
                    id="postal"
                    required
                    placeholder="Mã bưu điện"
                  >
                  <label for="postal">Mã bưu điện <span class="text-danger">*</span></label>
                </div>

                <!-- Đặt làm địa chỉ mặc định -->
                <div class="form-check mb-4 fade-in" style="animation-delay: 0.6s">
                  <input 
                    type="checkbox"
                    class="form-check-input custom-checkbox"
                    id="isDefault"
                    v-model="newAddress.is_default"
                  >
                  <label class="form-check-label" for="isDefault">
                    Đặt làm địa chỉ mặc định
                  </label>
                </div>

                <div class="d-flex justify-content-end gap-2 fade-in" style="animation-delay: 0.7s">
                  <button type="button" class="btn btn-light" data-bs-dismiss="modal">
                    Hủy
                  </button>
                  <button type="submit" class="btn btn-primary" :disabled="submitting">
                    <span v-if="submitting" class="spinner-border spinner-border-sm me-1"></span>
                    Thêm địa chỉ
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import axios from 'axios'
  import Swal from 'sweetalert2'
  import { Modal } from 'bootstrap'
  
  const router = useRouter()
  const checkoutItems = ref([])
  const addresses = ref([])
  const selectedAddress = ref(null)
  const shippingFee = ref(30000) // Phí ship mặc định
  const newAddress = ref({
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    is_default: false
  })
  
  const submitting = ref(false)
  const addressModal = ref(null)
  const closeBtn = ref(null)
  const provinces = ref([])
  const districts = ref([])
  const wards = ref([])
  const currentStep = ref(1)
  const selectedPaymentMethod = ref(null)
  const selectedProvince = ref('')
  const selectedDistrict = ref('')
  const selectedWard = ref('')
  const isExpanded = ref(false)
  
  // Load checkout items from localStorage
  onMounted(() => {
    // Lấy dữ liệu từ localStorage
    const savedItems = localStorage.getItem('checkoutItems')
    if (!savedItems) {
      // Nếu không có dữ liệu, chuyển về trang giỏ hàng
      router.push('/cart')
      return
    }
    
    try {
      checkoutItems.value = JSON.parse(savedItems)
    } catch (error) {
      console.error('Error parsing checkout items:', error)
      router.push('/cart')
    }
    fetchAddresses()
    addressModal.value = new Modal(document.getElementById('addAddressModal'))
    loadProvinces()
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
    return checkoutItems.value.reduce((sum, item) => {
      return sum + (Number(item.price) * Number(item.quantity))
    }, 0)
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
    }).format(price).replace('₫', '').trim() + ' ₫'
  }
  
  const formatAddress = (address) => {
    return `${address.address_line1}, ${address.city}, ${address.state}`
  }
  
  const placeOrder = async () => {
    if (submitting.value) return
    submitting.value = true

    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('Vui lòng đăng nhập lại')

      const orderData = {
        addressId: selectedAddress.value,
        items: checkoutItems.value,
        paymentMethod: selectedPaymentMethod.value
      }

      const response = await axios({
        method: 'POST',
        url: 'http://localhost:3000/api/orders',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: orderData
      })

      // Xử lý đặt hàng thành công
      Swal.fire({
        icon: 'success',
        title: 'Đặt hàng thành công!',
        text: 'Cảm ơn bạn đã mua hàng'
      }).then(() => {
        // Chuyển đến trang xác nhận đơn hàng
        router.push(`/order-confirmation/${response.data.orderId}`)
      })

    } catch (error) {
      console.error('Error placing order:', error)
      Swal.fire({
        icon: 'error',
        title: 'Lỗi đặt hàng',
        text: error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại'
      })
    } finally {
      submitting.value = false
    }
  }
  
  const showAddAddressModal = () => {
    addressModal.value.show()
  }
  
  const submitNewAddress = async () => {
    if (submitting.value) return
    submitting.value = true

    try {
      const token = localStorage.getItem('token')
      if (!token) throw new Error('Vui lòng đăng nhập lại')

      // Lấy thông tin địa ch đã chọn
      const province = provinces.value.find(p => p.code === selectedProvince.value)
      const district = districts.value.find(d => d.code === selectedDistrict.value)
      const ward = wards.value.find(w => w.code === selectedWard.value)

      const addressData = {
        address_line1: newAddress.value.address_line1,
        address_line2: newAddress.value.address_line2 || '',
        city: `${ward?.name}, ${district?.name}, ${province?.name}`,
        postal_code: newAddress.value.postal_code,
        country: 'Việt Nam',
        is_default: newAddress.value.is_default
      }

      const response = await axios({
        method: 'POST',
        url: 'http://localhost:3000/api/addresses',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: addressData
      })

      // Reset form
      newAddress.value = {
        address_line1: '',
        address_line2: '',
        postal_code: '',
        is_default: false
      }
      selectedProvince.value = ''
      selectedDistrict.value = ''
      selectedWard.value = ''

      // Đóng modal và thông báo thành công
      const modal = Modal.getInstance(document.getElementById('addAddressModal'))
      modal.hide()

      Swal.fire({
        icon: 'success',
        title: 'Thêm địa chỉ thành công!',
        showConfirmButton: false,
        timer: 1500
      })

      // Reload danh sách địa chỉ
      await fetchAddresses()

    } catch (error) {
      console.error('Error adding address:', error)
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: error.response?.data?.message || 'Không thể thêm địa chỉ mới'
      })
    } finally {
      submitting.value = false
    }
  }
  
  // Load tỉnh/thành phố
  const loadProvinces = async () => {
    try {
      const response = await axios.get('https://provinces.open-api.vn/api/p/')
      provinces.value = response.data
    } catch (error) {
      console.error('Error loading provinces:', error)
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Không thể tải danh sách tỉnh thành'
      })
    }
  }
  
  // Xử lý khi chọn tỉnh/thành phố
  const handleProvinceChange = async () => {
    try {
      selectedDistrict.value = ''
      selectedWard.value = ''
      districts.value = []
      wards.value = []
      
      if (selectedProvince.value) {
        const response = await axios.get(
          `https://provinces.open-api.vn/api/p/${selectedProvince.value}?depth=2`
        )
        districts.value = response.data.districts
      }
    } catch (error) {
      console.error('Error loading districts:', error)
    }
  }
  
  // Xử lý khi chọn quận/huyện
  const handleDistrictChange = async () => {
    try {
      selectedWard.value = ''
      wards.value = []
      
      if (selectedDistrict.value) {
        const response = await axios.get(
          `https://provinces.open-api.vn/api/d/${selectedDistrict.value}?depth=2`
        )
        wards.value = response.data.wards
      }
    } catch (error) {
      console.error('Error loading wards:', error)
    }
  }
  
  const nextStep = () => {
    if (currentStep.value < 3) {
      currentStep.value++
    }
  }
  
  const previousStep = () => {
    if (currentStep.value > 1) {
      currentStep.value--
    }
  }
  
  // Xử lý chuyển sang bước thanh toán
  const proceedToPayment = async () => {
    try {
      if (!selectedAddress.value) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Vui lòng chọn địa ch giao hàng'
        })
        return
      }

      // Lưu địa chỉ đã chọn vào state hoặc localStorage nếu cần
      localStorage.setItem('selectedAddressId', selectedAddress.value)
      
      // Chuyển sang bước thanh toán
      currentStep.value = 3
    } catch (error) {
      console.error('Error proceeding to payment:', error)
      Swal.fire({
        icon: 'error',
        title: 'Lỗi',
        text: 'Có lỗi xảy ra, vui lòng thử lại'
      })
    }
  }
  
  const toggleAddressDisplay = () => {
    isExpanded.value = !isExpanded.value
  }
  
  const displayedAddresses = computed(() => {
    if (isExpanded.value || addresses.value.length <= 3) {
      return addresses.value
    }
    return addresses.value.slice(0, 3)
  })
  
  const canProceed = computed(() => {
    switch (currentStep.value) {
      case 1:
        return checkoutItems.value && checkoutItems.value.length > 0
      case 2:
        return selectedAddress.value
      case 3:
        return true // Thêm điều kiện cho bước thanh toán nếu cần
      default:
        return false
    }
  })
  
  const buttonText = computed(() => {
    switch (currentStep.value) {
      case 1:
        return 'Tiếp tục'
      case 2:
        return 'Đến thanh toán'
      case 3:
        return 'Hoàn tất đơn hàng'
      default:
        return 'Tiếp tục'
    }
  })
  
  const handleNextStep = () => {
    if (currentStep.value < 4) { // Cập nhật điều kiện vì có thêm bước mới
      if (currentStep.value === 2 && !selectedAddress.value) {
        // Kiểm tra địa chỉ
        return;
      }
      currentStep.value++;
    } else {
      // Xử lý thanh toán
      processPayment();
    }
  }
  
  const handleCompleteOrder = async () => {
    try {
      // Thêm logic xử lý hoàn tất đơn hàng
      console.log('Hoàn tất đơn hàng')
    } catch (error) {
      console.error('Li khi hoàn tất đơn hàng:', error)
    }
  }
  
  const goToStep = (step) => {
    // Chỉ cho phép quay lại các step đã hoàn thành
    if (step < currentStep.value) {
      currentStep.value = step;
    }
  }
  
  const selectAddress = (addressId) => {
    selectedAddress.value = addressId;
    console.log('Selected address:', addressId);
  }
  
  const selectPayment = (method) => {
    selectedPaymentMethod.value = method;
    console.log('Selected payment method:', method);
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
    position: relative;
  }
  
  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    opacity: 0.5;
    transition: all 0.5s ease;
    position: relative;
    z-index: 2;
    cursor: not-allowed;
  }
  
  .step.active {
    opacity: 1;
    transform: scale(1.1);
    cursor: pointer;
  }
  
  .step.completed {
    opacity: 1;
    cursor: pointer;
  }
  
  .step.completed .step-icon {
    background: #28a745;
    color: white;
  }
  
  .step.completed:hover {
    transform: scale(1.05);
  }
  
  .step.completed .step-icon .material-icons {
    animation: checkmark 0.5s ease-in-out;
  }
  
  @keyframes checkmark {
    0% {
      transform: scale(0);
    }
    50% {
      transform: scale(1.2);
    }
    100% {
      transform: scale(1);
    }
  }
  
  .step-icon {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.5rem;
    transition: all 0.5s ease;
    position: relative;
    overflow: hidden;
  }
  
  .step.active .step-icon {
    background: #007bff;
    color: white;
    box-shadow: 0 0 0 5px rgba(0, 123, 255, 0.2);
  }
  
  .step.active .step-icon .material-icons {
    color: white;
    animation: bounceIn 0.5s ease;
  }
  
  .step-line {
    width: 100px;
    height: 3px;
    background: #e9ecef;
    position: relative;
    margin: 0 1rem;
    transition: all 0.5s ease;
    overflow: hidden;
  }
  
  .step-line::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 0;
    background: linear-gradient(to right, #28a745, #40c057);
    transition: width 0.5s ease-in-out;
  }
  
  .step-line.active::before {
    width: 100%;
    animation: progressLine 0.5s ease-in-out;
  }
  
  @keyframes progressLine {
    0% {
      width: 0;
    }
    100% {
      width: 100%;
    }
  }
  
  /* Animation cho active step-line */
  .step-line.active {
    background: #e9ecef;
  }
  
  .step-line.active::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 30%;
    background: rgba(255, 255, 255, 0.3);
    animation: shimmer 1.5s infinite;
  }
  
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(400%);
    }
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .step-line {
      width: 50px;
    }
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
    position: relative;
    padding: 12px 15px;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: #fff;
  }
  
  .address-item:hover {
    border-color: #0d6efd;
    box-shadow: 0 2px 8px rgba(13, 110, 253, 0.1);
  }
  
  .address-item.active {
    border-color: #0d6efd;
    background-color: #f8f9ff;
  }
  
  .address-content {
    font-size: 0.9rem;
  }
  
  .address-content h6 {
    font-size: 0.95rem;
    margin-bottom: 4px;
    color: #2c3e50;
  }
  
  .address-content p {
    font-size: 0.85rem;
    margin-bottom: 2px;
    color: #6c757d;
    line-height: 1.4;
  }
  
  .address-badge {
    position: absolute;
    top: 12px;
    right: 15px;
  }
  
  .address-badge .badge {
    font-size: 0.75rem;
    padding: 4px 8px;
    font-weight: 500;
  }
  
  .form-check {
    margin: 8px 0 0 0;
  }
  
  .form-check-input {
    margin-top: 2px;
    cursor: pointer;
  }
  
  /* Custom scrollbar for address list */
  .address-list::-webkit-scrollbar {
    width: 4px;
  }
  
  .address-list::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 2px;
  }
  
  .address-list::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 2px;
  }
  
  .address-list::-webkit-scrollbar-thumb:hover {
    background: #999;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .address-list {
      max-height: 300px;
    }
  
    .address-item {
      padding: 10px 12px;
    }
  
    .address-content h6 {
      font-size: 0.9rem;
    }
  
    .address-content p {
      font-size: 0.8rem;
    }
  }
  
  .required:after {
    content: " *";
    color: red;
  }
  
  .form-check-input:checked {
    background-color: #0d6efd;
    border-color: #0d6efd;
  }
  
  /* Custom scrollbar for order summary */
  .order-summary-content::-webkit-scrollbar {
    width: 4px;
  }
  
  .order-summary-content::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 2px;
  }
  
  .order-summary-content::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 2px;
  }
  
  .order-summary-content::-webkit-scrollbar-thumb:hover {
    background: #999;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .order-summary-content {
      padding: 1.25rem;
    }
  
    .summary-label,
    .summary-value {
      font-size: 0.9rem;
    }
  
    .gradient-text {
      font-size: 1.1rem;
    }
  
    .checkout-button {
      padding: 0.875rem;
      font-size: 0.95rem;
    }
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
  
  .form-select:disabled {
    background-color: #e9ecef;
    cursor: not-allowed;
  }
  
  .modal-body {
    max-height: 70vh;
    overflow-y: auto;
  }
  
  /* Modal Styles */
  .address-modal {
    border-radius: 16px;
    border: none;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }
  
  .modal-header {
    padding: 1.5rem 1.5rem 0.5rem;
  }
  
  .modal-body {
    padding: 1.5rem;
  }
  
  /* Form Controls */
  .custom-input,
  .custom-select {
    border-radius: 10px;
    border: 2px solid #e9ecef;
    padding: 0.75rem 1rem;
    height: 58px;
    transition: all 0.3s ease;
  }
  
  .custom-input:focus,
  .custom-select:focus {
    border-color: #0d6efd;
    box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.15);
  }
  
  .form-floating > label {
    padding: 1rem;
  }
  
  .custom-checkbox {
    width: 1.2rem;
    height: 1.2rem;
    border-radius: 4px;
    transition: all 0.2s ease;
  }
  
  .custom-checkbox:checked {
    background-color: #0d6efd;
    border-color: #0d6efd;
  }
  
  /* Buttons */
  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: 10px;
    font-weight: 500;
    transition: all 0.3s ease;
  }
  
  .btn-primary {
    background: linear-gradient(45deg, #0d6efd, #0a58ca);
    border: none;
  }
  
  .btn-primary:hover {
    background: linear-gradient(45deg, #0a58ca, #084298);
    transform: translateY(-1px);
  }
  
  .btn-light {
    background: #f8f9fa;
    border: 2px solid #e9ecef;
  }
  
  .btn-light:hover {
    background: #e9ecef;
  }
  
  /* Animations */
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
  
  .fade-in {
    animation: fadeIn 0.5s ease forwards;
    opacity: 0;
  }
  
  /* Disabled States */
  .form-select:disabled {
    background-color: #f8f9fa;
    cursor: not-allowed;
    opacity: 0.7;
  }
  
  /* Responsive Adjustments */
  @media (max-width: 768px) {
    .modal-dialog {
      margin: 1rem;
    }
    
    .custom-input,
    .custom-select {
      height: 52px;
    }
    
    .btn {
      padding: 0.6rem 1.2rem;
    }
  }
  
  /* Loading Spinner */
  .spinner-border {
    width: 1rem;
    height: 1rem;
    border-width: 0.15em;
  }
  
  /* Error States */
  .custom-input.is-invalid,
  .custom-select.is-invalid {
    border-color: #dc3545;
    background-image: url("data:image/svg+xml,...");
  }
  
  /* Success States */
  .custom-input.is-valid,
  .custom-select.is-valid {
    border-color: #198754;
    background-image: url("data:image/svg+xml,...");
  }
  
  /* Hover Effects */
  .address-modal {
    transform: scale(0.95);
    opacity: 0;
    transition: all 0.3s ease;
  }
  
  .modal.show .address-modal {
    transform: scale(1);
    opacity: 1;
  }
  
  /* Custom Scrollbar */
  .modal-body::-webkit-scrollbar {
    width: 6px;
  }
  
  .modal-body::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  .modal-body::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
  }
  
  .modal-body::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
  
  /* Address List Styles */
  .address-list {
    display: grid;
    gap: 12px;
    max-height: unset;
    transition: max-height 0.3s ease;
  }
  
  .address-list.collapsed {
    max-height: 300px;
    overflow: hidden;
  }
  
  .toggle-addresses {
    color: #0d6efd;
    text-decoration: none;
    font-size: 0.9rem;
    padding: 8px 16px;
    border: 1px solid #e9ecef;
    border-radius: 20px;
    background: #fff;
    transition: all 0.2s ease;
  }
  
  .toggle-addresses:hover {
    background: #f8f9fa;
    color: #0a58ca;
  }
  
  .toggle-addresses i {
    transition: transform 0.2s ease;
  }
  
  /* Animation cho nút xem thêm/thu gọn */
  @keyframes bounceIcon {
    0%, 100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-2px);
    }
  }
  
  .toggle-addresses:hover i {
    animation: bounceIcon 1s infinite;
  }
  
  /* Hiệu ứng mở rộng/thu gọn */
  .address-item {
    animation: slideDown 0.3s ease forwards;
  }
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .address-list.collapsed {
      max-height: 250px;
    }
    
    .toggle-addresses {
      font-size: 0.85rem;
      padding: 6px 12px;
    }
  }
  
  /* Order Summary Styles */
  .order-summary-content {
    padding: 1.5rem;
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  }
  
  .summary-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding: 0.5rem 0;
  }
  
  .summary-label {
    color: #64748b;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
  }
  
  .summary-value {
    font-weight: 500;
    color: #1e293b;
    font-size: 0.95rem;
  }
  
  .summary-divider {
    margin: 1rem 0;
  }
  
  .summary-divider hr {
    border: none;
    height: 1px;
    background: linear-gradient(to right, #e2e8f0 0%, #94a3b8 50%, #e2e8f0 100%);
    margin: 0;
  }
  
  /* Total Amount Styling */
  .summary-item.total {
    margin-top: 0.5rem;
    margin-bottom: 1.5rem;
  }
  
  .summary-item.total .summary-label {
    font-size: 1.1rem;
    color: #1e293b;
  }
  
  .gradient-text {
    background: linear-gradient(45deg, #ff6b6b, #ee0000);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-size: 1.25rem;
  }
  
  /* Checkout Button */
  .checkout-button {
    width: 100%;
    padding: 1rem;
    border: none;
    border-radius: 12px;
    background: linear-gradient(45deg, #0062ff, #0033ff);
    color: white;
    font-weight: 600;
    font-size: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    cursor: pointer;
  }
  
  .checkout-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      to right,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    transition: all 0.5s ease;
  }
  
  .checkout-button:hover::before {
    left: 100%;
  }
  
  .checkout-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 98, 255, 0.2);
  }
  
  .checkout-button:active {
    transform: translateY(0);
  }
  
  .checkout-button i {
    transition: transform 0.3s ease;
  }
  
  .checkout-button:hover i {
    transform: translateX(4px);
  }
  
  /* Hover Effects */
  .summary-item:hover {
    background: linear-gradient(to right, #f8fafc, transparent);
    border-radius: 8px;
    transition: all 0.3s ease;
  }
  
  /* Animation */
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
  
  .order-summary-content {
    animation: fadeIn 0.5s ease-out;
  }
  
  /* Disabled States */
  .checkout-button:disabled {
    background: linear-gradient(45deg, #ccc, #999);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  .checkout-button:disabled::before {
    display: none;
  }
  
  .checkout-button:not(:disabled):hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 98, 255, 0.2);
  }
  
  .checkout-button:not(:disabled):active {
    transform: translateY(0);
  }
  
  /* Animation cho icon */
  .checkout-button:not(:disabled):hover i {
    transform: translateX(4px);
  }
  
  /* Loading state nếu cần */
  .checkout-button.loading {
    position: relative;
    pointer-events: none;
  }
  
  .checkout-button.loading span {
    opacity: 0;
  }
  
  .checkout-button.loading::after {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    border: 2px solid #fff;
    border-radius: 50%;
    border-top-color: transparent;
    animation: spin 0.8s linear infinite;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  /* Payment Methods Styles */
  .payment-methods {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .payment-method {
    padding: 1.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .payment-method:hover {
    border-color: #3b82f6;
    background: #f8fafc;
  }

  .payment-method.active {
    border-color: #3b82f6;
    background: #f0f7ff;
  }

  .payment-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: transparent;
    overflow: hidden;
  }

  .payment-icon i {
    font-size: 24px;
    color: #3b82f6;
  }

  /* Specific styles for each payment method */
  .payment-icon.momo {
    background: white;
    padding: 4px;
  }

  .payment-icon.momo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 50%;
  }

  .payment-icon.banking i {
    color: #2563eb;
  }

  .payment-details h6 {
    margin-bottom: 0.25rem;
    font-weight: 600;
  }

  .payment-details p {
    color: #64748b;
    font-size: 0.875rem;
  }

  .form-check-input:checked {
    background-color: #3b82f6;
    border-color: #3b82f6;
  }
  
  /* Điều chỉnh icon trong summary */
  .summary-label .material-icons {
    vertical-align: middle;
    margin-right: 8px;
    font-size: 20px;
  }
  
  /* Điều chỉnh icon trong button */
  .checkout-button .material-icons {
    margin-left: 8px;
    font-size: 20px;
  }
  
  /* Animation cho icon check */
  .step.completed .step-icon {
    animation: completedPulse 2s infinite;
  }
  
  @keyframes completedPulse {
    0% {
      box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.4);
    }
    70% {
      box-shadow: 0 0 0 10px rgba(40, 167, 69, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(40, 167, 69, 0);
    }
  }
  
  .confirmation-section {
    padding: 1.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #fff;
  }
  
  .section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #2d3748;
    margin-bottom: 1rem;
  }
  
  .section-title i {
    font-size: 1.25rem;
    color: #4a5568;
  }
  
  .confirmation-item-image {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 8px;
  }
  
  .product-item {
    padding: 1rem 0;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .product-item:last-child {
    border-bottom: none;
  }
  
  .total-amount {
    padding-top: 1rem;
    border-top: 2px solid #e2e8f0;
    margin-top: 1rem;
  }
  
  .section-content {
    background: #f8fafc;
    padding: 1rem;
    border-radius: 6px;
  }
  
  /* Specific styles for MoMo payment icon */
  .payment-icon {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background: transparent;
    overflow: hidden;
  }
  
  .payment-method[data-method="momo"] .payment-icon {
    background: white;
    padding: 4px;
  }
  
  .payment-method[data-method="momo"] img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 50%;
  }
  
  /* Hover effect for MoMo payment method */
  .payment-method[data-method="momo"]:hover .payment-icon {
    transform: scale(1.05);
    transition: transform 0.2s ease;
  }
  </style>
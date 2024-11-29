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
            <div class="order-card">
              <div class="order-header">
                <div class="header-content">
                  <i class="fas fa-shopping-cart"></i>
                  <h5>Thông tin đơn hàng</h5>
                </div>
              </div>
              
              <div class="order-body">
                <div v-for="item in checkoutItems" 
                     :key="item.product_id" 
                     class="checkout-item">
                  <div class="item-container">
                    <div class="item-image-wrapper">
                      <img 
                        :src="formatImageUrl(item.image)"
                        :alt="item.name" 
                        class="item-image"
                        @error="handleImageError"
                      >
                    </div>
                    
                    <div class="item-details">
                      <h6 class="item-name">{{ item.name }}</h6>
                      <p class="item-variant">Phiên bản: {{ item.variantName }}</p>
                      
                      <div class="item-controls">
                        <div class="quantity-control">
                          <button 
                            class="qty-btn"
                            :disabled="item.quantity <= 1"
                            @click="updateQuantity(item.id, item.quantity - 1)"
                          >
                            <i class="fas fa-minus"></i>
                          </button>
                          <span class="qty-value">{{ item.quantity }}</span>
                          <button 
                            class="qty-btn"
                            @click="updateQuantity(item.id, item.quantity + 1)"
                          >
                            <i class="fas fa-plus"></i>
                          </button>
                        </div>
                        <div class="item-price">{{ formatPrice(item.price * item.quantity) }}</div>
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
                  <span class="summary-value">{{ formatPrice(subtotal) }}</span>
                </div>
                
                <div class="summary-item">
                  <span class="summary-label">
                    <i class="material-icons">local_shipping</i>
                    Phí vận chuyển
                  </span>
                  <span class="summary-value">{{ formatPrice(shippingFee) }}</span>
                </div>

                <div class="summary-divider">
                  <hr>
                </div>

                <div class="summary-item total">
                  <strong class="summary-label">Tổng cộng</strong>
                  <strong class="summary-value gradient-text">{{ formatPrice(total) }}</strong>
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
                       @click="selectAddress(address.id)"
                       @dblclick="!isMobile && !address.is_default && setDefaultAddress(address.id)">
                    <div class="address-content">
                      <div class="d-flex align-items-start">
                        <div class="flex-grow-1">
                          <!-- Sử dụng formatAddress ở đây -->
                          <p class="mb-1">{{ formatAddress(address) }}</p>
                        </div>
                        <div class="address-badge" v-if="address.is_default">
                          <span class="badge bg-primary">Mặc định</span>
                        </div>
                      </div>
                    </div>
                    <div class="address-actions">
                      <button 
                        class="btn btn-sm btn-outline-danger"
                        @click.stop="deleteAddress(address.id)"
                        v-if="!address.is_default">
                        <i class="fas fa-trash-alt"></i>
                      </button>
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

                <!-- PayPal -->
                <div class="payment-method" @click="selectPayment('paypal')">
                  <div class="d-flex align-items-center">
                    <img src="@/assets/payment/paypal.png" alt="PayPal" class="payment-icon">
                    <div class="payment-details ms-3">
                      <h6>PayPal</h6>
                      <p class="mb-0">Thanh toán qua PayPal</p>
                    </div>
                    <div class="form-check ms-auto">
                      <input 
                        type="radio" 
                        class="form-check-input" 
                        :checked="selectedPaymentMethod === 'paypal'"
                        @change="selectPayment('paypal')"
                      >
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
                <hr>
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
                <i class="material-icons">local_shipping</i>
                <h5 class="mb-0">Thông tin người nhận</h5>
              </div>
              <div class="section-content">
                <div class="recipient-info">
                  <p class="info-item">
                    <strong>Họ tên:</strong> 
                    {{ getSelectedAddress?.recipient_name || 'Chưa có thông tin' }}
                  </p>
                  <p class="info-item">
                    <strong>Số điện thoại:</strong>
                    {{ getSelectedAddress?.recipient_phone || 'Chưa có thông tin' }}
                  </p>
                  <p class="info-item">
                    <strong>Địa chỉ:</strong>
                    {{ getSelectedAddress?.address_line1 || 'Chưa có thông tin' }}
                  </p>
                  <p class="info-item" v-if="getSelectedAddress?.address_line2">
                    <strong>Địa chỉ 2:</strong>
                    {{ getSelectedAddress?.address_line2 }}
                  </p>
                  <p class="info-item">
                    <strong>Thành phố:</strong>
                    {{ getSelectedAddress?.city || 'Chưa có thông tin' }}
                  </p>
                  <p class="info-item">
                    <strong>Quận/Huyện:</strong>
                    {{ getSelectedAddress?.state || 'Chưa có thông tin' }}
                  </p>
                  <p class="info-item mb-0">
                    <strong>Mã bưu điện:</strong>
                    {{ getSelectedAddress?.postal_code || 'Chưa có thông tin' }}
                  </p>
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
                    <!-- Sửa lại phần hiển thị ảnh -->
                    <img 
                      :src="formatImageUrl(item.image)" 
                      :alt="item.name" 
                      class="confirmation-item-image"
                      @error="handleImageError"
                    >
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
            <div class="confirmation-section mb-4">
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
                  <!-- Thêm thông tin chi tiết thanh toán nếu cần -->
                  <div class="payment-details mt-2" v-if="selectedPaymentMethod === 'banking'">
                    <p class="mb-1"><strong>Ngân hàng:</strong> Vietcombank</p>
                    <p class="mb-1"><strong>Số tài khoản:</strong> 1234567890</p>
                    <p class="mb-0"><strong>Chủ tài khoản:</strong> NGUYEN VAN A</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Ghi chú đơn hàng -->
            <div class="confirmation-section">
              <div class="section-title">
                <i class="material-icons">note</i>
                <h5 class="mb-0">Ghi chú đơn hàng</h5>
              </div>
              <div class="section-content">
                <textarea 
                  v-model="orderNote"
                  class="form-control"
                  rows="3"
                  placeholder="Nhập ghi chú cho đơn hàng (không bắt buộc)">
                </textarea>
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
            <!-- Thêm @submit.prevent vào form -->
            <form @submit.prevent="submitNewAddress" class="address-form">
              <!-- Thông tin người nhận -->
              <div class="form-floating mb-3 fade-in">
                <input 
                  v-model="newAddress.recipient_name"
                  type="text"
                  class="form-control custom-input"
                  id="recipientName"
                  required
                  placeholder="Tên người nhận"
                >
                <label for="recipientName">Tên người nhận <span class="text-danger">*</span></label>
              </div>

              <div class="form-floating mb-3 fade-in">
                <input 
                  v-model="newAddress.recipient_phone"
                  type="tel"
                  class="form-control custom-input"
                  id="recipientPhone"
                  required
                  placeholder="Số điện thoại người nhận"
                  pattern="[0-9]{10}"
                >
                <label for="recipientPhone">Số điện thoại <span class="text-danger">*</span></label>
                <small class="text-muted">Vui lòng nhập số điện thoại 10 số</small>
              </div>

              <!-- Tỉnh/Thành phố -->
              <div class="form-floating mb-3 fade-in">
                <select 
                  v-model="selectedProvince"
                  class="form-select custom-select"
                  id="province"
                  required
                  @change="handleProvinceChange"
                >
                  <option value="">Chọn tỉnh/thành phố</option>
                  <option 
                    v-for="province in provinces" 
                    :key="province.code"
                    :value="province.name"
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
                  <option value="">Chọn quận/huyện</option>
                  <option 
                    v-for="district in districts" 
                    :key="district.code"
                    :value="district.name"
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
                  <option value="">Chọn phường/xã</option>
                  <option 
                    v-for="ward in wards" 
                    :key="ward.code"
                    :value="ward.name"
                  >
                    {{ ward.name }}
                  </option>
                </select>
                <label for="ward">Phường/Xã <span class="text-danger">*</span></label>
              </div>

              <!-- Địa ch chi tiết -->
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
                <label for="address2">Địa chỉ bổ sung</label>
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

              <div class="d-flex justify-content-end gap-2">
                <button 
                  type="button" 
                  class="btn btn-light" 
                  data-bs-dismiss="modal"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  class="btn btn-primary"
                  :disabled="isSubmitting"
                >
                  <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-2"></span>
                  {{ isSubmitting ? 'Đang xử lý...' : 'Thêm địa chỉ' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- PayPal Button Container -->
    <div v-if="selectedPaymentMethod === 'paypal'" 
         id="paypal-button-container" 
         class="paypal-button-container mt-3">
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import Swal from 'sweetalert2'
import { Modal } from 'bootstrap' // Thêm import Modal từ bootstrap
// Import axiosInstance
import axiosInstance from '@/utils/axios'

const router = useRouter()
const checkoutItems = ref([])
const addresses = ref([])
const selectedAddress = ref(null)
const shippingFee = ref(30000) // Phí ship cố định

// Thêm các biến cho giảm giá
const discountCode = ref('')
// const discount = ref(0)
const discountAmount = ref(0)
// const subtotal = ref(0)
// const total = ref(0)

const newAddress = ref({
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
  is_default: false
})

const isSubmitting = ref(false)
// const addressModal = ref(null)
const provinces = ref([])
const districts = ref([])
const wards = ref([])
const currentStep = ref(1)
const selectedPaymentMethod = ref(null)
const selectedProvince = ref('')
const selectedDistrict = ref('')
const selectedWard = ref('')
const isExpanded = ref(false)
const orderNote = ref('')
// const userInfo = ref(null)

// Sử dụng discountAmount trong template
const calculateFinalTotal = computed(() => {
  return subtotal.value + shippingFee.value - discountAmount.value
})

onMounted(async () => {
  try {
    // Load provinces ngay khi component được mount
    await loadProvinces()
    
    const checkoutData = JSON.parse(localStorage.getItem('checkoutItems'))
    console.log('Loaded checkout data:', checkoutData)

    if (checkoutData) {
      // Log để debug
      console.log('Checkout items before processing:', checkoutData.items)
      
      checkoutItems.value = checkoutData.items.map(item => ({
        ...item,
        image: item.image_url || item.image // Đảm bảo lấy đúng trường ảnh
      }))
      
      // Log để debug
      console.log('Processed checkout items:', checkoutItems.value)
      
      if (checkoutData.discount) {
        discountAmount.value = checkoutData.discount.amount
        discountCode.value = checkoutData.discount.code
      }

      subtotal.value = checkoutData.subtotal
      shippingFee.value = checkoutData.shipping
      total.value = calculateFinalTotal.value
    }
    
    await fetchAddresses()
  } catch (error) {
    console.error('Error in onMounted:', error)
    Swal.fire({
      icon: 'error',
      title: 'Lỗi',
      text: 'Không thể tải thông tin đơn hàng'
    })
  }
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
const subtotal = ref(0)
const total = ref(0)

const calculateOrderTotal = () => {
  if (!checkoutItems.value || checkoutItems.value.length === 0) {
    return {
      subtotal: 0,
      shipping_fee: shippingFee.value,
      total: 0
    }
  }

  const calculatedSubtotal = checkoutItems.value.reduce((sum, item) => 
    sum + (item.price * item.quantity), 0
  )
  
  return {
    subtotal: calculatedSubtotal,
    shipping_fee: shippingFee.value,
    total: calculatedSubtotal + shippingFee.value
  }
}

// Computed property để theo dõi thay đổi
const orderTotals = computed(() => calculateOrderTotal())

// Watch để cập nhật khi có thay đổi
watch(orderTotals, (newTotals) => {
  subtotal.value = newTotals.subtotal
  shippingFee.value = newTotals.shipping_fee
  total.value = newTotals.total
}, { immediate: true })

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

const validateOrderData = () => {
  if (!selectedAddress.value) {
    throw new Error('Vui lòng chọn địa chỉ giao hàng');
  }

  if (!checkoutItems.value || checkoutItems.value.length === 0) {
    throw new Error('Giỏ hàng trống');
  }

  checkoutItems.value.forEach(item => {
    console.log('Validating item:', item);
    if (!item.product_id || !item.variant_id || !item.quantity) {
      console.error('Invalid item data:', {
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        name: item.name
      });
      throw new Error(`Thông tin sản phẩm không hợp lệ: ${item.name}`);
    }
    
    // Kiểm tra số lượng phải là số dương
    if (parseInt(item.quantity) <= 0) {
      throw new Error(`Số lượng sản phẩm "${item.name}" không hợp lệ`);
    }
  });
};

const placeOrder = async () => {
  try {
    validateOrderData();

    // Chuẩn bị dữ liệu đơn hàng
    const orderData = {
      addressId: parseInt(selectedAddress.value),
      items: checkoutItems.value.map(item => ({
        productId: parseInt(item.product_id),
        variantId: parseInt(item.variant_id),
        quantity: parseInt(item.quantity)
      }))
    };

    console.log('Sending order data:', orderData);

    const response = await axios({
      method: 'POST',
      url: 'http://localhost:3000/api/orders',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      data: orderData
    });

    if (response.data.orderId) {
      localStorage.removeItem('cartItems');
      localStorage.removeItem('checkoutItems');
      await Swal.fire({
        icon: 'success',
        title: 'Đặt hàng thành công',
        text: 'Cảm ơn bạn đã mua hàng!'
      });
      router.push('/orders');
    }
  } catch (error) {
    console.error('Error placing order:', error);
    Swal.fire({
      icon: 'error',
      title: 'Không thể đặt hàng',
      text: error.response?.data?.message || error.message || 'Vui lòng thử lại sau'
    });
  }
};

// Thêm hàm đóng modal
// const closeAddressModal = () => {
//   if (addressModal.value) {
//     addressModal.value.hide()
//   }
// }

// Sửa lại hàm showAddAddressModal
const showAddAddressModal = () => {
  // Khởi tạo modal mới mỗi lần click
  const modalElement = document.getElementById('addAddressModal')
  if (modalElement) {
    const modal = new Modal(modalElement)
    modal.show()
  } else {
    console.error('Modal element not found')
    Swal.fire({
      icon: 'error', 
      title: 'Lỗi',
      text: 'Không thể mở form thêm địa chỉ. Vui lòng thử lại.'
    })
  }
}

// Sửa lại submitNewAddress để đóng modal sau khi thêm thành công
const submitNewAddress = async () => {
  if (isSubmitting.value) return
  
  try {
    isSubmitting.value = true
    
    // Validate dữ liệu
    if (!newAddress.value.recipient_name) {
      throw new Error('Vui lòng nhập tên người nhận')
    }
    if (!newAddress.value.recipient_phone) {
      throw new Error('Vui lòng nhập số điện thoại')
    }
    if (!newAddress.value.address_line1) {
      throw new Error('Vui lòng nhập địa chỉ chi tiết')
    }
    if (!selectedProvince.value || !provinces.value.length) {
      throw new Error('Vui lòng chọn tỉnh/thành phố')
    }
    if (!selectedDistrict.value || !districts.value.length) {
      throw new Error('Vui lòng chọn quận/huyện')
    }
    if (!selectedWard.value || !wards.value.length) {
      throw new Error('Vui lòng chọn phường/xã')
    }

    // Lấy tên của các địa điểm từ danh sách đã chọn
    const province = provinces.value.find(p => p.name === selectedProvince.value)?.name
    const district = districts.value.find(d => d.name === selectedDistrict.value)?.name
    const ward = wards.value.find(w => w.name === selectedWard.value)?.name

    // Tạo địa chỉ chi tiết có cấu trúc rõ ràng
    const fullAddress = `${newAddress.value.address_line1}, ${ward}, ${district}, ${province}`

    // Chuẩn bị dữ liệu gửi đi
    const addressData = {
      recipient_name: newAddress.value.recipient_name,
      recipient_phone: newAddress.value.recipient_phone,
      address_line1: fullAddress,
      address_line2: newAddress.value.address_line2 || '',
      city: province, // Lưu tên tỉnh/thành phố
      state: district, // Lưu tên quận/huyện
      postal_code: '000000',
      country: 'Vietnam',
      is_default: newAddress.value.is_default || false
    }

    console.log('Sending address data:', addressData)

    const response = await axios.post(
      'http://localhost:3000/api/addresses',
      addressData,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }
    )

    if (response.data) {
      await fetchAddresses()
      
      // Đóng modal
      const modalElement = document.getElementById('addAddressModal')
      if (modalElement) {
        const modal = Modal.getInstance(modalElement)
        if (modal) {
          modal.hide()
        }
      }

      // Reset form
      newAddress.value = {
        recipient_name: '',
        recipient_phone: '',
        address_line1: '',
        address_line2: '',
        is_default: false
      }
      selectedProvince.value = ''
      selectedDistrict.value = ''
      selectedWard.value = ''

      Swal.fire({
        icon: 'success',
        title: 'Thành công',
        text: 'Đã thêm địa chỉ mới'
      })
    }
  } catch (error) {
    console.error('Error adding address:', error)
    Swal.fire({
      icon: 'error',
      title: 'Lỗi',
      text: error.response?.data?.error || error.message || 'Không thể thêm địa chỉ'
    })
  } finally {
    isSubmitting.value = false
  }
}

// Load tỉnh/thành phố
const loadProvinces = async () => {
  try {
    const response = await axiosInstance.get('/location/provinces')
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
    // Reset các giá trị quận/huyện và phường/xã
    selectedDistrict.value = ''
    selectedWard.value = ''
    districts.value = []
    wards.value = []
    
    if (selectedProvince.value) {
      console.log('Selected province:', selectedProvince.value)
      console.log('Available provinces:', provinces.value)
      
      // Lấy thông tin đầy đủ của tỉnh/thành phố đã chọn
      const selectedProvinceData = provinces.value.find(
        p => p.name === selectedProvince.value
      )

      console.log('Selected province data:', selectedProvinceData)

      if (!selectedProvinceData || !selectedProvinceData.code) {
        throw new Error('Không tìm thấy mã tỉnh/thành phố')
      }

      // Gọi API với mã tỉnh/thành phố
      const response = await axiosInstance.get(`/location/districts/${selectedProvinceData.code}`)
      
      if (response.data && response.data.districts) {
        districts.value = response.data.districts
      } else {
        throw new Error('Dữ liệu quận/huyện không hợp lệ')
      }
    }
  } catch (error) {
    console.error('Error loading districts:', error)
    Swal.fire({
      icon: 'error',
      title: 'Lỗi',
      text: 'Không thể tải danh sách quận/huyện'
    })
  }
}

// Tương tự cho handleDistrictChange
const handleDistrictChange = async () => {
  try {
    selectedWard.value = ''
    wards.value = []
    
    if (selectedDistrict.value) {
      // Lấy code của quận/huyện đã chọn
      const districtCode = districts.value.find(
        d => d.name === selectedDistrict.value
      )?.code

      if (!districtCode) {
        throw new Error('Không tìm thấy mã quận/huyện')
      }

      const response = await axiosInstance.get(`/location/wards/${districtCode}`)
      wards.value = response.data.wards
    }
  } catch (error) {
    console.error('Error loading wards:', error)
    Swal.fire({
      icon: 'error',
      title: 'Lỗi',
      text: 'Không thể tải danh sách phường/xã'
    })
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

const toggleAddressDisplay = () => {
  isExpanded.value = !isExpanded.value
}

const displayedAddresses = computed(() => {
  if (isExpanded.value || addresses.value.length <= 3) {
    return addresses.value
  }
  return addresses.value.slice(0, 3)
})

// Computed property để kiểm tra có thể tiếp tục không
const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return checkoutItems.value && checkoutItems.value.length > 0
    case 2:
      return selectedAddress.value
    case 3:
      return selectedPaymentMethod.value
    case 4:
      return true
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

const handleNextStep = async () => {
  if (currentStep.value < 4) {
    if (currentStep.value === 2 && !selectedAddress.value) {
      return
    }
    
    if (currentStep.value === 3) {
      const totals = orderTotals.value  // Sử dụng orderTotals thay vì orderTotal
      subtotal.value = totals.subtotal
      shippingFee.value = totals.shipping_fee
      total.value = totals.total
    }
    
    currentStep.value++
  } else {
    await placeOrder()
  }
}

const selectAddress = (addressId) => {
  selectedAddress.value = addressId;
  console.log('Selected address:', addressId);
}

const selectPayment = (method) => {
// Reset container trước khi load lại
const container = document.getElementById('paypal-button-container');
if (container) {
  container.innerHTML = '';
}

selectedPaymentMethod.value = method;

if (method === 'paypal') {
  // Đợi một chút để container được render
  setTimeout(() => {
    loadPayPalScript();
  }, 100);
}
};

const loadPayPalScript = () => {
  console.log('Starting PayPal script load');
  
  const existingScript = document.querySelector('script[src*="paypal"]');
  if (existingScript) {
    existingScript.remove();
  }

  // Sử dụng Client ID của E-Come 2
  const script = document.createElement('script');
  script.src = `https://www.paypal.com/sdk/js?client-id=AQJDaA3jrv-eoVg5iA9WxVVsnC-KmNnIst0tEaqd5GSiO0PhhCRfErUo6-Ju0BQ8SJauZfgkeNObB29NX&currency=USD`;
  script.async = true;

  script.onload = () => {
    console.log('PayPal script loaded successfully');
    setTimeout(() => {
      initPayPalButton();
    }, 1000);
  };

  script.onerror = (error) => {
    console.error('PayPal script loading error:', error);
    selectedPaymentMethod.value = ''; // Reset payment method
    Swal.fire({
      icon: 'error',
      title: 'Lỗi',
      text: 'Không thể tải PayPal. Vui lòng thử lại sau hoặc chọn phương thức thanh toán khác.'
    });
  };

  document.body.appendChild(script);
};

const initPayPalButton = () => {
  if (!window.paypal) {
    console.error('PayPal SDK not loaded');
    return;
  }

  const container = document.getElementById('paypal-button-container');
  if (!container) {
    console.error('PayPal button container not found');
    return;
  }

  try {
    window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'blue',
        shape: 'rect',
        label: 'paypal'
      },
      createOrder: async (data, actions) => {
        // Convert VND to USD (approximate rate)
        const amountUSD = (total.value / 23000).toFixed(2);
        
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: amountUSD,
              currency_code: 'USD'
            }
          }]
        });
      },
      onApprove: async (data, actions) => {
        try {
          const order = await actions.order.capture();
          console.log('Payment completed', order);
          
          // Lưu đơn hàng
          await placeOrder();
          
          await Swal.fire({
            icon: 'success',
            title: 'Thanh toán thành công',
            text: 'Đơn hàng của bạn đã được xác nhận'
          });
          
          router.push('/order-success');
        } catch (error) {
          console.error('Error capturing order:', error);
          throw error;
        }
      }
    }).render('#paypal-button-container');
  } catch (error) {
    console.error('Error rendering PayPal buttons:', error);
  }
};

const deleteAddress = async (addressId) => {
  try {
    const result = await Swal.fire({
      title: 'Xác nhận xóa',
      text: 'Bạn có chắc chắn muốn xóa địa chỉ này?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#d33'
    });

    if (result.isConfirmed) {
      const token = localStorage.getItem('token');
      await axios({
        method: 'DELETE',
        url: `http://localhost:3000/api/addresses/${addressId}`,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Refresh danh sách địa chỉ
      await fetchAddresses();
      
      Swal.fire({
        icon: 'success',
        title: 'Đã xóa',
        text: 'Địa chỉ đã được xóa thành công'
      });
    }
  } catch (error) {
    console.error('Error deleting address:', error);
    Swal.fire({
      icon: 'error',
      title: 'Lỗi',
      text: 'Không thể xóa địa chỉ. Vui lòng thử lại.'
    });
  }
};

const isMobile = ref(window.innerWidth <= 768);

// Thêm event listener để cập nhật isMobile khi resize window
onMounted(() => {
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth <= 768;
  });
});

// Hàm xử lý set địa chỉ m��c định
const setDefaultAddress = async (addressId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Vui lòng đăng nhập lại');
    }

    // Hiển thị confirm dialog
    const result = await Swal.fire({
      title: 'Xác nhận',
      text: 'Bạn có muốn đặt địa chỉ này làm mặc định?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy'
    });

    if (!result.isConfirmed) return;

    await axios({
      method: 'PUT',
      url: `http://localhost:3000/api/addresses/${addressId}/default`,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Refresh danh sách địa chỉ
    await fetchAddresses();
    
    Swal.fire({
      icon: 'success',
      title: 'Thành công',
      text: 'Đã cập nhật địa chỉ mặc định',
      showConfirmButton: false,
      timer: 1500
    });

  } catch (error) {
    console.error('Error setting default address:', error);
    Swal.fire({
      icon: 'error',
      title: 'Lỗi',
      text: 'Không thể cập nhật địa chỉ mặc định. Vui lòng thử lại.'
    });
  }
};

// Thêm computed property để lấy địa chỉ đã chọn
const getSelectedAddress = computed(() => {
  return addresses.value.find(addr => addr.id === selectedAddress.value);
});

// Hoặc thêm watch để tự động tính lại tổng khi items thay đổi
// Thay thế watch cũ bằng watch mới
watch(checkoutItems, (items) => {
  console.log('Checkout items changed:', items);
}, { deep: true })

// Thêm ref cho orderId nếu chưa có
// const orderId = ref(null);

// Thêm watch để debug
watch(selectedPaymentMethod, (newValue) => {
  console.log('Payment method changed to:', newValue);
  if (newValue === 'paypal') {
    console.log('Loading PayPal script...');
    loadPayPalScript();
  }
});

// Thêm hàm formatImageUrl giống như trong Cart.vue
const formatImageUrl = (imageUrl) => {
  if (!imageUrl) return '/placeholder-image.jpg';
  
  // Nếu đã là đường dẫn đầy đủ, trả về nguyên bản
  if (imageUrl.startsWith('http')) {
    return imageUrl;
  }

  // Đảm bảo đường dẫn bắt đầu bằng /
  if (!imageUrl.startsWith('/')) {
    imageUrl = `/${imageUrl}`;
  }

  // Kiểm tra và thêm prefix nếu cần
  if (!imageUrl.startsWith('/assets/uploads/')) {
    imageUrl = `/assets/uploads/products${imageUrl}`;
  }

  // Thêm base URL
  return `http://localhost:3000${imageUrl}`;
};

// Thêm hàm xử lý lỗi ảnh
const handleImageError = (e) => {
  e.target.src = '/placeholder-image.jpg';
  console.log('Image load error, using placeholder');
};

// Hoàn thiện hàm formatAddress
const formatAddress = (address) => {
  const parts = []
  if (address.recipient_name) parts.push(address.recipient_name)
  if (address.recipient_phone) parts.push(address.recipient_phone)
  
  // Tách địa chỉ thành các phần và nối bằng dấu phẩy
  const addressParts = [
    address.address_line1,
    address.address_line2,
    address.city,
    address.state,
    address.postal_code,
    address.country
  ].filter(Boolean) // Loại bỏ các giá trị rỗng/null
  
  parts.push(addressParts.join(', '))
  
  return parts.join(' | ')
}
</script>

<style scoped>
.checkout-page {  
  background-color: #f8f9fa;
  min-height: 100vh;
}

.checkout-steps {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
}

.step-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
  border: 2px solid #dee2e6;
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
  background-color: #f8f9fa;
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

/* Hiệu ứng mở rộng/thu g����n */
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

.address-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 8px;
}

.address-item {
  position: relative;
}

.address-item:hover .address-actions {
  opacity: 1;
}

.address-actions .btn {
  padding: 4px 8px;
  font-size: 12px;
}

/* Chỉ hiển thị trên desktop */
@media (min-width: 769px) {
  .address-item:not(.active):not(:has(.badge)) {
    position: relative;
  }

  .address-item:not(.active):not(:has(.badge)):hover::after {
    content: 'Nhấp đúp để đặt làm mặc định';
    position: absolute;
    bottom: 5px;
    right: 10px;
    font-size: 0.75rem;
    color: #6c757d;
    opacity: 0.7;
  }
}

.recipient-info {
  display: grid;
  gap: 0.5rem;
}

.info-item {
  display: flex;
  align-items: baseline;
  margin-bottom: 0.5rem;
  color: #4a5568;
}

.info-item strong {
  min-width: 120px;
  color: #2d3748;
}

.payment-details {
  padding: 1rem;
  background: #fff;
  border-radius: 4px;
  border: 1px dashed #e2e8f0;
}

.payment-details p {
  color: #4a5568;
}

.payment-details strong {
  color: #2d3748;
  margin-right: 0.5rem;
}

textarea.form-control {
  border-color: #e2e8f0;
  resize: vertical;
}

textarea.form-control:focus {
  border-color: #4299e1;
  box-shadow: 0 0 0 2px rgba(66, 153, 225, 0.2);
}

.customer-info {
  display: grid;
  gap: 0.5rem;
}

.customer-info .info-item {
  display: flex;
  align-items: baseline;
  margin-bottom: 0.5rem;
  color: #4a5568;
}

.customer-info .info-item strong {
  min-width: 120px;
  color: #2d3748;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.section-title i {
  color: #3b82f6;
}

.section-content {
  background: #f8fafc;
  padding: 1.25rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.paypal-button-container {
  width: 100%;
  max-width: 500px;
  min-height: 150px;
  margin: 0 auto;
}

/* Thêm styles cho ảnh */
.confirmation-item-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
}

/* Thêm style cho trường hợp ảnh lỗi */
.confirmation-item-image[src=''] {
  display: none;
}

.order-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.order-header {
  padding: 1.25rem;
  border-bottom: 1px solid #e2e8f0;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-content i {
  font-size: 1.25rem;
  color: #3b82f6;
}

.header-content h5 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.order-body {
  padding: 1rem;
}

.checkout-item {
  padding: 1rem;
  border-bottom: 1px solid #f1f5f9;
}

.checkout-item:last-child {
  border-bottom: none;
}

.item-container {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.item-image-wrapper {
  flex-shrink: 0;
  width: 100px;
  height: 100px;
  border-radius: 12px;
  overflow: hidden;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-details {
  flex-grow: 1;
}

.item-name {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.item-variant {
  font-size: 0.9rem;
  color: #64748b;
  margin-bottom: 0.75rem;
}

.item-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f8fafc;
  padding: 0.25rem;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.qty-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: white;
  border-radius: 6px;
  color: #64748b;
  transition: all 0.2s ease;
}

.qty-btn:not(:disabled):hover {
  background: #3b82f6;
  color: white;
}

.qty-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.qty-value {
  min-width: 30px;
  text-align: center;
  font-weight: 500;
  color: #1e293b;
}

.item-price {
  font-size: 1.1rem;
  font-weight: 600;
  color: #3b82f6;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .order-card {
    background: #1e293b;
  }

  .order-header {
    border-color: #334155;
  }

  .header-content h5 {
    color: #f1f5f9;
  }

  .checkout-item {
    border-color: #334155;
  }

  .item-name {
    color: #f1f5f9;
  }

  .item-variant {
    color: #94a3b8;
  }

  .quantity-control {
    background: #0f172a;
    border-color: #334155;
  }

  .qty-btn {
    background: #1e293b;
    color: #94a3b8;
  }

  .qty-value {
    color: #f1f5f9;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .item-container {
    flex-direction: column;
    align-items: flex-start;
  }

  .item-image-wrapper {
    width: 100%;
    height: 200px;
  }

  .item-controls {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .item-price {
    align-self: flex-end;
  }
}

.address-text {
  white-space: pre-line;
  margin: 0;
  font-family: inherit;
}
</style>
<template>
  <div class="order-detail-page">
    <div v-if="loading" class="loading-spinner">
      <i class="fas fa-spinner fa-spin fa-3x"></i>
    </div>

    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>

    <div v-else class="order-content">
      <!-- Progress Timeline -->
      <div class="progress-container">
        <div class="progress-bar">
          <div v-for="(step, index) in orderSteps" 
               :key="index"
               class="progress-step"
               :class="{ 
                 'completed': isCompleted(step.status),
                 'active': step.status === currentStatus
               }"
               :data-status="step.status"
               :style="{
                 '--step-color': step.color
               }">
            <div class="step-icon">
              <i :class="step.icon"></i>
            </div>
            <div class="step-label">{{ step.label }}</div>
            <div v-if="step.status === currentStatus" class="step-date">
              {{ formatDate(order.order_info.updated_at) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Order Information -->
      <div class="order-info card">
        <div class="card-header">
          <h5>
            <i class="fas fa-info-circle me-2"></i>
            Đơn hàng #{{ order.order_info.order_id }}
          </h5>
          <div class="status-badge" :class="currentStatus">
            {{ order.order_summary.status_description }}
          </div>
        </div>

        <div class="card-body">
          <div class="info-grid">
            <div class="info-item">
              <i class="fas fa-user"></i>
              <span>Khách hàng:</span>
              <strong>{{ order.order_info.customer_name }}</strong>
            </div>
            <div class="info-item">
              <i class="fas fa-phone"></i>
              <span>Số điện thoại:</span>
              <strong>{{ order.order_info.customer_phone }}</strong>
            </div>
            <div class="info-item">
              <i class="fas fa-calendar"></i>
              <span>Ngày đặt:</span>
              <strong>{{ formatDate(order.order_info.created_at) }}</strong>
            </div>
            <div class="info-item">
              <i class="fas fa-map-marker-alt"></i>
              <span>Địa chỉ:</span>
              <strong>{{ formatAddress }}</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- Order Items -->
      <div class="order-items card">
        <div class="card-header">
          <h5><i class="fas fa-box me-2"></i>Sản phẩm</h5>
        </div>
        <div class="card-body">
          <div v-for="item in order.order_items" 
               :key="item.order_item_id" 
               class="product-item">
            <img :src="item.product_image" :alt="item.product_name" class="product-image">
            <div class="product-info">
              <h6>{{ item.product_name }}</h6>
              <p class="variant">{{ item.variant_name }}</p>
              <div class="brand">
                <img :src="item.brand_logo" :alt="item.brand_name" class="brand-logo">
                {{ item.brand_name }}
              </div>
              <div class="quantity-price">
                <span class="quantity">x{{ item.quantity }}</span>
                <span class="price">{{ formatPrice(item.item_price) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="card-footer">
          <div class="total-section">
            <div class="subtotal">
              <span>Tạm tính:</span>
              <span>{{ formatPrice(order.order_summary.subtotal) }}</span>
            </div>
            <div class="total">
              <span>Tổng cộng:</span>
              <span class="total-amount">{{ formatPrice(order.order_info.total) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="order-actions" v-if="canCancel || canReview">
        <button v-if="canCancel" 
                @click="cancelOrder" 
                class="btn btn-danger">
          <i class="fas fa-times me-2"></i>Hủy đơn hàng
        </button>
        <button v-if="canReview" 
                class="btn btn-primary">
          <i class="fas fa-star me-2"></i>Đánh giá
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true
});

export default {
  setup() {
    const route = useRoute();
    const order = ref(null);
    const loading = ref(true);
    const error = ref(null);

    const orderSteps = [
      { 
        status: 'pending', 
        label: 'Chờ xử lý', 
        icon: 'fas fa-clock',
        color: '#3b82f6' // Blue
      },
      { 
        status: 'processing', 
        label: 'Đang xử lý', 
        icon: 'fas fa-cog fa-spin',
        color: '#8b5cf6' // Purple
      },
      { 
        status: 'shipped', 
        label: 'Đang giao', 
        icon: 'fas fa-truck fa-bounce',
        color: '#f59e0b' // Orange
      },
      { 
        status: 'delivered', 
        label: 'Đã giao', 
        icon: 'fas fa-check-circle',
        color: '#10b981' // Green
      },
      { 
        status: 'cancelled', 
        label: 'Đã hủy', 
        icon: 'fas fa-times-circle',
        color: '#ef4444' // Red
      }
    ];

    // Fetch order details
    const fetchOrderDetails = async () => {
      try {
        loading.value = true;
        const token = localStorage.getItem('token');
        
        const response = await api.get(`/api/orders/${route.params.id}/details`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        order.value = response.data;
      } catch (err) {
        error.value = err.response?.data?.message || 'Có lỗi xảy ra khi tải thông tin đơn hàng';
      } finally {
        loading.value = false;
      }
    };

    // Format methods
    const formatDate = (date) => {
      return new Date(date).toLocaleString('vi-VN');
    };

    const formatPrice = (price) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price);
    };

    const formatAddress = computed(() => {
      if (!order.value?.order_info) return '';
      const info = order.value.order_info;
      return `${info.address_line1}, ${info.city}, ${info.state}, ${info.postal_code}`;
    });

    // Computed properties
    const currentStatus = computed(() => order.value?.order_info?.status);
    
    const progressWidth = computed(() => {
      if (!currentStatus.value) return 0;
      const currentIndex = orderSteps.findIndex(step => step.status === currentStatus.value);
      return ((currentIndex + 1) / orderSteps.length) * 100;
    });

    const canCancel = computed(() => currentStatus.value === 'pending');
    const canReview = computed(() => currentStatus.value === 'delivered');

    const isCompleted = (stepStatus) => {
      const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
      const currentIdx = statusOrder.indexOf(currentStatus.value);
      const stepIdx = statusOrder.indexOf(stepStatus);
      return stepIdx <= currentIdx && currentStatus.value !== 'cancelled';
    };

    // Methods
    const cancelOrder = async () => {
      try {
        await api.post(`/api/orders/${route.params.id}/cancel`);
        await fetchOrderDetails(); // Refresh data
      } catch (err) {
        error.value = err.response?.data?.message || 'Không thể hủy đơn hàng';
      }
    };

    onMounted(() => {
      fetchOrderDetails();
    });

    return {
      order,
      loading,
      error,
      orderSteps,
      currentStatus,
      progressWidth,
      canCancel,
      canReview,
      formatDate,
      formatPrice,
      formatAddress,
      cancelOrder,
      isCompleted,
    };
  }
};
</script>

<style scoped>
.order-detail-page {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
}

.progress-container {
  background: #ffffff;
  padding: 2.5rem 2rem;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  margin: 2rem 0;
  transition: all 0.3s ease;
}

.progress-bar {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
  position: relative;
  padding: 0 2rem;
}

/* Background line */
.progress-bar::before {
  content: '';
  position: absolute;
  top: 28px;
  left: 50px;
  right: 50px;
  height: 2px;
  background: #f1f5f9;
  border-radius: 2px;
}

/* Progress line */
.progress-bar::after {
  content: '';
  position: absolute;
  top: 28px;
  left: 50px;
  height: 2px;
  background: var(--step-color, #3b82f6);
  border-radius: 2px;
  width: v-bind(progressWidth + '%');
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Step styles */
.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  position: relative;
  z-index: 3;
}

.step-icon {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: white;
  border: 2px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.step-icon i {
  font-size: 1.25rem;
  color: #94a3b8;
  transition: all 0.3s ease;
}

.step-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  transition: all 0.3s ease;
}

.step-date {
  font-size: 0.75rem;
  color: #94a3b8;
  opacity: 0;
  transform: translateY(-5px);
  transition: all 0.3s ease;
}

/* Active step */
.progress-step.active .step-icon {
  border-color: var(--step-color);
  transform: scale(1.1);
  box-shadow: 0 0 0 4px rgba(var(--step-color-rgb), 0.1);
}

.progress-step.active .step-icon i {
  color: var(--step-color);
}

.progress-step.active .step-label {
  color: var(--step-color);
  font-weight: 600;
}

.progress-step.active .step-date {
  opacity: 1;
  transform: translateY(0);
}

/* Completed step */
.progress-step.completed .step-icon {
  background: var(--step-color);
  border-color: var(--step-color);
}

.progress-step.completed .step-icon i {
  color: white;
}

/* Status colors */
:root {
  --pending-color: #3b82f6;
  --pending-color-rgb: 59, 130, 246;
  --processing-color: #8b5cf6;
  --processing-color-rgb: 139, 92, 246;
  --shipped-color: #f59e0b;
  --shipped-color-rgb: 245, 158, 11;
  --delivered-color: #10b981;
  --delivered-color-rgb: 16, 185, 129;
  --cancelled-color: #ef4444;
  --cancelled-color-rgb: 239, 68, 68;
}

/* Responsive Design */
@media (max-width: 768px) {
  .progress-container {
    padding: 2rem 1rem;
  }
  
  .progress-bar {
    gap: 1rem;
    padding: 0 1rem;
  }
  
  .step-icon {
    width: 45px;
    height: 45px;
  }
  
  .step-icon i {
    font-size: 1.2rem;
  }
  
  .step-label {
    font-size: 0.75rem;
  }
}

.card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
  margin-bottom: 2rem;
  border: none;
}

.card-header {
  background: linear-gradient(45deg, #f8f9fa, #ffffff);
  border-bottom: 1px solid rgba(0,0,0,0.05);
  padding: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-item {
  display: flex;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  transition: transform 0.3s ease;
}

.product-item:hover {
  transform: translateX(10px);
}

.product-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 1rem;
}

.total-section {
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.total-amount {
  font-size: 1.25rem;
  color: #ef4444;
  font-weight: 700;
}

.order-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@media (max-width: 768px) {
  .progress-container {
    padding: 1rem;
  }
  
  .step-label {
    font-size: 0.75rem;
  }
  
  .product-item {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .product-image {
    margin-right: 0;
    margin-bottom: 1rem;
  }
}
</style>
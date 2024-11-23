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
            {{ currentStatusDescription }}
          </div>
        </div>

        <div class="card-body">
          <div class="info-grid">
            <div class="info-item">
              <i class="fas fa-user"></i>
              <div class="info-content">
                <span>Khách hàng:</span>
                <strong>{{ order.order_info.customer_name }}</strong>
              </div>
            </div>
            <div class="info-item">
              <i class="fas fa-phone"></i>
              <div class="info-content">
                <span>Số điện thoại:</span>
                <strong>{{ order.order_info.customer_phone }}</strong>
              </div>
            </div>
            <div class="info-item">
              <i class="fas fa-calendar"></i>
              <div class="info-content">
                <span>Ngày đặt:</span>
                <strong>{{ formatDate(order.order_info.created_at) }}</strong>
              </div>
            </div>
            <div class="info-item">
              <i class="fas fa-map-marker-alt"></i>
              <div class="info-content">
                <span>Địa chỉ:</span>
                <strong>{{ formatAddress }}</strong>
              </div>
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

<script setup>
import { ref, onMounted, computed, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import api from '@/api';

const route = useRoute();
const order = ref(null);
const loading = ref(true);
const error = ref(null);
const ws = ref(null);

const orderSteps = [
  { 
    status: 'pending', 
    label: 'Chờ xử lý', 
    icon: 'fas fa-clock',
    color: '#3b82f6'
  },
  { 
    status: 'processing', 
    label: 'Đang xử lý', 
    icon: 'fas fa-cog fa-spin',
    color: '#8b5cf6'
  },
  { 
    status: 'shipped', 
    label: 'Đang giao', 
    icon: 'fas fa-truck fa-bounce',
    color: '#f59e0b'
  },
  { 
    status: 'delivered', 
    label: 'Đã giao', 
    icon: 'fas fa-check-circle',
    color: '#10b981'
  },
  { 
    status: 'cancelled', 
    label: 'Đã hủy', 
    icon: 'fas fa-times-circle',
    color: '#ef4444'
  }
];

const statusDescriptions = {
  pending: 'Chờ xử lý',
  processing: 'Đang xử lý',
  shipped: 'Đang giao hàng',
  delivered: 'Đã giao hàng',
  cancelled: 'Đã hủy'
};

const currentStatus = computed(() => order.value?.order_info?.status);

const currentStatusDescription = computed(() => {
  if (!order.value?.order_info?.status) return '';
  return statusDescriptions[order.value.order_info.status] || 'Không xác định';
});

const progressWidth = computed(() => {
  if (!currentStatus.value) return 0;
  const currentIndex = orderSteps.findIndex(step => step.status === currentStatus.value);
  return ((currentIndex + 1) / orderSteps.length) * 100;
});

const canCancel = computed(() => currentStatus.value === 'pending');
const canReview = computed(() => currentStatus.value === 'delivered');

const formatAddress = computed(() => {
  if (!order.value?.order_info) return '';
  const info = order.value.order_info;
  return `${info.address_line1}, ${info.city}, ${info.state}, ${info.postal_code}`;
});

const getStatusDescription = (status) => {
  return statusDescriptions[status] || 'Không xác định';
};

const formatDate = (date) => {
  return new Date(date).toLocaleString('vi-VN');
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
};

const isCompleted = (stepStatus) => {
  const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
  const currentIdx = statusOrder.indexOf(currentStatus.value);
  const stepIdx = statusOrder.indexOf(stepStatus);
  return stepIdx <= currentIdx && currentStatus.value !== 'cancelled';
};

const initWebSocket = () => {
  ws.value = new WebSocket('ws://localhost:3000');
  
  ws.value.onopen = () => {
    console.log('WebSocket Connected');
    ws.value.send(JSON.stringify({
      type: 'subscribe_order',
      orderId: route.params.id
    }));
  };

  ws.value.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'order_update' && data.orderId === route.params.id) {
      if (order.value && order.value.order_info) {
        order.value.order_info.status = data.newStatus;
      }
    }
  };

  ws.value.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws.value.onclose = () => {
    console.log('WebSocket disconnected');
    setTimeout(initWebSocket, 5000);
  };
};

onMounted(() => {
  fetchOrderDetails();
  initWebSocket();
});

onUnmounted(() => {
  if (ws.value) {
    ws.value.close();
  }
});

const fetchOrderDetails = async () => {
  try {
    loading.value = true;
    const response = await api.get(`/api/orders/${route.params.id}/details`);
    order.value = response.data;
  } catch (err) {
    error.value = err.response?.data?.message || 'Có lỗi xảy ra khi tải thông tin đơn hàng';
  } finally {
    loading.value = false;
  }
};

const cancelOrder = async () => {
  try {
    await api.post(`/api/orders/${route.params.id}/cancel`);
    await fetchOrderDetails();
  } catch (err) {
    error.value = err.response?.data?.message || 'Không thể hủy đơn hàng';
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
  opacity: 0.5;
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
  background: #ffffff;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 16px 16px 0 0;
}

.card-header h5 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 600;
  color: #1e293b;
  display: flex;
  align-items: center;
  position: relative;
}

.card-header h5 i {
  font-size: 1.2rem;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-right: 0.75rem;
  transition: transform 0.3s ease;
}

/* Hover effect */
.card-header:hover h5 i {
  transform: translateY(-2px);
}

/* Add subtle animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-header {
  animation: fadeIn 0.3s ease-out;
}

/* Add decorative line under icon */
.card-header h5::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 40px;
  height: 2px;
  background: linear-gradient(to right, #3b82f6, transparent);
  border-radius: 2px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .card-header {
    padding: 1rem;
  }
  
  .card-header h5 {
    font-size: 1rem;
  }
  
  .card-header h5 i {
    font-size: 1rem;
  }
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

/* Status badge variants */
.status-badge.pending {
  background-color: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.status-badge.processing {
  background-color: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.status-badge.shipped {
  background-color: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.status-badge.delivered {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.status-badge.cancelled {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

/* Hover effect */
.status-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* Responsive adjustments */
@media (max-width: 576px) {
  .card-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .status-badge {
    align-self: flex-start;
  }
}

.card-body {
  padding: 1.5rem;
  background: #ffffff;
}

.product-item {
  display: flex;
  padding: 1.25rem;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.product-item:hover {
  background: #f1f5f9;
  transform: translateX(8px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.product-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease;
}

.product-item:hover .product-image {
  transform: scale(1.05);
}

.product-info {
  flex: 1;
  margin-left: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.product-info h6 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
}

.variant {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0 0 0.75rem 0;
  padding: 0.25rem 0.75rem;
  background: #e2e8f0;
  border-radius: 20px;
  display: inline-block;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
}

.brand-logo {
  width: 20px;
  height: 20px;
  object-fit: contain;
  border-radius: 4px;
}

.quantity-price {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.quantity {
  font-size: 0.95rem;
  color: #64748b;
  background: #e2e8f0;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
}

.price {
  font-size: 1.1rem;
  font-weight: 600;
  color: #ef4444;
}

/* Empty state for missing images */
.product-image:not([src]),
.brand-logo:not([src]) {
  background: #e2e8f0;
  position: relative;
}

.product-image:not([src])::after,
.brand-logo:not([src])::after {
  content: '🖼️';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.5rem;
}

/* Responsive design */
@media (max-width: 640px) {
  .product-item {
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 1rem;
  }

  .product-image {
    width: 120px;
    height: 120px;
    margin-bottom: 1rem;
  }

  .product-info {
    margin-left: 0;
  }

  .quantity-price {
    flex-direction: column;
    gap: 0.5rem;
  }

  .brand {
    justify-content: center;
  }
}

/* Animation for hover */
@keyframes softBounce {
  0%, 100% { transform: translateX(8px); }
  50% { transform: translateX(12px); }
}

.product-item:hover {
  animation: softBounce 1s ease infinite;
}

.total-section {
  padding: 1.5rem;
  background: #f8fafc;
  border-radius: 12px;
  margin-top: 1rem;
}

.subtotal, .total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
}

.subtotal {
  border-bottom: 1px dashed #e2e8f0;
  margin-bottom: 0.5rem;
}

.subtotal span {
  color: #64748b;
  font-size: 0.95rem;
}

.total {
  padding-top: 1rem;
}

.total span:first-child {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.total-amount {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ef4444;
  background: linear-gradient(135deg, #ef4444, #f87171);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  position: relative;
  padding-right: 0.5rem;
}

/* Hover effect */
.total-amount:hover {
  transform: scale(1.05);
  transition: transform 0.3s ease;
}

/* Add subtle animation */
@keyframes pulsePrice {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

.total-amount {
  animation: pulsePrice 2s infinite;
}

/* Responsive design */
@media (max-width: 640px) {
  .total-section {
    padding: 1rem;
  }

  .subtotal span, 
  .total span:first-child {
    font-size: 0.9rem;
  }

  .total-amount {
    font-size: 1.25rem;
  }
}

/* Add decorative elements */
.total-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(to right, #ef4444, #f87171);
  border-radius: 4px 4px 0 0;
  opacity: 0.1;
}

/* Optional: Add a subtle shadow effect */
.total-section {
  position: relative;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05),
              0 2px 4px -1px rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
}

.total-section:hover {
  box-shadow: 0 6px 8px -1px rgba(0, 0, 0, 0.08),
              0 4px 6px -1px rgba(0, 0, 0, 0.05);
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

.card-body {
  padding: 1.5rem;
  background: #ffffff;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

.info-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.info-item:hover {
  background: #f1f5f9;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.info-item i {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 10px;
  margin-right: 1rem;
  font-size: 1rem;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}

/* Icon colors */
.info-item .fa-user { color: #3b82f6; }
.info-item .fa-phone { color: #10b981; }
.info-item .fa-calendar { color: #8b5cf6; }
.info-item .fa-map-marker-alt { color: #ef4444; }

.info-item span {
  color: #64748b;
  font-size: 0.875rem;
  margin-right: 0.5rem;
  white-space: nowrap;
}

.info-item strong {
  color: #1e293b;
  font-weight: 500;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Hover effect for text */
.info-item:hover strong {
  color: #0f172a;
}

/* Responsive design */
@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .info-item {
    padding: 0.875rem;
  }

  .info-item i {
    width: 32px;
    height: 32px;
    font-size: 0.875rem;
  }
}

/* Animation for loading */
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

/* Empty state styling */
.info-item strong:empty {
  width: 150px;
  height: 1rem;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 1000px 100%;
  animation: shimmer 2s infinite linear;
  border-radius: 4px;
}

/* Progress bar animation */
.progress-bar {
  position: relative;
}

.progress-bar::after {
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Animation cho status update */
.progress-bar.updating::after {
  animation: progressUpdate 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes progressUpdate {
  0% {
    opacity: 0.5;
    transform: scaleX(0.98);
  }
  100% {
    opacity: 1;
    transform: scaleX(1);
  }
}

/* Animation cho step icons */
.progress-step {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-step.active {
  animation: stepActivate 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

@keyframes stepActivate {
  0% {
    transform: scale(0.95);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Animation cho status badge */
.status-badge {
  transition: all 0.3s ease;
}

.status-badge.updating {
  animation: badgeUpdate 0.5s ease;
}

@keyframes badgeUpdate {
  0% {
    transform: scale(0.95);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
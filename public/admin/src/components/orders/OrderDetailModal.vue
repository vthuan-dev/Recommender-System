<template>
  <div class="modal-backdrop" v-if="show" @click="$emit('close')">
    <div class="modal-container" @click.stop>
      <!-- Header -->
      <div class="modal-header">
        <div class="header-content">
          <h4>Chi tiết đơn hàng #{{ order?.id }}</h4>
          <div class="status-badge" :class="order?.status">
            {{ getStatusLabel(order?.status) }}
          </div>
        </div>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>

      <div class="modal-body">
        <div v-if="!order" class="loading-state">
          <div class="spinner"></div>
          <span>Đang tải...</span>
        </div>

        <template v-else>
          <div class="info-grid">
            <!-- Customer Info -->
            <div class="info-card">
              <div class="card-header">
                <i class="fas fa-user"></i>
                <h5>Thông tin khách hàng</h5>
              </div>
              <div class="card-content">
                <div class="info-item">
                  <span class="label">Họ tên:</span>
                  <span class="value">{{ order.customer?.name || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Email:</span>
                  <span class="value">{{ order.customer?.email || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Số điện thoại:</span>
                  <span class="value">{{ order.customer?.phone || 'N/A' }}</span>
                </div>
              </div>
            </div>

            <!-- Shipping Info -->
            <div class="info-card">
              <div class="card-header">
                <i class="fas fa-shipping-fast"></i>
                <h5>Địa chỉ giao hàng</h5>
              </div>
              <div class="card-content">
                <div class="info-item">
                  <span class="label">Địa chỉ:</span>
                  <span class="value">{{ order.shipping_address?.address_line1 || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Thành phố:</span>
                  <span class="value">{{ order.shipping_address?.city || 'N/A' }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Mã bưu điện:</span>
                  <span class="value">{{ order.shipping_address?.postal_code || 'N/A' }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.modal-header {
  padding: 16px 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-content h4 {
  margin: 0;
  font-size: 1.25rem;
  color: #1a202c;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #64748b;
  cursor: pointer;
  padding: 4px 8px;
}

.modal-body {
  padding: 24px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.info-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
}

.card-header {
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-header h5 {
  margin: 0;
  font-size: 1rem;
  color: #1a202c;
}

.card-content {
  padding: 16px;
}

.info-item {
  margin-bottom: 12px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.label {
  color: #64748b;
  font-size: 0.875rem;
  margin-right: 8px;
}

.value {
  color: #1a202c;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.processing {
  background: #e0f2fe;
  color: #0369a1;
}

.status-badge.shipped {
  background: #f0fdf4;
  color: #166534;
}

.status-badge.delivered {
  background: #dcfce7;
  color: #15803d;
}

.status-badge.cancelled {
  background: #fee2e2;
  color: #991b1b;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>

<script>
export default {
  name: 'OrderDetailModal',
  props: {
    show: {
      type: Boolean,
      required: true
    },
    order: {
      type: Object,
      required: true
    }
  },
  setup() {
    const getStatusLabel = (status) => {
      const statusMap = {
        'pending': 'Chờ xử lý',
        'processing': 'Đang xử lý', 
        'shipped': 'Đã gửi hàng',
        'delivered': 'Đã giao hàng',
        'cancelled': 'Đã hủy'
      }
      return statusMap[status] || status
    }

    const formatPrice = (price) => {
      if (!price) return '0 ₫'
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price)
    }

    const formatDate = (date) => {
      if (!date) return ''
      return new Date(date).toLocaleString('vi-VN')
    }

    return {
      getStatusLabel,
      formatPrice,
      formatDate
    }
  }
}
</script>
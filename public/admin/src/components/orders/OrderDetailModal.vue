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
          <!-- Summary Cards -->
          <div class="summary-cards">
            <div class="summary-card">
              <div class="card-icon">
                <i class="fas fa-shopping-cart"></i>
              </div>
              <div class="card-info">
                <span class="card-label">Tổng tiền</span>
                <span class="card-value">{{ formatPrice(order.total) }}</span>
              </div>
            </div>

            <div class="summary-card">
              <div class="card-icon">
                <i class="fas fa-box"></i>
              </div>
              <div class="card-info">
                <span class="card-label">Số lượng sản phẩm</span>
                <span class="card-value">{{ order.items?.length || 0 }}</span>
              </div>
            </div>

            <div class="summary-card">
              <div class="card-icon payment-icon" :class="order.payment?.status">
                <i class="fas fa-credit-card"></i>
              </div>
              <div class="card-info">
                <span class="card-label">Thanh toán</span>
                <span class="card-value payment-status" :class="order.payment?.status">
                  {{ getPaymentStatusLabel(order.payment?.status) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Products Table -->
          <div class="products-section">
            <h5 class="section-title">Chi tiết sản phẩm</h5>
            <div class="products-table">
              <table>
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>Phiên bản</th>
                    <th>Thương hiệu</th>
                    <th>Đơn giá</th>
                    <th>Số lượng</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in order.items" :key="item.id">
                    <td class="product-cell">
                      <img :src="item.product_image" :alt="item.product_name">
                      <span>{{ item.product_name }}</span>
                    </td>
                    <td>{{ item.variant_name }}</td>
                    <td>{{ item.brand_name }}</td>
                    <td>{{ formatPrice(item.price) }}</td>
                    <td>{{ item.quantity }}</td>
                    <td>{{ formatPrice(item.subtotal) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Payment Info -->
          <div class="payment-section">
            <h5 class="section-title">Thông tin thanh toán</h5>
            <div class="payment-details">
              <div class="payment-row">
                <span class="label">Phương thức:</span>
                <span class="value">{{ order.payment?.method || 'N/A' }}</span>
              </div>
              <div class="payment-row">
                <span class="label">Trạng thái:</span>
                <span class="value" :class="order.payment?.status">
                  {{ getPaymentStatusLabel(order.payment?.status) }}
                </span>
              </div>
              <div class="payment-row">
                <span class="label">Ngày thanh toán:</span>
                <span class="value">{{ formatDate(order.payment?.date) }}</span>
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
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  animation: modal-slide-in 0.3s ease-out;
}

.modal-header {
  padding: 20px 24px;
  background: linear-gradient(to right, #f8fafc, #f1f5f9);
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-content h4 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 600;
  color: #1e293b;
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #f1f5f9;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.close-btn:hover {
  background: #e2e8f0;
  color: #475569;
}

.modal-body {
  padding: 24px;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}

.summary-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid #e2e8f0;
  transition: transform 0.2s, box-shadow 0.2s;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: #f8fafc;
  color: #3b82f6;
}

.card-info {
  flex: 1;
}

.card-label {
  display: block;
  font-size: 0.875rem;
  color: #64748b;
  margin-bottom: 4px;
}

.card-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1e293b;
}

/* Products Section */
.products-section {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  margin-bottom: 24px;
  overflow: hidden;
}

.section-title {
  padding: 16px 24px;
  margin: 0;
  font-size: 1.1rem;
  color: #1e293b;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.products-table {
  padding: 16px;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 500;
  color: #64748b;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

td {
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
}

.product-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.product-cell img {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
}

/* Status Badges */
.status-badge {
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.processing {
  background: #dbeafe;
  color: #1d4ed8;
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

/* Payment Section */
.payment-section {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.payment-details {
  padding: 20px;
}

.payment-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 0;
}

.payment-row .label {
  width: 140px;
  color: #64748b;
  font-size: 0.875rem;
}

.payment-row .value {
  flex: 1;
  color: #1e293b;
  font-weight: 500;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: #64748b;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes modal-slide-in {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

    const getPaymentStatusLabel = (status) => {
      const paymentStatusMap = {
        'pending': 'Chờ thanh toán',
        'completed': 'Đã thanh toán',
        'failed': 'Thanh toán thất bại',
        'refunded': 'Đã hoàn tiền'
      }
      return paymentStatusMap[status] || 'Không xác định'
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
      getPaymentStatusLabel,
      formatPrice,
      formatDate
    }
  }
}
</script>
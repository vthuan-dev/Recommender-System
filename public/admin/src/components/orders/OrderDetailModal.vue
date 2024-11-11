<template>
    <div class="modal-wrapper" v-if="show">
      <div class="modal">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Chi tiết đơn hàng #{{ order?.id }}</h5>
              <button type="button" class="btn-close" @click="$emit('close')"></button>
            </div>
            
            <div class="modal-body">
              <!-- Thông tin khách hàng -->
              <div class="customer-info section">
                <h6>Thông tin khách hàng</h6>
                <div class="info-grid">
                  <div class="info-item">
                    <span class="label">Tên khách hàng:</span>
                    <span>{{ order?.customer_name }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">Ngày đặt:</span>
                    <span>{{ formatDate(order?.created_at) }}</span>
                  </div>
                </div>
              </div>
  
              <!-- Địa chỉ giao hàng -->
              <div class="shipping-info section">
                <h6>Địa chỉ giao hàng</h6>
                <p>
                  {{ order?.address?.address_line1 }}
                  {{ order?.address?.address_line2 ? `, ${order.address.address_line2}` : '' }}<br>
                  {{ order?.address?.city }}, {{ order?.address?.state }}<br>
                  {{ order?.address?.postal_code }}, {{ order?.address?.country }}
                </p>
              </div>
  
              <!-- Chi tiết sản phẩm -->
              <div class="order-items section">
                <h6>Sản phẩm</h6>
                <table class="table">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Biến thể</th>
                      <th>Số lượng</th>
                      <th>Đơn giá</th>
                      <th>Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in order?.items" :key="item.id">
                      <td>{{ item.product_name }}</td>
                      <td>{{ item.variant_name || '-' }}</td>
                      <td>{{ item.quantity }}</td>
                      <td>{{ formatPrice(item.price) }}</td>
                      <td>{{ formatPrice(item.price * item.quantity) }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="4" class="text-end"><strong>Tổng cộng:</strong></td>
                      <td><strong>{{ formatPrice(order?.totalPrice) }}</strong></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
            
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="$emit('close')">Đóng</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'OrderDetailModal',
    props: {
      show: {
        type: Boolean,
        default: false
      },
      order: {
        type: Object,
        default: null
      }
    },
    methods: {
      formatDate(date) {
        if (!date) return '';
        return new Date(date).toLocaleDateString('vi-VN', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      },
      formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(price);
      }
    }
  }
  </script>
  
  <style scoped>
  .modal-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1050;
  }
  
  .modal-dialog {
    width: 90%;
    max-width: 800px;
    margin: 1.75rem auto;
  }
  
  .section {
    margin-bottom: 1.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #eee;
  }
  
  .section:last-child {
    border-bottom: none;
  }
  
  .section h6 {
    margin-bottom: 1rem;
    color: #2c3e50;
    font-weight: 600;
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }
  
  .info-item {
    display: flex;
    flex-direction: column;
  }
  
  .label {
    font-size: 0.875rem;
    color: #666;
    margin-bottom: 0.25rem;
  }
  
  .table {
    margin-bottom: 0;
  }
  
  .table th {
    background: #f8f9fa;
    font-weight: 600;
  }
  
  .text-end {
    text-align: right;
  }
  </style>
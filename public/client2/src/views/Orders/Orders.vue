<template>
  <div class="order-management">
    <!-- Tabs để lọc đơn hàng theo trạng thái -->
    <div class="order-tabs">
      <div class="container">
        <ul class="nav nav-tabs">
          <li class="nav-item" v-for="tab in orderTabs" :key="tab.status">
            <button 
              class="nav-link" 
              :class="{ active: currentTab === tab.status }"
              @click="filterOrders(tab.status)"
            >
              <i :class="tab.icon"></i>
              {{ tab.label }}
              <span class="badge bg-secondary ms-2" v-if="getOrderCount(tab.status)">
                {{ getOrderCount(tab.status) }}
              </span>
            </button>
          </li>
        </ul>
      </div>
    </div>

    <!-- Danh sách đơn hàng -->
    <div class="container py-4">
      <div class="order-list">
        <!-- Loading state -->
        <div class="text-center py-5" v-if="loading">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Đang tải...</span>
          </div>
        </div>

        <!-- Empty state -->
        <div class="text-center py-5" v-else-if="filteredOrders.length === 0">
          <i class="fas fa-box-open fa-3x text-muted mb-3"></i>
          <h5>Không có đơn hàng nào</h5>
          <p class="text-muted">Bạn chưa có đơn hàng nào trong mục này</p>
          <router-link to="/products" class="btn btn-primary">
            Tiếp tục mua sắm
          </router-link>
        </div>

        <!-- Order items -->
        <div class="order-item card mb-3" v-else v-for="order in filteredOrders" :key="order.id" @click="goToOrderDetail(order.id)" :class="{ 'clickable-card': true }">
          <div class="card-header d-flex justify-content-between align-items-center">
            <div>
              <span class="order-id">Đơn hàng #{{ order.id }}</span>
              <span class="text-muted ms-2">{{ formatDate(order.created_at) }}</span>
            </div>
            <div class="status-badge" :class="getStatusClass(order.status)">
              {{ order.statusDescription }}
            </div>
          </div>
          
          <div class="card-body">
            <div class="order-products">
              <div v-for="item in order.items" :key="item.id" class="product-item">
                <img :src="item.image_url" :alt="item.product_name" class="product-image">
                <div class="product-info">
                  <h6>{{ item.product_name }}</h6>
                  <p class="text-muted mb-0">
                    {{ item.variant_name }} x {{ item.quantity }}
                  </p>
                  <p class="price">{{ formatPrice(item.price * item.quantity) }}</p>
                </div>
              </div>
            </div>

            <div class="order-footer mt-3 pt-3 border-top d-flex justify-content-between align-items-center">
              <div class="order-total">
                <span class="text-muted">Tổng tiền:</span>
                <span class="h5 mb-0 ms-2">{{ formatPrice(order.total) }}</span>
              </div>
              
              <div class="order-actions" @click.stop>
                <button 
                  v-if="order.status === 'pending'"
                  class="btn btn-outline-danger btn-sm"
                  @click="cancelOrder(order.id)"
                  :disabled="loading"
                >
                  <i class="fas fa-times me-1"></i>
                  {{ loading ? 'Đang xử lý...' : 'Hủy đơn' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal đánh giá sản phẩm -->
    <div class="modal fade" id="reviewModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Đánh giá sản phẩm</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="submitReview">
              <div class="mb-3">
                <label class="form-label">Đánh giá</label>
                <div class="rating">
                  <i 
                    v-for="star in 5" 
                    :key="star"
                    class="fas fa-star"
                    :class="{ active: star <= review.rating }"
                    @click="review.rating = star"
                  ></i>
                </div>
              </div>
              <div class="mb-3">
                <label class="form-label">Nhận xét</label>
                <textarea 
                  class="form-control" 
                  v-model="review.comment"
                  rows="3"
                  required
                ></textarea>
              </div>
              <button type="submit" class="btn btn-primary w-100">
                Gửi đánh giá
              </button>
            </form>
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
import { useRouter } from 'vue-router'

// Tạo instance axios với cấu hình cụ thể
const api = axios.create({
  baseURL: 'http://localhost:3000',
  withCredentials: true
})

export default {
  name: 'OrderManagement',
  setup() {
    const orders = ref([])
    const loading = ref(true)
    const currentTab = ref('all')
    const review = ref({ rating: 0, comment: '' })
    const selectedOrder = ref(null)
    const router = useRouter()

    const orderTabs = [
      { status: 'all', label: 'Tất cả', icon: 'fas fa-list' },
      { status: 'pending', label: 'Chờ xử lý', icon: 'fas fa-clock' },
      { status: 'processing', label: 'Đang xử lý', icon: 'fas fa-cog' },
      { status: 'shipped', label: 'Đang giao', icon: 'fas fa-truck' },
      { status: 'delivered', label: 'Đã giao', icon: 'fas fa-check-circle' },
      { status: 'cancelled', label: 'Đã hủy', icon: 'fas fa-times-circle' }
    ]

    const filteredOrders = computed(() => {
      if (currentTab.value === 'all') return orders.value
      return orders.value.filter(order => order.status === currentTab.value)
    })

    const fetchOrders = async () => {
      try {
        loading.value = true;
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        // Sử dụng api instance thay vì axios
        const response = await api.get('/api/orders', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        orders.value = response.data;
      } catch (error) {
        console.error('Error fetching orders:', error);
        if (error.response?.status === 401) {
          router.push('/login');
        }
      } finally {
        loading.value = false;
      }
    };

    const cancelOrder = async (orderId) => {
      try {
        const result = await Swal.fire({
          title: 'Xác nhận hủy đơn',
          text: 'Bạn có chắc muốn hủy đơn hàng này?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Hủy đơn',
          cancelButtonText: 'Không',
          confirmButtonColor: '#dc3545',
        });

        if (result.isConfirmed) {
          const token = localStorage.getItem('token');
          await api.post(`/api/orders/${orderId}/cancel`, {}, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          // Cập nhật lại danh sách đơn hàng
          await fetchOrders();
          
          Swal.fire({
            title: 'Thành công',
            text: 'Đã hủy đơn hàng thành công',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
          });
        }
      } catch (error) {
        Swal.fire({
          title: 'Lỗi',
          text: error.response?.data?.message || 'Không thể hủy đơn hàng',
          icon: 'error'
        });
      }
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const formatPrice = (price) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price)
    }

    const getStatusClass = (status) => {
      const classes = {
        pending: 'bg-warning',
        processing: 'bg-info',
        shipped: 'bg-primary',
        delivered: 'bg-success',
        cancelled: 'bg-danger'
      }
      return classes[status] || 'bg-secondary'
    }

    const getOrderCount = (status) => {
      if (status === 'all') return orders.value.length
      return orders.value.filter(order => order.status === status).length
    }

    const filterOrders = (status) => {
      currentTab.value = status
      // Thêm animation khi chuyển tab
      const orderList = document.querySelector('.order-list')
      if (orderList) {
        orderList.style.opacity = '0'
        orderList.style.transform = 'translateY(10px)'
        setTimeout(() => {
          orderList.style.opacity = '1'
          orderList.style.transform = 'translateY(0)'
        }, 100)
      }
    }

    const goToOrderDetail = (orderId) => {
      router.push(`/orders/${orderId}`);
    };

    onMounted(() => {
      fetchOrders()
    })

    return {
      orders,
      loading,
      currentTab,
      orderTabs,
      filteredOrders,
      review,
      selectedOrder,
      cancelOrder,
      formatDate,
      formatPrice,
      getStatusClass,
      getOrderCount,
      filterOrders,
      goToOrderDetail
    }
  }
}
</script>
<style scoped>
.order-management {
  background-color: #f8f9fa;
  min-height: 100vh;
}

.order-tabs {
  background: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: all 0.3s ease;
}

.nav-tabs {
  border: none;
  padding: 1rem;
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.nav-tabs::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.nav-tabs .nav-item {
  margin: 0;
}

.nav-tabs .nav-link {
  border: none;
  color: #64748b;
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  font-weight: 500;
  transition: all 0.3s ease;
  background: transparent;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.nav-tabs .nav-link:hover {
  color: #3b82f6;
  background: #f1f5f9;
  transform: translateY(-1px);
}

.nav-tabs .nav-link.active {
  color: #3b82f6;
  background: #eff6ff;
  font-weight: 600;
}

.nav-tabs .nav-link i {
  font-size: 1rem;
  transition: all 0.3s ease;
}

.nav-tabs .nav-link:hover i {
  transform: scale(1.1);
}

.nav-tabs .nav-link .badge {
  padding: 0.35em 0.65em;
  font-size: 0.75em;
  font-weight: 600;
  border-radius: 20px;
  background: #e2e8f0;
  color: #64748b;
  transition: all 0.3s ease;
}

.nav-tabs .nav-link.active .badge {
  background: #3b82f6;
  color: white;
}

/* Animation cho active tab */
.nav-tabs .nav-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: #3b82f6;
  transition: all 0.3s ease;
  transform: translateX(-50%);
}

.nav-tabs .nav-link.active::after {
  width: 80%;
}

/* Animation cho icons trong processing tab */
.nav-tabs .nav-link .fa-cog {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .nav-tabs {
    padding: 0.75rem;
    gap: 0.25rem;
  }

  .nav-tabs .nav-link {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
  }
  
  .nav-tabs .nav-link i {
    font-size: 0.875rem;
  }
}

/* Smooth scroll behavior */
.nav-tabs {
  scroll-behavior: smooth;
}

/* Hover effect */
.nav-link {
  position: relative;
  overflow: hidden;
}

.nav-link::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100%;
  height: 100%;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 12px;
  transform: translate(-50%, -50%) scale(0);
  transition: transform 0.3s ease;
}

.nav-link:hover::before {
  transform: translate(-50%, -50%) scale(1);
}

.order-item {
  background: white;
  border: none;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
  transform: translateY(0);
  overflow: hidden;
}

.order-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 20px -8px rgba(0,0,0,0.15);
}

.card-header {
  background: linear-gradient(45deg, #f8f9fa, #ffffff);
  border-bottom: 1px solid rgba(0,0,0,0.05);
  padding: 1rem 1.5rem;
}

.order-id {
  font-weight: 700;
  color: #2563eb;
  position: relative;
  padding-left: 20px;
}

.order-id::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 8px;
  height: 8px;
  background: #2563eb;
  border-radius: 50%;
  transform: translateY(-50%);
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  animation: badgePulse 2s infinite;
}

@keyframes badgePulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.product-item {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-radius: 12px;
  background: #f8fafc;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
}

.product-item:hover {
  background: #f1f5f9;
  transform: translateX(8px);
}

.product-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.product-item:hover .product-image {
  transform: scale(1.1) rotate(3deg);
}

.product-info h6 {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.5rem;
  transition: color 0.3s ease;
}

.product-item:hover .product-info h6 {
  color: #2563eb;
}

.price {
  background: linear-gradient(45deg, #ef4444, #dc2626);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
  font-size: 1.1rem;
  margin-top: 0.5rem;
}

.order-footer {
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 0 0 16px 16px;
}

.order-total {
  display: flex;
  align-items: center;
}

.order-total .h5 {
  color: #2563eb;
  font-weight: 700;
  animation: totalPulse 2s infinite;
}

@keyframes totalPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.btn {
  padding: 0.5rem 1.25rem;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255,255,255,0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.6s ease, height 0.6s ease;
}

.btn:hover::before {
  width: 300px;
  height: 300px;
}

.spinner-border {
  animation: spinner 1s linear infinite, pulse 2s infinite;
}

@keyframes spinner {
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
  100% { opacity: 1; transform: scale(1); }
}

.fa-box-open {
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

@media (max-width: 768px) {
  .order-item {
    margin: 0.5rem;
  }
  
  .product-item {
    flex-direction: column;
    text-align: center;
  }
  
  .product-image {
    margin-bottom: 1rem;
    margin-right: 0;
  }
  
  .order-footer {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
}

.clickable-card {
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.clickable-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.1);
}

.clickable-card::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    45deg,
    rgba(255,255,255,0.1) 0%,
    rgba(255,255,255,0.2) 50%,
    rgba(255,255,255,0.1) 100%
  );
  transform: translateX(-100%);
  transition: transform 0.6s ease;
}

.clickable-card:hover::after {
  transform: translateX(100%);
}

/* Prevent text selection when clicking */
.clickable-card {
  user-select: none;
  -webkit-user-select: none;
}

/* Make sure buttons remain clickable */
.order-actions {
  position: relative;
  z-index: 2;
}

/* Add ripple effect on mobile */
@media (max-width: 768px) {
  .clickable-card:active {
    transform: scale(0.98);
    background-color: rgba(0,0,0,0.02);
  }
}
</style>

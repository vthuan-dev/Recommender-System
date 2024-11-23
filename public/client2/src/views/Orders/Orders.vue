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
        <div class="order-item card mb-3" v-else v-for="order in filteredOrders" :key="order.id">
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
              
              <div class="order-actions">
                <!-- Nút xem chi tiết -->
                <router-link 
                  :to="`/orders/${order.id}`"
                  class="btn btn-outline-primary btn-sm me-2"
                >
                  <i class="fas fa-eye me-1"></i>
                  Chi tiết
                </router-link>

                <!-- Nút hủy đơn - chỉ hiện khi trạng thái là pending -->
                <button 
                  v-if="order.status === 'pending'"
                  class="btn btn-outline-danger btn-sm"
                  @click="cancelOrder(order.id)"
                >
                  <i class="fas fa-times me-1"></i>
                  Hủy đơn
                </button>

                <!-- Nút đánh giá - chỉ hiện khi đơn hàng đã giao -->
                <button 
                  v-if="order.status === 'delivered' && !order.isReviewed"
                  class="btn btn-outline-success btn-sm"
                  @click="openReviewModal(order)"
                >
                  <i class="fas fa-star me-1"></i>
                  Đánh giá
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
          cancelButtonText: 'Không'
        })

        if (result.isConfirmed) {
          await axios.post(`/api/orders/${orderId}/cancel`)
          await fetchOrders()
          Swal.fire('Thành công', 'Đã hủy đơn hàng', 'success')
        }
      } catch (error) {
        Swal.fire('Lỗi', error.response?.data?.message || 'Không thể hủy đơn hàng', 'error')
      }
    }

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
      getOrderCount
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
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  margin-bottom: 1rem;
}

.nav-tabs {
  border: none;
  padding: 1rem 0;
}

.nav-tabs .nav-link {
  border: none;
  color: #6c757d;
  padding: 0.5rem 1rem;
  margin-right: 1rem;
  border-radius: 20px;
}

.nav-tabs .nav-link.active {
  background-color: #e9ecef;
  color: #0d6efd;
}

.nav-tabs .nav-link i {
  margin-right: 0.5rem;
}

.order-item {
  background: white;
  border: none;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.order-id {
  font-weight: 600;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  color: white;
  font-size: 0.875rem;
}

.product-item {
  display: flex;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid #dee2e6;
}

.product-item:last-child {
  border-bottom: none;
}

.product-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  margin-right: 1rem;
}

.product-info {
  flex: 1;
}

.product-info h6 {
  margin-bottom: 0.25rem;
}

.price {
  color: #dc3545;
  font-weight: 600;
  margin-top: 0.5rem;
}

.rating {
  display: flex;
  gap: 0.5rem;
}

.rating i {
  cursor: pointer;
  color: #dee2e6;
}

.rating i.active {
  color: #ffc107;
}

@media (max-width: 768px) {
  .nav-tabs {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }

  .nav-tabs .nav-link {
    white-space: nowrap;
  }

  .order-actions {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>

<template>
  <div class="orders-manager">
    <!-- Header Section -->
    <div class="header-section">
      <h1 class="page-title">Quản lý đơn hàng</h1>
      <div class="order-stats">
        <div class="stat-card" v-for="stat in orderStats" :key="stat.status">
          <div :class="['stat-icon', stat.class]">
            <i :class="stat.icon"></i>
          </div>
          <div class="stat-info">
            <h3>{{ stat.count }}</h3>
            <p>{{ stat.label }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter Section -->
    <div class="filter-section">
      <div class="search-box">
        <input 
          type="text" 
          v-model="filters.search" 
          placeholder="Tìm kiếm đơn hàng..."
          @input="handleSearch"
        >
        <i class="fas fa-search"></i>
      </div>

      <div class="filter-options">
        <select v-model="filters.status" @change="handleFilterChange">
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chờ xử lý</option>
          <option value="processing">Đang xử lý</option>
          <option value="shipped">Đã gửi hàng</option>
          <option value="delivered">Đã giao hàng</option>
          <option value="cancelled">Đã hủy</option>
        </select>

        <select v-model="filters.dateRange" @change="handleFilterChange">
          <option value="all">Tất cả thời gian</option>
          <option value="today">Hôm nay</option>
          <option value="week">Tuần này</option>
          <option value="month">Tháng này</option>
        </select>
      </div>
    </div>

    <!-- Orders Table -->
    <div class="orders-table-wrapper">
      <table class="orders-table" v-if="orders.length > 0">
        <thead>
          <tr>
            <th>Mã đơn</th>
            <th>Khách hàng</th>
            <th>Ngày đặt</th>
            <th>Tổng tiền</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id">
            <td>#{{ order.id }}</td>
            <td>{{ order.customer_name }}</td>
            <td>{{ formatDate(order.created_at) }}</td>
            <td>{{ formatPrice(order.total_price) }}</td>
            <td>
              <span :class="['status-badge', order.status]">
                {{ getStatusLabel(order.status) }}
              </span>
            </td>
            <td>
              <div class="action-buttons">
                <button 
                  class="btn-view"
                  @click="openDetailModal(order)"
                  title="Xem chi tiết"
                >
                  <i class="fas fa-eye"></i>
                </button>
                <button 
                  class="btn-status" 
                  @click="updateStatus(order)"
                  :disabled="order.status === 'delivered' || order.status === 'cancelled'"
                  title="Cập nhật trạng thái"
                >
                  <i class="fas fa-sync-alt"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else-if="loading" class="loading-state">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Đang tải dữ liệu...</p>
      </div>

      <div v-else class="no-orders">
        <i class="fas fa-box-open"></i>
        <p>Không có đơn hàng nào</p>
      </div>
    </div>

    <!-- Pagination -->
    <div class="pagination" v-if="totalPages > 1">
      <button 
        :disabled="currentPage === 1"
        @click="changePage(currentPage - 1)"
      >
        <i class="fas fa-chevron-left"></i>
      </button>
      <span>Trang {{ currentPage }}/{{ totalPages }}</span>
      <button 
        :disabled="currentPage === totalPages"
        @click="changePage(currentPage + 1)"
      >
        <i class="fas fa-chevron-right"></i>
      </button>
    </div>

    <OrderDetailModal 
      v-if="showDetailModal"
      :order="selectedOrder"
      @close="closeDetailModal"
    />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { orderService } from '../../services/orderService'
import OrderDetailModal from './OrderDetailModal.vue'
import Swal from 'sweetalert2'
import debounce from 'lodash/debounce'

export default {
  name: 'OrderManager',
  components: {
    OrderDetailModal
  },
  setup() {
    const orders = ref([])
    const loading = ref(true)
    const currentPage = ref(1)
    const totalPages = ref(1)
    const showDetailModal = ref(false)
    const selectedOrder = ref(null)
    const orderStats = ref([
      { status: 'pending', label: 'Chờ xử lý', count: 0, icon: 'fas fa-clock', class: 'pending' },
      { status: 'processing', label: 'Đang xử lý', count: 0, icon: 'fas fa-cog', class: 'processing' },
      { status: 'shipped', label: 'Đã gửi hàng', count: 0, icon: 'fas fa-truck', class: 'shipped' },
      { status: 'delivered', label: 'Đã giao hàng', count: 0, icon: 'fas fa-check-circle', class: 'delivered' },
      { status: 'cancelled', label: 'Đã hủy', count: 0, icon: 'fas fa-times-circle', class: 'cancelled' }
    ])

    const filters = ref({
      search: '',
      status: '',
      dateRange: 'all'
    })

    const fetchOrders = async () => {
      try {
        loading.value = true
        const response = await orderService.getOrders({
          page: currentPage.value,
          ...filters.value
        })
        
        orders.value = response.orders
        totalPages.value = response.totalPages

        // Cập nhật số liệu thống kê
        if (response.orderStats) {
          orderStats.value = orderStats.value.map(stat => ({
            ...stat,
            count: response.orderStats[stat.status] || 0
          }))
        }

      } catch (error) {
        console.error('Error fetching orders:', error)
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.'
        })
      } finally {
        loading.value = false
      }
    }

    const handleSearch = debounce(() => {
      currentPage.value = 1
      fetchOrders()
    }, 300)

    const handleFilterChange = () => {
      currentPage.value = 1
      fetchOrders()
    }

    const changePage = (page) => {
      currentPage.value = page
      fetchOrders()
    }

    const openDetailModal = (order) => {
      selectedOrder.value = order
      showDetailModal.value = true
    }

    const closeDetailModal = () => {
      showDetailModal.value = false
      selectedOrder.value = null
    }

    onMounted(() => {
      fetchOrders()
    })

    const formatPrice = (price) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price)
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    return {
      orders,
      loading,
      currentPage,
      totalPages,
      filters,
      orderStats,
      formatPrice,
      formatDate,
      fetchOrders,
      handleSearch,
      handleFilterChange,
      changePage,
      openDetailModal,
      closeDetailModal
    }
  }
}
</script>

<style scoped>
.orders-manager {
  padding: 20px;
}

/* Header Section */
.header-section {
  margin-bottom: 30px;
}

.page-title {
  font-size: 24px;
  margin-bottom: 20px;
}

.order-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

/* Filter Section */
.filter-section {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 20px;
}

.search-box {
  position: relative;
  flex: 1;
}

.search-box input {
  width: 100%;
  padding: 10px 40px 10px 15px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.search-box i {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #718096;
}

.filter-options {
  display: flex;
  gap: 10px;
}

.filter-options select {
  padding: 8px 15px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
}

/* Table Styles */
.orders-table-wrapper {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  overflow-x: auto;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
}

.orders-table th,
.orders-table td {
  padding: 15px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.orders-table th {
  background: #f8fafc;
  font-weight: 600;
}

/* Status Badge */
.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.pending {
  background: #fff8e1;
  color: #f57c00;
}

.status-badge.processing {
  background: #e3f2fd;
  color: #1976d2;
}

.status-badge.shipped {
  background: #e8f5e9;
  color: #388e3c;
}

.status-badge.delivered {
  background: #e8f5e9;
  color: #388e3c;
}

.status-badge.cancelled {
  background: #fbe9e7;
  color: #d32f2f;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-view,
.btn-status {
  padding: 8px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-view {
  background: #e3f2fd;
  color: #1976d2;
}

.btn-status {
  background: #e8f5e9;
  color: #388e3c;
}

.btn-view:hover,
.btn-status:hover {
  transform: translateY(-2px);
}

.btn-status:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Loading & Empty States */
.loading-state,
.no-orders {
  padding: 40px;
  text-align: center;
  color: #718096;
}

.loading-state i,
.no-orders i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 20px;
}

.pagination button {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>

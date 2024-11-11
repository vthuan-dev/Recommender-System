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
            <td data-label="Mã đơn">#{{ order.id }}</td>
            <td data-label="Khách hàng">{{ order.customer_name }}</td>
            <td data-label="Ngày đặt">{{ formatDate(order.created_at) }}</td>
            <td data-label="Tổng tiền">{{ formatPrice(order.total_price) }}</td>
            <td data-label="Trạng thái">
              <span :class="['status-badge', order.status]">
                {{ getStatusLabel(order.status) }}
              </span>
            </td>
            <td data-label="Thao tác">
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
      :show="showDetailModal"
      :order="selectedOrder"
      @close="closeDetailModal"
    />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { orderService } from '@/services/orderService'
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

    const updateStatus = async (order) => {
      try {
        let newStatus;
        
        // Hiển thị dialog chọn trạng thái
        const { value: selectedStatus } = await Swal.fire({
          title: 'Cập nhật trạng thái',
          input: 'select',
          inputOptions: {
            'pending': 'Chờ xử lý',
            'processing': 'Đang xử lý', 
            'shipped': 'Đã gửi hàng',
            'delivered': 'Đã giao hàng',
            'cancelled': 'Hủy đơn'
          },
          inputValue: order.status,
          showCancelButton: true,
          confirmButtonText: 'Cập nhật',
          cancelButtonText: 'Hủy'
        });

        if (!selectedStatus) {
          return; // Người dùng đã hủy
        }

        newStatus = selectedStatus;

        // Hiển thị cảnh báo đặc biệt khi chọn hủy đơn
        if (newStatus === 'cancelled') {
          const confirmCancel = await Swal.fire({
            title: 'Xác nhận hủy đơn',
            text: 'Đơn hàng sẽ được hủy và số lượng sản phẩm sẽ được hoàn trả về kho. Bạn có chắc chắn?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Đồng ý',
            cancelButtonText: 'Không'
          });

          if (!confirmCancel.isConfirmed) {
            return;
          }
        }

        // Gọi API cập nhật trạng thái
        await orderService.updateOrderStatus(order.id, newStatus);
        await fetchOrders(); // Refresh danh sách
        
        // Hiển thị thông báo thành công
        const message = newStatus === 'cancelled' 
          ? 'Đã hủy đơn hàng và hoàn trả số lượng về kho'
          : 'Đã cập nhật trạng thái đơn hàng';
          
        Swal.fire('Thành công', message, 'success');

      } catch (error) {
        console.error('Error updating order status:', error);
        Swal.fire('Lỗi', error.message || 'Không thể cập nhật trạng thái đơn hàng', 'error');
      }
    };

    // Thêm hàm helper để kiểm tra thời gian
    const isInDateRange = (date, range) => {
      const orderDate = new Date(date);
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch(range) {
        case 'today':
          return orderDate >= startOfDay;
          
        case 'week':
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay()); // Đầu tuần (Chủ nhật)
          startOfWeek.setHours(0, 0, 0, 0);
          return orderDate >= startOfWeek;
          
        case 'month':
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          return orderDate >= startOfMonth;
          
        default: // 'all'
          return true;
      }
    };

    // Sửa lại hàm fetchOrders
    const fetchOrders = async () => {
      try {
        loading.value = true;
        const response = await orderService.getOrders({
          page: currentPage.value,
          status: filters.value.status // Chỉ gửi status lên server
        });

        // Lọc theo thời gian ở frontend
        let filteredOrders = response.orders;
        if (filters.value.dateRange !== 'all') {
          filteredOrders = response.orders.filter(order => 
            isInDateRange(order.created_at, filters.value.dateRange)
          );
        }

        orders.value = filteredOrders;
        
        // Cập nhật số liệu thống kê dựa trên dữ liệu đã lọc
        const stats = {
          total: filteredOrders.length,
          pending: filteredOrders.filter(o => o.status === 'pending').length,
          processing: filteredOrders.filter(o => o.status === 'processing').length,
          shipped: filteredOrders.filter(o => o.status === 'shipped').length,
          delivered: filteredOrders.filter(o => o.status === 'delivered').length,
          cancelled: filteredOrders.filter(o => o.status === 'cancelled').length
        };

        // Cập nhật orderStats
        orderStats.value = orderStats.value.map(stat => ({
          ...stat,
          count: stats[stat.status] || 0
        }));

        // Tính lại tổng số trang dựa trên dữ liệu đã lọc
        totalPages.value = Math.ceil(filteredOrders.length / 10); // 10 là limit mỗi trang

      } catch (error) {
        console.error('Error fetching orders:', error);
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Không thể tải danh sách đơn hàng'
        });
      } finally {
        loading.value = false;
      }
    };

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

    const openDetailModal = async (order) => {
      try {
        selectedOrder.value = order
        showDetailModal.value = true
        
        // Fetch full order details
        const response = await orderService.getOrderDetail(order.id)
        if (response) {
          selectedOrder.value = response
        }
      } catch (error) {
        console.error('Error fetching order details:', error)
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Không thể tải chi tiết đơn hàng'
        })
      }
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
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }

    // Thêm hàm cập nhật thống kê
    const updateOrderStats = async () => {
      try {
        const response = await orderService.getOrderStats()
        if (response.orderStats) {
          orderStats.value = orderStats.value.map(stat => ({
            ...stat,
            count: response.orderStats[stat.status] || 0
          }))
        }
      } catch (error) {
        console.error('Error updating stats:', error)
      }
    }
        return {
        orders,
        loading,
        currentPage,
        totalPages,
        filters,
        orderStats,
        selectedOrder,
        showDetailModal,
        formatPrice,
        formatDate,
        fetchOrders,
        handleSearch,
        handleFilterChange,
        changePage,
        openDetailModal,
        closeDetailModal,
        getStatusLabel,
        updateStatus
        }
  }
}
</script>

<style scoped>
.orders-manager {
  padding: 24px;
  background: #f8f9fa;
  min-height: 100vh;
}

/* Header Section */
.header-section {
  margin-bottom: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 24px;
}

.order-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 24px;
}

.stat-card {
  background: white;
  padding: 24px;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

/* Màu sắc cho các trạng thái */
.stat-icon.pending { background: #fff3e0; color: #f57c00; }
.stat-icon.processing { background: #e3f2fd; color: #1976d2; }
.stat-icon.shipped { background: #e8f5e9; color: #2e7d32; }
.stat-icon.delivered { background: #e0f2f1; color: #00796b; }
.stat-icon.cancelled { background: #fbe9e7; color: #d32f2f; }

.stat-info h3 {
  font-size: 28px;
  font-weight: 600;
  margin: 0;
  color: #2d3748;
}

.stat-info p {
  margin: 4px 0 0;
  color: #718096;
  font-size: 14px;
}

/* Filter Section */
.filter-section {
  background: white;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  margin-bottom: 24px;
  display: flex;
  gap: 20px;
  align-items: center;
}

.search-box {
  flex: 1;
  position: relative;
}

.search-box input {
  width: 100%;
  padding: 12px 48px 12px 20px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 15px;
  transition: border-color 0.2s ease;
}

.search-box input:focus {
  border-color: #4299e1;
  outline: none;
}

.search-box i {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  color: #718096;
  font-size: 16px;
}

.filter-options select {
  padding: 12px 20px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  font-size: 15px;
  min-width: 180px;
  cursor: pointer;
}

/* Table Styles */
.orders-table-wrapper {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  overflow: hidden;
}

.orders-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.orders-table th {
  background: #f8fafc;
  padding: 16px 24px;
  font-weight: 600;
  color: #4a5568;
  font-size: 15px;
  border-bottom: 2px solid #e2e8f0;
}

.orders-table td {
  padding: 16px 24px;
  border-bottom: 1px solid #edf2f7;
  color: #2d3748;
}

.orders-table tbody tr:hover {
  background: #f8fafc;
}

/* Status Badge */
.status-badge {
  padding: 8px 16px;
  border-radius: 24px;
  font-size: 14px;
  font-weight: 500;
  display: inline-block;
}

.status-badge.pending { background: #fff3e0; color: #f57c00; }
.status-badge.processing { background: #e3f2fd; color: #1976d2; }
.status-badge.shipped { background: #e8f5e9; color: #2e7d32; }
.status-badge.delivered { background: #e0f2f1; color: #00796b; }
.status-badge.cancelled { background: #fbe9e7; color: #d32f2f; }

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 12px;
}

.btn-view,
.btn-status {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-view {
  background: #e3f2fd;
  color: #1976d2;
}

.btn-status {
  background: #e8f5e9;
  color: #2e7d32;
}

.btn-view:hover,
.btn-status:hover {
  transform: translateY(-2px);
  filter: brightness(95%);
}

/* Loading & Empty States */
.loading-state,
.no-orders {
  padding: 48px;
  text-align: center;
  color: #718096;
}

.loading-state i,
.no-orders i {
  font-size: 32px;
  margin-bottom: 16px;
  color: #4299e1;
}

/* Pagination */
.pagination {
  margin-top: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.pagination button {
  padding: 10px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  color: #4a5568;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.pagination button:hover:not(:disabled) {
  border-color: #4299e1;
  color: #4299e1;
}

.pagination span {
  color: #4a5568;
  font-weight: 500;
}

/* Responsive Styles */
@media (max-width: 1024px) {
  .order-stats {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .stat-card {
    padding: 16px;
  }

  .stat-info h3 {
    font-size: 24px;
  }
}

@media (max-width: 768px) {
  .orders-manager {
    padding: 16px;
  }

  .page-title {
    font-size: 24px;
    margin-bottom: 16px;
  }

  .filter-section {
    flex-direction: column;
    padding: 16px;
    gap: 16px;
  }

  .filter-options {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }

  .filter-options select {
    width: 100%;
  }

  /* Điều chỉnh bảng cho mobile */
  .orders-table {
    display: block;
    overflow-x: auto;
  }

  .orders-table thead {
    display: none; /* Ẩn header của bảng */
  }

  .orders-table tbody tr {
    display: block;
    padding: 16px;
    border-bottom: 1px solid #edf2f7;
    position: relative;
  }

  .orders-table td {
    display: block;
    padding: 8px 0;
    border: none;
    text-align: left;
  }

  /* Thêm label cho mỗi cột */
  .orders-table td:before {
    content: attr(data-label);
    font-weight: 600;
    color: #4a5568;
    display: block;
    font-size: 13px;
    margin-bottom: 4px;
  }

  /* Điều chỉnh cột trạng thái và thao tác */
  .orders-table td:nth-last-child(-n+2) {
    display: inline-block;
    margin-top: 8px;
  }

  .action-buttons {
    position: absolute;
    top: 16px;
    right: 16px;
  }

  .btn-view,
  .btn-status {
    width: 36px;
    height: 36px;
  }

  /* Điều chỉnh status badge */
  .status-badge {
    padding: 6px 12px;
    font-size: 13px;
  }

  /* Điều chỉnh phân trang */
  .pagination {
    flex-wrap: wrap;
    gap: 12px;
  }

  .pagination button {
    padding: 8px 12px;
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  .order-stats {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 12px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }

  .stat-info h3 {
    font-size: 20px;
  }

  .stat-info p {
    font-size: 13px;
  }

  .search-box input {
    padding: 10px 40px 10px 16px;
    font-size: 14px;
  }

  .filter-options select {
    padding: 10px 16px;
    font-size: 14px;
  }
}
</style>

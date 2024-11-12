<template>
  <div class="customers-page">
    <!-- Header Section -->
    <div class="page-header">
      <div class="header-content">
        <h1>Quản lý khách hàng</h1>
        <p>Quản lý và theo dõi thông tin khách hàng</p>
      </div>
      <div class="header-actions">
        <button class="btn-export" @click="exportCustomers">
          <i class="fas fa-file-export"></i>
          Xuất Excel
        </button>
        <button class="btn-primary" @click="openAddCustomerModal">
          <i class="fas fa-user-plus"></i>
          Thêm khách hàng
        </button>
      </div>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon" style="background: rgba(59, 130, 246, 0.1); color: #3B82F6">
          <i class="fas fa-users"></i>
        </div>
        <div class="stat-content">
          <div class="stat-header">
            <h3>{{ totalCustomers }}</h3>
            <div class="stat-badge success">
              <i class="fas fa-arrow-up"></i>
              12%
            </div>
          </div>
          <p>Tổng khách hàng</p>
        </div>
      </div>
      <!-- Similar cards for active and new customers -->
    </div>

    <!-- Search & Filter Bar -->
    <div class="filter-bar">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input 
          type="text"
          v-model="searchQuery"
          placeholder="Tìm kiếm theo tên, email, số điện thoại..."
          @input="handleSearch"
        >
      </div>
      
      <div class="filter-actions">
        <div class="filter-group">
          <label>Trạng thái</label>
          <select v-model="statusFilter">
            <option value="">Tất cả</option>
            <option value="active">Đang hoạt động</option>
            <option value="inactive">Không hoạt động</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Sắp xếp</label>
          <select v-model="sortBy">
            <option value="newest">Mới nhất</option>
            <option value="oldest">Cũ nhất</option>
            <option value="name">Tên A-Z</option>
            <option value="orders">Số đơn hàng</option>
          </select>
        </div>

        <button class="btn-reset" @click="resetFilters">
          <i class="fas fa-redo-alt"></i>
        </button>
      </div>
    </div>

    <!-- Table Section -->
    <div class="table-section">
      <div class="table-header">
        <div class="selected-count" v-if="selectedCustomers.length">
          {{ selectedCustomers.length }} khách hàng đã chọn
          <button class="btn-delete" @click="deleteSelected">
            <i class="fas fa-trash"></i> Xóa đã chọn
          </button>
        </div>
      </div>

      <div class="table-container">
        <table class="customers-table">
          <!-- Table content -->
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.customers-page {
  padding: 2rem;
  background: #f9fafb;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 2rem;
}

.header-content h1 {
  font-size: 1.875rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}

.header-content p {
  color: #6b7280;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.filter-bar {
  background: white;
  padding: 1rem;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-box {
  flex: 1;
  max-width: 400px;
  position: relative;
}

.search-box input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.search-box i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.table-section {
  background: white;
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  overflow: hidden;
}

.customers-table {
  width: 100%;
  border-collapse: collapse;
}

.customers-table th {
  background: #f9fafb;
  padding: 1rem;
  text-align: left;
  font-weight: 500;
  color: #4b5563;
  border-bottom: 1px solid #e5e7eb;
}

.customers-table td {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.customer-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.customer-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.active {
  background: #dcfce7;
  color: #166534;
}

.status-badge.inactive {
  background: #fee2e2;
  color: #991b1b;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #f3f4f6;
}

@media (max-width: 768px) {
  .customers-page {
    padding: 1rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .filter-bar {
    flex-direction: column;
    gap: 1rem;
  }
  
  .search-box {
    max-width: 100%;
  }
}
</style>

<script>
import { customerService } from '@/services/customerService';

export default {
  data() {
    return {
      customers: []
    };
  },
  async created() {
    try {
      this.customers = await customerService.getCustomers();
    } catch (error) {
      console.error('Lỗi khi lấy danh sách khách hàng:', error);
    }
  }
};
</script>
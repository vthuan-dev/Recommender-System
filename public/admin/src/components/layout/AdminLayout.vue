<!-- src/components/Layout/AdminLayout.vue -->
<template>
  <div class="admin-layout">
    <!-- Sidebar -->
    <div :class="['sidebar', {'sidebar-mobile': isSidebarOpen}]">
      <div class="sidebar-header">
        <div class="logo-container">
          <i class="fas fa-shield-alt"></i>
          <span>Admin Portal</span>
        </div>
        <button class="sidebar-close" @click="toggleSidebar" title="Đóng menu">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="user-info">
        <div class="user-avatar">
          <i class="fas fa-user"></i>
        </div>
        <div class="user-details">
          <h5>{{ fullname }}</h5>
          <span>Administrator</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div 
          class="nav-item"
          :class="{ active: $route.path === '/admin/dashboard' }"
          @click="navigateTo('Dashboard')"
        >
          <i class="fas fa-chart-line"></i>
          <span>Thống kê</span>
        </div>

        <div 
          class="nav-item"
          :class="{ active: $route.path === '/admin/users' }"
          @click="navigateTo('UserManagement')"
        >
          <i class="fas fa-users"></i>
          <span>Quản lý người dùng</span>
        </div>

        <div 
          class="nav-item"
          :class="{ active: $route.path === '/admin/products' }"
          @click="navigateTo('ProductManager')"
        >
          <i class="fas fa-box"></i>
          <span>Sản phẩm</span>
        </div>

        <div 
          class="nav-item"
          :class="{ active: $route.path === '/admin/orders' }"
          @click="navigateTo('Orders')"
        >
          <i class="fas fa-shopping-cart"></i>
          <span>Đơn hàng</span>
        </div>

        <div 
          class="nav-item"
          :class="{ active: $route.path === '/admin/reviews' }"
          @click="navigateTo('ReviewManagement')"
        >
          <i class="fas fa-star"></i>
          <span>Đánh giá sản phẩm</span>
        </div>

        <div 
          class="nav-item"
          :class="{ active: $route.path === '/admin/settings' }"
          @click="navigateTo('Settings')"
        >
          <i class="fas fa-cog"></i>
          <span>Cài đặt</span>
        </div>

        <div @click="logout" class="nav-item logout-btn">
          <i class="fas fa-sign-out-alt"></i>
          <span>Đăng xuất</span>
        </div>
      </nav>
    </div>

    <!-- Main Content -->
    <div class="main-content">
      <nav class="top-navbar">
        <button class="menu-toggle" @click="toggleSidebar">
          <i class="fas fa-bars"></i>
        </button>

        <div class="navbar-right">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input type="text" placeholder="Tìm kiếm...">
          </div>

          <div class="navbar-actions">
            <button class="action-btn">
              <i class="fas fa-bell"></i>
              <span class="notification-badge">3</span>
            </button>
            <button class="action-btn">
              <i class="fas fa-envelope"></i>
              <span class="notification-badge">5</span>
            </button>
          </div>
        </div>
      </nav>

      <!-- Page Content -->
      <main class="page-content">
        <router-view></router-view>
      </main>
    </div>
  </div>
</template>

<script>
import Swal from 'sweetalert2'

export default {
  name: 'AdminLayout',
  data() {
    return {
      fullname: localStorage.getItem('fullname') || 'Admin User',
      isSidebarOpen: false,
      isUserMenuOpen: false
    }
  },
  methods: {
    async navigateTo(routeName) {
      try {
        if (this.isSidebarOpen) {
          this.toggleSidebar();
        }
        
        if (this.$route.name === routeName) {
          return;
        }

        await this.$router.push({ 
          name: routeName 
        }).catch(err => {
          if (err.name !== 'NavigationDuplicated') {
            throw err;
          }
        });

      } catch (error) {
        console.error('Navigation error:', error);
      }
    },
    toggleSidebar() {
      this.isSidebarOpen = !this.isSidebarOpen;
    },
    toggleUserMenu() {
      this.isUserMenuOpen = !this.isUserMenuOpen;
    },
    async logout() {
      try {
        const result = await Swal.fire({
          title: 'Xác nhận đăng xuất?',
          text: 'Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Đăng xuất',
          cancelButtonText: 'Hủy',
          customClass: {
            popup: 'custom-swal-popup',
            title: 'custom-swal-title',
            icon: 'custom-swal-icon',
            content: 'custom-swal-content',
            confirmButton: 'custom-swal-confirm-button',
            cancelButton: 'custom-swal-cancel-button',
            actions: 'custom-swal-actions'
          },
          buttonsStyling: false,
          reverseButtons: true,
          showClass: {
            popup: 'swal2-show'
          },
          hideClass: {
            popup: 'swal2-hide'
          }
        });

        if (result.isConfirmed) {
          const response = await fetch('/api/admin/logout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            credentials: 'include'
          });

          localStorage.removeItem('adminToken');
          localStorage.removeItem('fullname');
          localStorage.removeItem('role');

          await Swal.fire({
            icon: 'success',
            title: 'Đăng xuất thành công!',
            text: 'Hẹn gặp lại bạn...',
            timer: 1500,
            timerProgressBar: true,
            showConfirmButton: false,
            customClass: {
              popup: 'custom-swal-popup',
              title: 'custom-swal-title',
              icon: 'custom-swal-icon',
              content: 'custom-swal-content'
            },
            showClass: {
              popup: 'animate__animated animate__fadeInDown animate__faster'
            },
            hideClass: {
              popup: 'animate__animated animate__fadeOutUp animate__faster'
            }
          });

          await this.$router.replace({ name: 'SignIn' });
        }
      } catch (error) {
        console.error('Logout error:', error);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('fullname');
        localStorage.removeItem('role');

        await Swal.fire({
          icon: 'info',
          title: 'Đã có lỗi xảy ra',
          text: 'Nhưng bạn đã được đăng xuất thành công',
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: 'custom-swal-popup',
            title: 'custom-swal-title',
            icon: 'custom-swal-icon',
            content: 'custom-swal-content'
          }
        });
        
        await this.$router.replace({ name: 'SignIn' });
      }
    }
  }
}
</script>

<style scoped>
.admin-layout {
  display: flex;
  min-height: 100vh;
}

/* Sidebar Styles */
.sidebar {
  width: 280px;
  background: linear-gradient(180deg, #2C3E50 0%, #3498DB 100%);
  color: white;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  position: fixed;
  height: 100vh;
  left: 0;
  top: 0;
  z-index: 1000;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.logo-container i {
  font-size: 2rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  margin-bottom: 2rem;
}

.user-avatar {
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.user-details h5 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.user-details span {
  font-size: 0.875rem;
  opacity: 0.8;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  color: white;
  text-decoration: none;
  border-radius: 12px;
  transition: all 0.3s ease;
  cursor: pointer;
  user-select: none;
}

.nav-item:hover, .nav-item.active {
  background: rgba(255, 255, 255, 0.1);
  transform: translateX(5px);
}

.nav-item i {
  font-size: 1.25rem;
  width: 24px;
  text-align: center;
}

.logout-btn {
  margin-top: auto;
  background: rgba(255, 59, 48, 0.1);
  border: none;
  cursor: pointer;
  color: white;
}

.logout-btn:hover {
  background: rgba(255, 59, 48, 0.2);
}

/* Main Content Styles */
.main-content {
  flex: 1;
  margin-left: 280px;
  transition: all 0.3s ease;
}

.top-navbar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(229, 231, 235, 0.5);
}

.menu-toggle {
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #2C3E50;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.menu-toggle:hover {
  background: rgba(44, 62, 80, 0.1);
  transform: scale(1.05);
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.search-box {
  position: relative;
  width: 300px;
}

.search-box input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.875rem;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
}

.search-box input:focus {
  outline: none;
  border-color: #3498DB;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
  background: white;
}

.search-box i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #718096;
  font-size: 1rem;
  pointer-events: none;
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.action-btn {
  position: relative;
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #2C3E50;
  cursor: pointer;
  padding: 0.75rem;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: rgba(44, 62, 80, 0.1);
  transform: translateY(-2px);
}

.notification-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: linear-gradient(45deg, #E53E3E, #ED8936);
  color: white;
  font-size: 0.75rem;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translate(25%, -25%);
  border: 2px solid white;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-content {
  padding: 2rem;
  background: #f8fafc;
  min-height: calc(100vh - 74px);
}

/* Responsive Styles */
@media (max-width: 1024px) {
  .sidebar {
    transform: translateX(-100%);
  }

  .sidebar-mobile {
    transform: translateX(0);
  }

  .main-content {
    margin-left: 0;
  }

  .menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .search-box {
    width: 250px;
  }
}

@media (max-width: 768px) {
  .top-navbar {
    padding: 0.75rem 1.5rem;
  }

  .navbar-right {
    gap: 1rem;
  }

  .search-box {
    display: none;
  }

  .action-btn {
    padding: 0.5rem;
  }
}

@media (max-width: 480px) {
  .sidebar {
    width: 100%;
  }

  .top-navbar {
    padding: 0.75rem 1rem;
  }

  .navbar-actions {
    gap: 0.75rem;
  }

  .action-btn {
    font-size: 1.1rem;
  }

  .sidebar-close {
    width: 36px;
    height: 36px;
  }

  .sidebar-close i {
    font-size: 1.4rem;
  }
}

/* Thêm/cập nhật CSS cho nút đóng */
.sidebar-close {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.sidebar-close:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

.sidebar-close i {
  font-size: 1.2rem;
}

/* Thêm styles cho submenu */
.nav-group {
  position: relative;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  color: #e2e8f0;
  text-decoration: none;
  transition: all 0.3s;
  cursor: pointer;
}

.submenu-arrow {
  position: absolute;
  right: 1rem;
  transition: transform 0.3s;
}

.submenu {
  background: rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.sub-item {
  padding-left: 3rem;
  font-size: 0.9rem;
}

.sub-item i {
  font-size: 0.85rem;
}

.nav-item:hover,
.nav-item.active {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.sub-item:hover,
.sub-item.active {
  background: rgba(255, 255, 255, 0.05);
}

/* Animation cho submenu */
.submenu-enter-active,
.submenu-leave-active {
  transition: max-height 0.3s ease-in-out;
  overflow: hidden;
}

.submenu-enter-from,
.submenu-leave-to {
  max-height: 0;
}

.submenu-enter-to,
.submenu-leave-from {
  max-height: 400px;
}

/* Thêm styles cho biểu tượng thống kê */
.nav-item i.fa-chart-line {
  color: #4CAF50;
}

.nav-item:hover i.fa-chart-line,
.nav-item.active i.fa-chart-line {
  color: white;
}
</style>

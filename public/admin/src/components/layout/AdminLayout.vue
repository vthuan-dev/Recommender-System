<!-- src/components/Layout/AdminLayout.vue -->
<template>
  <div class="admin-layout">
    <nav v-if="isAuthenticated" class="navbar navbar-dark bg-primary">
      <div class="container-fluid">
        <router-link to="/dashboard" class="navbar-brand">
          Admin Dashboard
        </router-link>
        
        <ul class="navbar-nav me-auto mb-2 mb-lg-0 d-flex flex-row">
          <li class="nav-item px-2">
            <router-link to="/dashboard" class="nav-link">
              <i class="fas fa-chart-line me-2"></i>Thống kê
            </router-link>
          </li>
          <li class="nav-item px-2">
            <router-link to="/products" class="nav-link">
              <i class="fas fa-box me-2"></i>Sản phẩm
            </router-link>
          </li>
          <li class="nav-item px-2">
            <router-link to="/orders" class="nav-link">
              <i class="fas fa-shopping-cart me-2"></i>Đơn hàng
            </router-link>
          </li>
          <li class="nav-item px-2">
            <router-link to="/customers" class="nav-link">
              <i class="fas fa-users me-2"></i>Khách hàng
            </router-link>
          </li>
        </ul>

        <div class="d-flex align-items-center">
          <span class="text-white me-3">Xin chào, {{ fullname }}</span>
          <button class="btn btn-outline-light" @click="logout">
            <i class="fas fa-sign-out-alt"></i> Đăng xuất
          </button>
        </div>
      </div>
    </nav>

    <main class="container-fluid py-4">
      <router-view></router-view>
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.navbar {
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0,0,0,.1);
}

.nav-link {
  color: rgba(255,255,255,.8) !important;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  margin: 0 0.2rem;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #fff !important;
  background-color: rgba(255,255,255,.1);
}

.navbar-brand {
  font-size: 1.25rem;
  font-weight: 500;
}
</style>

<script>
export default {
  name: 'AdminLayout',
  data() {
    return {
      fullname: localStorage.getItem('fullname') || 'Admin User'
    }
  },
  computed: {
    isAuthenticated() {
      return !!localStorage.getItem('adminToken')
    }
  },
  methods: {
    logout() {
      localStorage.removeItem('adminToken')
      localStorage.removeItem('fullname')
      this.$router.push('/admin/sign-in')
    }
  }
}
</script>

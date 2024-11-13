<template>
  <header class="header-wrapper">
    <!-- Top bar -->
    <div class="top-bar">
      <div class="container">
        <div class="d-flex justify-content-between align-items-center">
          <!-- Contact Info -->
          <div class="contact-info d-none d-md-flex align-items-center">
            <a href="tel:1900xxxx" class="top-link">
              <i class="fas fa-phone-alt"></i>
              <span>1900 xxxx</span>
            </a>
            <a href="mailto:support@tstore.com" class="top-link">
              <i class="fas fa-envelope"></i>
              <span>support@tstore.com</span>
            </a>
          </div>
          
          <!-- Quick Links -->
          <div class="quick-links">
            <a href="/track-order" class="top-link">
              <i class="fas fa-truck"></i>
              <span>Theo dõi đơn hàng</span>
            </a>
            <a href="/stores" class="top-link">
              <i class="fas fa-map-marker-alt"></i>
              <span>Hệ thống cửa hàng</span>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Header -->
    <div class="main-header">
      <div class="container">
        <div class="header-content">
          <!-- Logo -->
          <router-link to="/" class="logo">
            <i class="fas fa-microchip"></i>
            <span>T-Store</span>
          </router-link>

          <!-- Search Bar -->
          <div class="search-container">
            <div class="search-box">
              <input 
                type="text" 
                v-model="searchQuery"
                @keyup.enter="handleSearch"
                placeholder="Tìm kiếm sản phẩm..."
              >
              <button @click="handleSearch">
                <i class="fas fa-search"></i>
              </button>
            </div>
          </div>

          <!-- User Actions -->
          <div class="user-actions">
            <!-- Wishlist -->
            <router-link to="/wishlist" class="action-btn">
              <div class="icon-wrapper">
                <i class="fas fa-heart"></i>
                <span v-if="wishlistCount" class="badge">{{ wishlistCount }}</span>
              </div>
              <span class="label">Yêu thích</span>
            </router-link>

            <!-- Cart -->
            <router-link to="/cart" class="action-btn">
              <div class="icon-wrapper">
                <i class="fas fa-shopping-cart"></i>
                <span v-if="cartCount" class="badge">{{ cartCount }}</span>
              </div>
              <span class="label">Giỏ hàng</span>
            </router-link>

            <!-- User Menu -->
            <template v-if="!isLoggedIn">
              <router-link to="/login" class="auth-btn login">
                Đăng nhập
              </router-link>
              <router-link to="/register" class="auth-btn register">
                Đăng ký
              </router-link>
            </template>

            <div v-else class="user-menu">
              <button class="user-btn" @click="toggleUserMenu">
                <i class="fas fa-user-circle"></i>
                <span>{{ username }}</span>
                <i class="fas fa-chevron-down"></i>
              </button>
              <div class="dropdown-menu" :class="{ 'show': showUserMenu }">
                <router-link to="/profile" class="dropdown-item">
                  <i class="fas fa-user"></i>
                  <span>Tài khoản của tôi</span>
                </router-link>
                <router-link to="/orders" class="dropdown-item">
                  <i class="fas fa-shopping-bag"></i>
                  <span>Đơn hàng</span>
                </router-link>
                <router-link to="/addresses" class="dropdown-item">
                  <i class="fas fa-map-marker-alt"></i>
                  <span>Sổ địa chỉ</span>
                </router-link>
                <div class="dropdown-divider"></div>
                <a @click="logout" class="dropdown-item text-danger">
                  <i class="fas fa-sign-out-alt"></i>
                  <span>Đăng xuất</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

export default {
  name: 'HeaderComponent',
  setup() {
    const store = useStore()
    const router = useRouter()
    const searchQuery = ref('')
    const showUserMenu = ref(false)

    const isLoggedIn = computed(() => store.getters.isAuthenticated)
    const username = computed(() => {
      const user = store.getters.currentUser
      return user ? user.fullname : ''
    })
    const cartCount = computed(() => store.getters.cartCount)
    const wishlistCount = computed(() => store.getters.wishlistCount)

    const handleSearch = () => {
      if (searchQuery.value.trim()) {
        router.push(`/search?q=${encodeURIComponent(searchQuery.value.trim())}`)
      }
    }

    const toggleUserMenu = () => {
      showUserMenu.value = !showUserMenu.value
    }

    const logout = () => {
      store.dispatch('logout')
      router.push('/login')
      showUserMenu.value = false
    }

    // Close dropdown when clicking outside
    const closeUserMenu = (e) => {
      if (!e.target.closest('.user-menu')) {
        showUserMenu.value = false
      }
    }

    onMounted(() => {
      document.addEventListener('click', closeUserMenu)
    })

    onUnmounted(() => {
      document.removeEventListener('click', closeUserMenu)
    })

    return {
      searchQuery,
      isLoggedIn,
      username,
      cartCount,
      wishlistCount,
      showUserMenu,
      handleSearch,
      toggleUserMenu,
      logout
    }
  }
}
</script>

<style scoped>
.header-wrapper {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: #fff;
}

.top-bar {
  background: linear-gradient(to right, #1a237e, #0d47a1);
  padding: 8px 0;
  font-size: 0.9rem;
}

.top-link {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  margin-right: 20px;
  transition: all 0.3s ease;
}

.top-link i {
  margin-right: 8px;
  font-size: 14px;
}

.top-link:hover {
  color: #fff;
  transform: translateY(-1px);
}

.main-header {
  background: #fff;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  padding: 15px 0;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
}

.logo {
  text-decoration: none;
  color: #1a237e;
  font-size: 1.8rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: transform 0.3s ease;
}

.logo:hover {
  transform: scale(1.05);
}

.search-container {
  flex: 1;
  max-width: 600px;
}

.search-box {
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border-radius: 30px;
  padding: 5px;
  transition: all 0.3s ease;
}

.search-box:focus-within {
  background: #fff;
  box-shadow: 0 0 0 2px #1a237e;
}

.search-box input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 10px 20px;
  font-size: 1rem;
  outline: none;
}

.search-box button {
  background: #1a237e;
  color: #fff;
  border: none;
  padding: 10px 25px;
  border-radius: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.search-box button:hover {
  background: #0d47a1;
  transform: translateX(2px);
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.action-btn {
  text-decoration: none;
  color: #333;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  transition: all 0.3s ease;
}

.action-btn:hover {
  color: #1a237e;
  transform: translateY(-2px);
}

.icon-wrapper {
  position: relative;
  font-size: 1.4rem;
}

.badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #f50057;
  color: #fff;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 10px;
  border: 2px solid #fff;
}

.label {
  font-size: 0.8rem;
}

.auth-btn {
  text-decoration: none;
  padding: 8px 20px;
  border-radius: 25px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.login {
  color: #1a237e;
  border: 2px solid #1a237e;
}

.login:hover {
  background: #1a237e;
  color: #fff;
}

.register {
  background: #1a237e;
  color: #fff;
}

.register:hover {
  background: #0d47a1;
  transform: translateY(-2px);
}

.user-menu {
  position: relative;
}

.user-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: none;
  padding: 8px 15px;
  cursor: pointer;
  border-radius: 25px;
  transition: all 0.3s ease;
}

.user-btn:hover {
  background: #f5f5f5;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  width: 220px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 5px 25px rgba(0,0,0,0.1);
  padding: 10px;
  margin-top: 10px;
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.3s ease;
}

.dropdown-menu.show {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 15px;
  color: #333;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.dropdown-item:hover {
  background: #f5f5f5;
  transform: translateX(5px);
}

.dropdown-divider {
  height: 1px;
  background: #eee;
  margin: 8px 0;
}

.text-danger {
  color: #dc3545;
}

.text-danger:hover {
  background: #dc35451a;
}

@media (max-width: 992px) {
  .label {
    display: none;
  }
  
  .search-container {
    max-width: 400px;
  }
}

@media (max-width: 768px) {
  .contact-info {
    display: none;
  }
  
  .header-content {
    flex-wrap: wrap;
  }
  
  .search-container {
    order: 3;
    max-width: 100%;
    width: 100%;
    margin-top: 15px;
  }
  
  .user-actions {
    gap: 15px;
  }
  
  .auth-btn {
    padding: 6px 15px;
    font-size: 0.9rem;
  }
}
</style>
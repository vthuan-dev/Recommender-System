<template>
  <header>
    <!-- Mobile Menu Button -->
    <button class="mobile-menu-btn" @click="toggleMobileMenu">
      <i class="fas fa-bars"></i>
    </button>

    <!-- Mobile Menu Overlay -->
    <div class="mobile-overlay" :class="{ 'show': showMobileMenu }" @click="toggleMobileMenu"></div>

    <!-- Mobile Menu -->
    <div class="mobile-menu" :class="{ 'show': showMobileMenu }">
      <div class="mobile-menu-header">
        <div class="logo">
          <i class="fas fa-microchip"></i>
          <span>T-Store</span>
        </div>
        <button class="close-btn" @click="toggleMobileMenu">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Mobile User Info -->
      <div class="mobile-user-info" v-if="isLoggedIn">
        <div class="user-avatar">
          <i class="fas fa-user-circle"></i>
        </div>
        <div class="user-details">
          <span class="username">{{ username }}</span>
          <small>Thành viên</small>
        </div>
      </div>
      
      <div class="mobile-search">
        <div class="search-input">
          <div class="search-box">
            <!-- <i class="fas fa-search search-icon"></i> -->
            <input 
              type="text"
              v-model="searchQuery"
              placeholder="Tìm kiếm sản phẩm..."
              @keyup.enter="handleSearch"
            >
            <button class="clear-btn" @click="clearSearch" v-if="searchQuery">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <button class="search-btn" @click="handleSearch">
            <i class="fas fa-search"></i>
          </button>
        </div>
      </div>

      <nav class="mobile-nav">
        <router-link to="/" @click="handleMenuClick('home')" class="nav-item">
          <i class="fas fa-home"></i>
          <span>Trang chủ</span>
        </router-link>
        <router-link to="/categories" @click="handleMenuClick('categories')" class="nav-item">
          <i class="fas fa-th-large"></i>
          <span>Danh mục</span>
        </router-link>
        <router-link to="/wishlist" @click="toggleMobileMenu" class="nav-item">
          <i class="fas fa-heart"></i>
          <span>Yêu thích</span>
          <span v-if="wishlistCount" class="badge">{{wishlistCount}}</span>
        </router-link>
        <router-link to="/cart" @click="toggleMobileMenu" class="nav-item">
          <i class="fas fa-shopping-cart"></i>
          <span>Giỏ hàng</span>
          <span v-if="cartCount" class="badge">{{cartCount}}</span>
        </router-link>
      </nav>

      <div class="mobile-actions">
        <template v-if="!isLoggedIn">
          <router-link to="/login" class="btn-login" @click="toggleMobileMenu">
            <i class="fas fa-sign-in-alt"></i>
            <span>Đăng nhập</span>
          </router-link>
        </template>
        <template v-else>
          <router-link to="/profile" class="action-item" @click="toggleMobileMenu">
            <i class="fas fa-user"></i>
            <span>Tài khoản của tôi</span>
          </router-link>
          <router-link to="/orders" class="action-item" @click="toggleMobileMenu">
            <i class="fas fa-shopping-bag"></i>
            <span>Đơn hàng</span>
          </router-link>
          <a @click="logout" class="action-item logout">
            <i class="fas fa-sign-out-alt"></i>
            <span>Đăng xuất</span>
          </a>
        </template>
      </div>
    </div>

    <!-- Top Bar -->
    <div class="top-bar">
      <div class="container">
        <div class="top-bar-content">
          <div class="contact-info">
            <a href="tel:1900xxxx">
              <i class="fas fa-phone-alt"></i>
              <span>1900 xxxx</span>
            </a>
            <span class="divider">|</span>
            <a href="mailto:support@tstore.com">
              <i class="fas fa-envelope"></i>
              <span>support@tstore.com</span>
            </a>
          </div>
          <div class="top-links">
            <a href="/track-order">
              <i class="fas fa-truck"></i>
              <span>Theo dõi đơn hàng</span>
            </a>
            <span class="divider">|</span>
            <a href="/stores">
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
          <router-link to="/" class="logo">
            <i class="fas fa-microchip"></i>
            <span>T-Store</span>
          </router-link>

          <div class="search-bar">
            <div class="category-select">
              <select v-model="selectedCategory">
                <option value="">Tất cả danh mục</option>
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                  {{ cat.name }}
                </option>
              </select>
            </div>
            <div class="search-input">
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

          <div class="header-actions">
            <div class="action-item wishlist">
              <router-link to="/wishlist">
                <i class="fas fa-heart"></i>
                <span class="badge" v-if="wishlistCount">{{ wishlistCount }}</span>
                <span class="label">Yêu thích</span>
              </router-link>
            </div>

            <div class="action-item cart">
              <router-link to="/cart">
                <i class="fas fa-shopping-cart"></i>
                <span class="badge" v-if="cartCount">{{ cartCount }}</span>
                <span class="label">Giỏ hàng</span>
              </router-link>
            </div>

            <div class="action-item user" v-if="!isLoggedIn">
              <router-link to="/login" class="login-btn">
                <i class="fas fa-user"></i>
                <span>Đăng nhập</span>
              </router-link>
            </div>

            <div class="action-item user-menu" v-if="isLoggedIn">
              <button class="user-btn" @click.stop="toggleDropdown">
                <div class="avatar">
                  <img v-if="userAvatar" :src="userAvatar" :alt="username">
                  <i v-else class="fas fa-user-circle"></i>
                </div>
                <span class="username">{{ username }}</span>
                <i class="fas fa-chevron-down"></i>
              </button>

              <div class="user-dropdown" :class="{ show: isDropdownOpen }">
                <div class="profile-header">
                  <div class="profile-avatar">
                    <img v-if="userAvatar" :src="userAvatar" :alt="username">
                    <i v-else class="fas fa-user-circle"></i>
                    <span class="status-dot"></span>
                  </div>
                  <div class="profile-info">
                    <h4 class="profile-name">{{ username }}</h4>
                    <span class="profile-email">{{ userEmail }}</span>
                  </div>
                  <button class="logout-button" @click="logout" title="Đăng xuất">
                    <i class="fas fa-sign-out-alt"></i>
                  </button>
                </div>

                <div class="menu-options">
                  <router-link to="/profile" class="menu-option">
                    <div class="option-icon">
                      <i class="fas fa-user"></i>
                    </div>
                    <div class="option-content">
                      <span class="option-title">Tài khoản của tôi</span>
                      <span class="option-desc">Quản lý thông tin cá nhân</span>
                    </div>
                  </router-link>

                  <router-link to="/orders" class="menu-option">
                    <div class="option-icon">
                      <i class="fas fa-shopping-bag"></i>
                    </div>
                    <div class="option-content">
                      <span class="option-title">Đơn hàng</span>
                      <span class="option-desc">Xem lịch sử mua hàng</span>
                    </div>
                  </router-link>

                  <router-link to="/addresses" class="menu-option">
                    <div class="option-icon">
                      <i class="fas fa-map-marker-alt"></i>
                    </div>
                    <div class="option-content">
                      <span class="option-title">Sổ địa chỉ</span>
                      <span class="option-desc">Quản lý địa chỉ giao hàng</span>
                    </div>
                  </router-link>
                </div>
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
import CustomSweetAlert from '@/components/Common/CustomSweetAlert'
import axios from 'axios'

export default {
  name: 'HeaderComponent',
  setup() {
    const store = useStore()
    const router = useRouter()
    const searchQuery = ref('')
    const showUserMenu = ref(false)
    const showMobileMenu = ref(false)
    const selectedCategory = ref('')
    const categories = ref([])
    const isDropdownOpen = ref(false)

    const isLoggedIn = computed(() => store.getters.isAuthenticated)
    const username = computed(() => {
      const user = store.getters.currentUser
      return user ? user.fullname : ''
    })
    const cartCount = computed(() => store.getters.cartCount)
    const wishlistCount = computed(() => store.getters.wishlistCount)

    const toggleMobileMenu = () => {
      showMobileMenu.value = !showMobileMenu.value
      if (showMobileMenu.value) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = 'auto'
      }
    }

    const handleSearch = async () => {
      if (!searchQuery.value.trim()) return
      
      await trackUserInteraction('search', {
        query: searchQuery.value,
        results_count: 0
      })

      router.push({
        path: '/search',
        query: { q: searchQuery.value }
      })
    }

    const toggleUserMenu = () => {
      showUserMenu.value = !showUserMenu.value
    }

    const logout = async () => {
      try {
        await store.dispatch('logout')
        showUserMenu.value = false
        showMobileMenu.value = false

       
        
        await CustomSweetAlert.success(
          'Đăng xuất thành công!',
          'Hẹn gặp lại bạn!'
        )
        
        setTimeout(() => {
          router.push('/')
         
        }, 2000)
        window.location.reload()
        
      } catch (error) {
        CustomSweetAlert.error(
          'Lỗi!',
          'Không thể đăng xuất. Vui lòng thử lại!'
        )
      }
    }

    const closeUserMenu = (e) => {
      if (!e.target.closest('.user-menu')) {
        showUserMenu.value = false
      }
    }

    router.afterEach(() => {
      showMobileMenu.value = false
      document.body.style.overflow = 'auto'
    })

    onMounted(() => {
      document.addEventListener('click', closeUserMenu)
    })

    onUnmounted(() => {
      document.removeEventListener('click', closeUserMenu)
      document.body.style.overflow = 'auto'
    })

    const trackUserInteraction = async (action, data) => {
      if (!localStorage.getItem('user_id')) return
      
      try {
        await axios.post('/api/recommendations/track', {
          user_id: localStorage.getItem('user_id'),
          action: action,
          data: data,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        console.error('Error tracking interaction:', error)
      }
    }

    const handleMenuClick = async (category) => {
      await trackUserInteraction('category_view', {
        category_name: category
      })
    }

    return {
      searchQuery,
      selectedCategory,
      categories,
      isLoggedIn,
      username,
      cartCount,
      wishlistCount,
      showUserMenu,
      showMobileMenu,
      handleSearch,
      toggleUserMenu,
      toggleMobileMenu,
      logout,
      isDropdownOpen,
      handleMenuClick
    }
  },
  methods: {
    toggleDropdown() {
      this.isDropdownOpen = !this.isDropdownOpen;
    },
    closeDropdown(e) {
      // Đóng dropdown khi click ra ngoài
      if (!e.target.closest('.user-menu')) {
        this.isDropdownOpen = false;
      }
    }
  },
  mounted() {
    // Thêm event listener để đóng dropdown khi click ra ngoài
    document.addEventListener('click', this.closeDropdown);
  },
  beforeUnmount() {
    // Cleanup event listener
    document.removeEventListener('click', this.closeDropdown);
  }
}
</script>

<style scoped>
.top-bar {
  background: #f8f9fa;
  padding: 8px 0;
  font-size: 0.9rem;
  border-bottom: 1px solid #eee;
}

.top-bar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.contact-info, .top-links {
  display: flex;
  align-items: center;
  gap: 20px;
}

.contact-info a, .top-links a {
  color: #666;
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.2s;
}

.contact-info a:hover, .top-links a:hover {
  color: #1a73e8;
}

.divider {
  color: #ddd;
}

.main-header {
  padding: 20px 0;
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.header-content {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 32px;
  padding: 16px 24px;
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a73e8;
  transition: transform 0.3s ease;
}

.logo i {
  font-size: 1.8rem;
  background: linear-gradient(135deg, #1a73e8, #289fff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.logo:hover {
  transform: scale(1.05);
}

.search-bar {
  display: flex;
  align-items: center;
  max-width: 800px;
  width: 100%;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.search-bar:focus-within {
  border-color: #1a73e8;
  box-shadow: 0 0 0 4px rgba(26, 115, 232, 0.1);
}

.category-select {
  position: relative;
  padding: 0 16px;
  border-right: 2px solid #e2e8f0;
}

.category-select select {
  appearance: none;
  border: none;
  background: transparent;
  padding: 12px 32px 12px 8px;
  font-size: 0.95rem;
  color: #1e293b;
  cursor: pointer;
  width: 160px;
}

.category-select::after {
  content: '\f107';
  font-family: 'Font Awesome 5 Free';
  font-weight: 900;
  position: absolute;
  right: 24px;
  top: 50%;
  transform: translateY(-50%);
  color: #64748b;
  pointer-events: none;
}

.search-input {
  flex: 1;
  display: flex;
  align-items: center;
}

.search-input input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px 16px;
  font-size: 1rem;
  color: #1e293b;
}

.search-input input::placeholder {
  color: #94a3b8;
}

.search-input button {
  background: linear-gradient(135deg, #1a73e8, #289fff);
  border: none;
  padding: 10px 20px;
  margin: 4px;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.search-input button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 115, 232, 0.2);
}

.search-input button i {
  font-size: 1.1rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 24px;
}

.action-item {
  position: relative;
}

.action-item a {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: #1e293b;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.action-item a:hover {
  background: rgba(26, 115, 232, 0.08);
  transform: translateY(-2px);
}

.action-item i {
  font-size: 1.4rem;
  background: linear-gradient(135deg, #1a73e8, #289fff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  transition: transform 0.3s ease;
}

.action-item:hover i {
  transform: scale(1.1);
}

.label {
  font-size: 0.95rem;
  font-weight: 500;
  color: #64748b;
}

.user-menu {
  position: relative;
}

.user-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: linear-gradient(to right, #f8fafc, #f1f5f9);
  border: 1px solid #e2e8f0;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.user-btn:hover {
  background: linear-gradient(to right, #f1f5f9, #e2e8f0);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transform: translateY(-2px);
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, #1a73e8, #289fff);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar i {
  font-size: 1.2rem;
  color: white;
}

.username {
  font-size: 0.95rem;
  font-weight: 500;
  color: #1e293b;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fa-chevron-down {
  font-size: 0.8rem;
  color: #64748b;
  transition: transform 0.3s ease;
}

.user-btn:hover .fa-chevron-down {
  transform: rotate(180deg);
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 320px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px);
  transition: all 0.3s ease;
  z-index: 1000;
}

.user-dropdown.show {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.profile-header {
  background: linear-gradient(135deg, #1a73e8, #289fff);
  padding: 24px;
  border-radius: 16px 16px 0 0;
  position: relative;
  overflow: hidden;
}

.profile-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg...>'); /* Add a subtle pattern */
  opacity: 0.1;
}

.menu-options {
  padding: 8px;
}

.menu-option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  border-radius: 12px;
  transition: all 0.3s ease;
  text-decoration: none;
}

.menu-option:hover {
  background: rgba(26, 115, 232, 0.04);
  transform: translateX(4px);
}

.option-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.menu-option:hover .option-icon {
  background: linear-gradient(135deg, #1a73e8, #289fff);
  transform: rotate(5deg);
}

.menu-option:hover .option-icon i {
  color: white;
}

.option-title {
  font-weight: 600;
  color: #1e293b;
  display: block;
  margin-bottom: 4px;
}

.option-desc {
  font-size: 0.85rem;
  color: #64748b;
}

.logout-button {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.logout-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.show {
  animation: slideIn 0.2s ease forwards;
}

/* Responsive */
@media (max-width: 768px) {
  .dropdown-menu {
    width: 280px;
  }
  
  .item-desc {
    display: none;
  }
}

/* Responsive Design */
@media (max-width: 992px) {
  .header-content {
    grid-template-columns: auto 1fr;
  }
  
  .search-bar {
    grid-column: 1 / -1;
    grid-row: 2;
    margin-top: 15px;
  }
  
  .category-select {
    display: none;
  }
}

@media (max-width: 768px) {
  .top-bar {
    display: none;
  }
  
  .header-actions {
    gap: 15px;
  }
  
  .action-item .label {
    display: none;
  }
}

/* Add new mobile styles */
.mobile-menu-btn {
  display: none;
  position: fixed;
  top: 15px;
  left: 15px;
  z-index: 2000;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #333;
}

.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.5);
  opacity: 0;
  visibility: hidden;
  transition: 0.3s;
  z-index: 1000;
}

.mobile-overlay.show {
  opacity: 1;
  visibility: visible;
}

.mobile-menu {
  position: fixed;
  top: 0;
  left: -100%;
  width: 85%;
  max-width: 360px;
  height: 100vh;
  background: white;
  z-index: 1001;
  transition: 0.3s ease-out;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.mobile-menu.show {
  left: 0;
  box-shadow: 5px 0 25px rgba(0,0,0,0.15);
}

.mobile-menu-header {
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #eee;
}

.mobile-user-info {
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #f8f9fa;
}

.mobile-search {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
}

.mobile-nav {
  padding: 15px 0;
  display: flex;
  flex-direction: column;
}

.nav-item {
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #333;
  text-decoration: none;
  transition: 0.2s;
}

.nav-item:hover {
  background: #f8f9fa;
  color: #4299e1;
}

.mobile-actions {
  margin-top: auto;
  padding: 20px;
  border-top: 1px solid #eee;
}

.btn-login {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  background: #4299e1;
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .top-bar,
  .main-header .search-bar,
  .main-header .header-actions {
    display: none;
  }

  .main-header {
    padding: 15px 0;
  }

  .main-header .container {
    padding-left: 60px;
  }

  .mobile-menu-btn {
    display: block;
  }
}

.search-button {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #1a73e8, #0d47a1);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(26, 115, 232, 0.2);
}

/* Icon style */
.search-button i {
  font-size: 1.1rem;
  transition: transform 0.3s ease;
}

/* Text style */
.button-text {
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Hover effect */
.search-button:hover {
  background: linear-gradient(135deg, #1557b0, #083275);
  box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3);
  transform: translateY(-1px);
}

.search-button:hover i {
  transform: scale(1.1);
}

/* Click effect */
.search-button:active {
  transform: translateY(1px);
  box-shadow: 0 2px 4px rgba(26, 115, 232, 0.2);
}

/* Ripple effect */
.button-effect {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.6s ease-out, height 0.6s ease-out;
}

.search-button:active .button-effect {
  width: 200px;
  height: 200px;
  opacity: 0;
}

/* Responsive styles */
@media (max-width: 768px) {
  .search-button {
    padding: 10px 20px;
  }
  
  .button-text {
    display: none; /* Ẩn text trên mobile */
  }
  
  .search-button i {
    font-size: 1.2rem; /* Icon to hơn trên mobile */
  }
}

/* Glass morphism effect cho phiên bản cao cấp */
.search-button.glass {
  background: rgba(26, 115, 232, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Loading state */
.search-button.loading {
  pointer-events: none;
  opacity: 0.8;
}

.search-button.loading i {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Focus state */
.search-button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(26, 115, 232, 0.3);
}

/* Disabled state */
.search-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: linear-gradient(135deg, #9e9e9e, #616161);
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .header-content {
    background: #1e293b;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  }
  
  .search-bar {
    background: #0f172a;
    border-color: #334155;
  }
  
  .search-input input {
    color: #f1f5f9;
  }
  
  .search-input input::placeholder {
    color: #64748b;
  }
  
  .category-select select {
    color: #f1f5f9;
  }
  
  .category-select {
    border-right-color: #334155;
  }
}

/* Animation cho chevron icon */
.user-btn .fa-chevron-down {
  transition: transform 0.3s ease;
}

.user-menu:has(.show) .user-btn .fa-chevron-down {
  transform: rotate(180deg);
}

/* Thêm position relative cho container */
.user-menu {
  position: relative;
}

/* Thêm overlay để bắt click outside tốt hơn */
.user-dropdown::before {
  content: '';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: transparent;
  z-index: -1;
  pointer-events: none;
}

.user-dropdown.show::before {
  pointer-events: auto;
}
</style>
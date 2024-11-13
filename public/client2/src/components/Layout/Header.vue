<template>
  <header>
    <!-- Top Navigation -->
    <nav class="navbar navbar-expand-lg navbar-light bg-warning">
      <div class="container">
        <!-- Logo -->
        <router-link class="navbar-brand" to="/">
          <i class="fas fa-store fa-2x"></i>
          <span class="ms-2 fw-bold">T-Store</span>
        </router-link>

        <!-- Search Bar -->
        <div class="search-box flex-grow-1 mx-lg-4">
          <div class="input-group">
            <input type="text" class="form-control" placeholder="Tìm kiếm sản phẩm..." v-model="searchQuery"
              @keyup.enter="handleSearch">
            <button class="btn btn-dark" @click="handleSearch">
              <i class="fas fa-search"></i>
            </button>
          </div>
        </div>

        <!-- Navigation Toggle Button -->
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>

        <!-- Navigation Items -->
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto align-items-center">
            <!-- Cart -->
            <li class="nav-item me-3">
              <router-link class="nav-link position-relative" to="/cart">
                <i class="fas fa-shopping-cart fs-5"></i>
                <span v-if="cartCount" class="cart-badge">{{ cartCount }}</span>
              </router-link>
            </li>

            <!-- User Menu -->
            <template v-if="!isLoggedIn">
              <li class="nav-item">
                <router-link class="btn btn-outline-dark me-2" to="/login">
                  <i class="fas fa-sign-in-alt me-1"></i>Đăng nhập
                </router-link>
              </li>
              <li class="nav-item">
                <router-link class="btn btn-dark" to="/register">
                  <i class="fas fa-user-plus me-1"></i>Đăng ký
                </router-link>
              </li>
            </template>

            <li v-else class="nav-item dropdown">
              <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" id="userDropdown" role="button"
                data-bs-toggle="dropdown">
                <i class="fas fa-user-circle fs-5 me-2"></i>
                {{ username }}
              </a>
              <ul class="dropdown-menu dropdown-menu-end">
                <li>
                  <router-link class="dropdown-item" to="/profile">
                    <i class="fas fa-user me-2"></i>Thông tin tài khoản
                  </router-link>
                </li>
                <li>
                  <router-link class="dropdown-item" to="/orders">
                    <i class="fas fa-shopping-bag me-2"></i>Đơn hàng của tôi
                  </router-link>
                </li>
                <li>
                  <hr class="dropdown-divider">
                </li>
                <li>
                  <a class="dropdown-item text-danger" href="#" @click="logout">
                    <i class="fas fa-sign-out-alt me-2"></i>Đăng xuất
                  </a>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- Category Navigation -->
    <nav class="category-nav bg-light border-bottom">
      <div class="container">
        <ul class="nav">
          <li v-for="category in categories" :key="category.id" class="nav-item">
            <router-link :to="`/products/${category.id}`" class="nav-link text-dark">
              <i :class="category.icon"></i>
              {{ category.name }}
            </router-link>
          </li>
        </ul>
      </div>
    </nav>
  </header>
</template>

<script>
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

export default {
  name: 'HeaderComponent',
  setup() {
    const store = useStore()
    const router = useRouter()
    const searchQuery = ref('')

    const cartCount = computed(() => store.getters.cartItemCount)
    const isLoggedIn = computed(() => store.getters.isAuthenticated)
    const username = computed(() => store.state.user?.fullname)
    const categories = computed(() => store.state.categories)

    const handleSearch = () => {
      if (searchQuery.value.trim()) {
        router.push(`/search?q=${searchQuery.value}`)
      }
    }

    const logout = () => {
      store.dispatch('logout')
      router.push('/login')
    }

    return {
      searchQuery,
      cartCount,
      isLoggedIn,
      username,
      categories,
      handleSearch,
      logout
    }
  }
}
</script>

<style scoped>
.search-box {
  max-width: 500px;
}

.cart-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #dc3545;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 0.75rem;
}

.category-nav .nav-link {
  padding: 0.8rem 1.2rem;
  transition: color 0.3s;
}

.category-nav .nav-link:hover {
  color: #007bff !important;
}

.category-nav i {
  margin-right: 0.5rem;
}

@media (max-width: 991.98px) {
  .search-box {
    margin: 1rem 0;
  }

  .navbar-nav {
    margin-top: 1rem;
  }
}
</style>
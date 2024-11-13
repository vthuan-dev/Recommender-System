<template>
  <div class="home">
    <!-- Hero Section -->
    <section class="hero-section">
      <div id="heroCarousel" class="carousel slide" data-bs-ride="carousel">
        <div class="carousel-indicators">
          <button v-for="(slide, index) in heroSlides" 
                  :key="index"
                  :data-bs-target="'#heroCarousel'"
                  :data-bs-slide-to="index"
                  :class="{ active: index === 0 }">
          </button>
        </div>
        
        <div class="carousel-inner">
          <div v-for="(slide, index) in heroSlides" 
               :key="index"
               :class="['carousel-item', { active: index === 0 }]">
            <div class="hero-content">
              <div class="container">
                <div class="row align-items-center">
                  <div class="col-md-6 text-start">
                    <h1 class="display-4 fw-bold mb-4">{{ slide.title }}</h1>
                    <p class="lead mb-4">{{ slide.description }}</p>
                    <router-link :to="slide.link" class="btn btn-primary btn-lg">
                      Khám phá ngay
                      <i class="fas fa-arrow-right ms-2"></i>
                    </router-link>
                  </div>
                  <div class="col-md-6 d-none d-md-block">
                    <div class="hero-image">
                      <i :class="[slide.icon, 'hero-icon']"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Flash Deals Section -->
    <section class="flash-deals-section">
      <div class="container py-5">
        <div class="section-header text-center mb-5">
          <h6 class="text-danger text-uppercase fw-bold">Flash Sale</h6>
          <h2 class="section-title">Ưu đãi hấp dẫn</h2>
        </div>
        
        <div v-if="flashDeals && flashDeals.length > 0" class="row g-4">
          <div v-for="product in flashDeals" 
               :key="product.id" 
               class="col-6 col-md-3">
            <div class="flash-card">
              <div class="discount-badge">
                -{{ product.discount }}%
              </div>
              <div class="countdown">
                {{ formatCountdown(product.endTime) }}
              </div>
              <div class="product-card">
                <div class="card border-0 rounded-4 shadow-hover h-100">
                  <div class="product-image">
                    <img :src="product.image" :alt="product.name">
                    <div class="product-actions">
                      <button class="action-btn" @click="addToWishlist(product)">
                        <i class="fas fa-heart"></i>
                      </button>
                      <button class="action-btn" @click="addToCart(product)">
                        <i class="fas fa-shopping-cart"></i>
                      </button>
                    </div>
                  </div>
                  <div class="card-body">
                    <h5 class="product-title">{{ product.name }}</h5>
                    <div class="product-price">
                      <span class="new-price">{{ formatPrice(product.price) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-5">
          <p>Không có ưu đãi nào đang diễn ra</p>
        </div>
      </div>
    </section>

    <!-- Featured Categories -->
    <section class="categories-section">
      <div class="container py-5">
        <div class="section-header text-center mb-5">
          <h6 class="text-primary text-uppercase fw-bold">Danh mục nổi bật</h6>
          <h2 class="section-title">Khám phá sản phẩm theo danh mục</h2>
        </div>
        
        <div class="row g-4">
          <div v-for="category in categories" 
               :key="category.id" 
               class="col-6 col-md-3">
            <router-link :to="`/category/${category.id}`" 
                        class="category-card">
              <div class="card h-100 border-0 rounded-4 shadow-hover">
                <div class="card-body text-center p-4">
                  <div class="category-icon mb-3">
                    <i :class="[getCategoryIcon(category.name), 'fa-3x']"></i>
                  </div>
                  <h5 class="card-title mb-0">{{ category.name }}</h5>
                </div>
              </div>
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- Trending Products -->
    <section class="trending-section">
      <div class="container py-5">
        <div class="section-header text-center mb-5">
          <h6 class="text-danger text-uppercase fw-bold">Xu hướng mua sắm</h6>
          <h2 class="section-title">Sản phẩm thịnh hành</h2>
        </div>
        
        <div class="trending-slider">
          <div class="row g-4">
            <div v-for="product in trendingProducts" 
                 :key="product.id" 
                 class="col-6 col-md-3">
              <div class="trending-card">
                <div class="trend-badge">
                  <i class="fas fa-fire"></i> Hot
                </div>
                <div class="product-card">
                  <div class="card border-0 rounded-4 shadow-hover h-100">
                    <div class="product-image">
                      <img :src="product.image" :alt="product.name">
                      <div class="product-actions">
                        <button class="action-btn" @click="addToWishlist(product)">
                          <i class="fas fa-heart"></i>
                        </button>
                        <button class="action-btn" @click="addToCart(product)">
                          <i class="fas fa-shopping-cart"></i>
                        </button>
                      </div>
                    </div>
                    <div class="card-body">
                      <h5 class="product-title">{{ product.name }}</h5>
                      <div class="product-price">
                        <span class="new-price">{{ formatPrice(product.price) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Recommended Products -->
    <section v-if="isAuthenticated" class="recommendations-section">
      <div class="container py-5">
        <div class="section-header text-center mb-5">
          <h6 class="text-primary text-uppercase fw-bold">Dành riêng cho bạn</h6>
          <h2 class="section-title">Gợi ý sản phẩm</h2>
        </div>
        
        <div class="row g-4">
          <div v-for="product in recommendedProducts" 
               :key="product.id" 
               class="col-6 col-md-3">
            <div class="product-card">
              <div class="card border-0 rounded-4 shadow-hover h-100">
                <div class="product-image">
                  <img :src="product.image" :alt="product.name">
                  <div class="product-actions">
                    <button class="action-btn" @click="addToWishlist(product)">
                      <i class="fas fa-heart"></i>
                    </button>
                    <button class="action-btn" @click="addToCart(product)">
                      <i class="fas fa-shopping-cart"></i>
                    </button>
                  </div>
                </div>
                <div class="card-body">
                  <h5 class="product-title">{{ product.name }}</h5>
                  <div class="product-price">
                    <span class="new-price">{{ formatPrice(product.price) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Recently Viewed -->
    <section v-if="recentlyViewed.length" class="recent-section">
      <div class="container py-5">
        <div class="section-header text-center mb-5">
          <h6 class="text-secondary text-uppercase fw-bold">Xem gần đây</h6>
          <h2 class="section-title">Sản phẩm bạn đã xem</h2>
        </div>
        
        <div class="row g-4">
          <div v-for="product in recentlyViewed" 
               :key="product.id" 
               class="col-6 col-md-3">
            <div class="product-card">
              <div class="card border-0 rounded-4 shadow-hover h-100">
                <div class="product-image">
                  <img :src="product.image" :alt="product.name">
                  <div class="product-actions">
                    <button class="action-btn" @click="addToWishlist(product)">
                      <i class="fas fa-heart"></i>
                    </button>
                    <button class="action-btn" @click="addToCart(product)">
                      <i class="fas fa-shopping-cart"></i>
                    </button>
                  </div>
                </div>
                <div class="card-body">
                  <h5 class="product-title">{{ product.name }}</h5>
                  <div class="product-price">
                    <span class="new-price">{{ formatPrice(product.price) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useStore } from 'vuex'
import axiosInstance from '@/utils/axios'

export default {
  name: 'HomeComponent',
  setup() {
    const store = useStore()

    const heroSlides = ref([
      {
        icon: 'fas fa-laptop-code fa-3x',
        title: 'Công Nghệ Hàng Đầu',
        description: 'Khám phá những sản phẩm công nghệ mới nhất',
        link: '/products'
      },
      {
        icon: 'fas fa-mobile-alt fa-3x',
        title: 'Smartphone Cao Cấp',
        description: 'Trải nghiệm công nghệ di động tiên tiến',
        link: '/products/phones'
      }
    ])

    const flashDeals = ref([])
    const isAuthenticated = computed(() => store.state.auth.isAuthenticated)
    const trendingProducts = computed(() => 
      store.state.products?.trending || []
    )
    
    const recommendedProducts = computed(() => 
      store.state.products?.recommended || []
    )
    
    const recentlyViewed = computed(() => 
      store.state.products?.recentlyViewed || []
    )
    const categories = ref([])

    const formatCountdown = (endTime) => {
      const now = new Date().getTime()
      const distance = new Date(endTime).getTime() - now
      
      const hours = Math.floor(distance / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      
      return `${hours}h ${minutes}m`
    }

    const formatPrice = (price) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price)
    }

    const addToCart = (product) => {
      store.dispatch('cart/addItem', product)
    }

    const addToWishlist = (product) => {
      store.dispatch('wishlist/addItem', product)
    }

    const getCategoryIcon = (categoryName) => {
      const icons = {
        'Laptop': 'fas fa-laptop',
        'Smartphone': 'fas fa-mobile-alt',
        'Tablet': 'fas fa-tablet-alt',
        'Accessories': 'fas fa-headphones',
        // Add more mappings as needed
      }
      return icons[categoryName] || 'fas fa-box'
    }

    onMounted(async () => {
      try {
        // Fetch flash deals
        const response = await axiosInstance.get('/flash-deals')
        flashDeals.value = response.data

        // Fetch categories
        const catResponse = await axiosInstance.get('/categories')
        categories.value = catResponse.data

        // Fetch trending products
        const trendingResponse = await axiosInstance.get('/trending-products')
        store.commit('setTrendingProducts', trendingResponse.data)
        
      } catch (error) {
        console.error('Error fetching data:', error)
      }
    })

    return {
      heroSlides,
      flashDeals,
      categories,
      trendingProducts,
      recommendedProducts,
      recentlyViewed,
      isAuthenticated,
      formatCountdown,
      formatPrice,
      addToCart,
      addToWishlist,
      getCategoryIcon
    }
  }
}
</script>

<style scoped>
.hero-section {
  background: linear-gradient(135deg, #0061f2 0%, #6900f2 100%);
  color: white;
  position: relative;
  overflow: hidden;
}

.hero-content {
  padding: 6rem 0;
  position: relative;
  z-index: 1;
}

.hero-image {
  position: relative;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-icon {
  font-size: 15rem;
  opacity: 0.2;
  animation: float 3s ease-in-out infinite;
}

.category-card {
  text-decoration: none;
  color: inherit;
  display: block;
  transition: all 0.3s ease;
}

.shadow-hover {
  transition: all 0.3s ease;
}

.shadow-hover:hover {
  transform: translateY(-5px);
  box-shadow: 0 1rem 3rem rgba(0,0,0,.175)!important;
}

.category-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto;
  background: linear-gradient(135deg, #0061f2 0%, #6900f2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.flash-sale-section {
  background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
}

.countdown-wrapper {
  background: rgba(255,255,255,0.1);
  padding: 1rem;
  border-radius: 1rem;
}

.time-block {
  background: rgba(255,255,255,0.2);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  text-align: center;
  min-width: 70px;
}

.product-card {
  position: relative;
}

.product-image {
  position: relative;
  padding-top: 100%;
  overflow: hidden;
}

.product-image img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.discount-badge {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: #ff6b6b;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  font-weight: bold;
}

.product-actions {
  position: absolute;
  right: 1rem;
  top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  opacity: 0;
  transform: translateX(20px);
  transition: all 0.3s ease;
}

.product-card:hover .product-actions {
  opacity: 1;
  transform: translateX(0);
}

.action-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: white;
  color: #333;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.action-btn:hover {
  background: #0061f2;
  color: white;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
  100% { transform: translateY(0px); }
}

@media (max-width: 768px) {
  .hero-content {
    padding: 4rem 0;
    text-align: center;
  }
  
  .hero-image {
    height: 200px;
  }
  
  .hero-icon {
    font-size: 8rem;
  }
}
</style>

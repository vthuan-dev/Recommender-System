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

    <!-- Move Recommended Products Section here -->
    <section class="recommendations-section">
      <div class="container py-5">
        <div class="section-header text-center mb-5">
          <h6 class="text-primary text-uppercase fw-bold">
            {{ isAuthenticated ? 'Dành riêng cho bạn' : 'Được nhiều người quan tâm' }}
          </h6>
          <h2 class="section-title">Gợi ý sản phẩm</h2>
        </div>
        
        <div class="row g-4">
          <div v-for="product in recommendedProducts" 
               :key="product.product_id" 
               class="col-6 col-md-3">
            <ProductCard 
              :product="{
                id: product.product_id,
                name: product.name,
                image_url: product.image_url,
                min_price: product.min_price,
                max_price: product.max_price,
                brand_name: product.brand_name,
                category_name: product.category_name,
                metrics: product.metrics || {}
              }"
              @add-to-wishlist="handleAddToWishlist"
              @add-to-cart="handleAddToCart"
            />
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
              <div class="discount-badge" v-if="product.discount">
                -{{ product.discount }}%
              </div>
              <ProductCard 
                :product="product"
                @add-to-wishlist="addToWishlist"
                @add-to-cart="addToCart"
              />
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
               class="col-12 mb-4">
            <div class="category-block">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h3 class="category-title">{{ category.name }}</h3>
                <router-link :to="`/category/${category.id}`" class="btn btn-outline-primary">
                  Xem tất cả
                </router-link>
              </div>
              
              <div class="row g-4">
                <div v-for="product in category.products" 
                     :key="product.id" 
                     class="col-6 col-md-3">
                  <ProductCard :product="product" />
                </div>
              </div>
            </div>
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
                <ProductCard 
                  :product="product"
                  @add-to-wishlist="addToWishlist"
                  @add-to-cart="addToCart"
                />
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

    <ProductRecommendations 
      v-if="isLoggedIn && currentUser"
      :userId="currentUser.userId"
    />
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue'
import { useStore } from 'vuex'
import axiosInstance from '@/utils/axios'
import ProductCard from '@/components/Product/ProductCard.vue'
// Remove RecommendedProducts import if not needed
// import RecommendedProducts from '@/components/Product/RecommendedProducts.vue'
import axios from 'axios'
import ProductRecommendations from '../components/Product/ProductRecommendations.vue'

export default {
  name: 'HomeComponent',
  components: {
    ProductCard,
    // Remove RecommendedProducts from components if not needed
    // RecommendedProducts,
    ProductRecommendations
  },
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
    const trendingProducts = ref([])
    const recommendedProducts = ref([])
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

    const calculateDiscount = (originalPrice, minPrice) => {
      return Math.round(((originalPrice - minPrice) / originalPrice) * 100)
    }

    const addToCart = async (product) => {
      try {
        if (!isAuthenticated.value) {
          return
        }
        await store.dispatch('cart/addItem', {
          productId: product.id,
          quantity: 1,
          variantId: product.variants?.[0]?.id
        })
      } catch (error) {
        console.error('Lỗi khi thêm vào giỏ hàng:', error)
      }
    }

    const addToWishlist = async (product) => {
      try {
        if (!isAuthenticated.value) {
          return
        }
        await axiosInstance.post('/favorites', {
          productId: product.id
        })
      } catch (error) {
        console.error('Lỗi khi thêm vào yêu thích:', error)
      }
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
        const categoriesResponse = await axiosInstance.get('/categories')
        categories.value = categoriesResponse.data

        const flashDealsResponse = await axiosInstance.get('/flash-deals')
        flashDeals.value = flashDealsResponse.data.map(product => ({
          ...product,
          discount: calculateDiscount(product.max_price, product.min_price),
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }))

        const trendingResponse = await axiosInstance.get('/trending-products')
        trendingProducts.value = trendingResponse.data
        
        // Gọi loadRecommendations thay vì gọi API trực tiếp
        await loadRecommendations()

      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu:', error)
      }
    })

    const handleAddToWishlist = async (product) => {
      if (!isAuthenticated.value) {
        // Xử lý khi chưa đăng nhập
        return
      }
      try {
        await store.dispatch('wishlist/addItem', product)
        // Hiển thị thông báo thành công
      } catch (error) {
        console.error('Error adding to wishlist:', error)
        // Hiển thị thông báo lỗi
      }
    }

    const handleAddToCart = async (product) => {
      if (!isAuthenticated.value) {
        // Xử lý khi chưa đăng nhập
        return
      }
      try {
        await store.dispatch('cart/addItem', {
          productId: product.product_id,
          quantity: 1
        })
        // Hiển thị thông báo thành công
      } catch (error) {
        console.error('Error adding to cart:', error)
        // Hiển thị thông báo lỗi
      }
    }

    const loadRecommendations = async () => {
      try {
        console.log('Fetching recommendations...')
        const user = store.state.auth.user
        console.log('Current user:', user)
        
        if (!user) {
          // Thử khôi phục user từ localStorage
          await store.dispatch('auth/initializeAuth')
        }
        
        const userId = store.state.auth.user?.userId
        console.log('Current user ID:', userId)
        console.log('Is authenticated:', store.state.auth.isAuthenticated)

        let response
        if (store.state.auth.isAuthenticated && userId) {
          console.log('Calling collaborative recommendations API...')
          response = await axios.get(`http://localhost:5001/api/collaborative/recommend`, {
            params: {
              user_id: userId
            }
          })
        } else {
          console.log('Calling popularity recommendations API...')
          response = await axios.get('http://localhost:5001/api/popularity/recommend', {
            params: { limit: 8 }
          })
        }

        if (response.data.success) {
          recommendedProducts.value = response.data.recommendations
        }
      } catch (error) {
        console.error('Error loading recommendations:', error)
        // Fallback to popularity
        try {
          const fallbackResponse = await axios.get('http://localhost:5001/api/popularity/recommend', {
            params: { limit: 8 }
          })
          if (fallbackResponse.data.success) {
            recommendedProducts.value = fallbackResponse.data.recommendations
          }
        } catch (fallbackError) {
          console.error('Fallback error:', fallbackError)
        }
      }
    }

    // Gọi initializeAuth khi component mounted
    onMounted(async () => {
      await store.dispatch('auth/initializeAuth')
      loadRecommendations()
    })

    // Watch auth state changes
    watch(() => store.state.auth.isAuthenticated, (newValue) => {
      console.log('Auth state changed:', newValue)
      loadRecommendations()
    })

    // Thêm isLoggedIn computed property
    const isLoggedIn = computed(() => store.state.auth.isAuthenticated)

    const currentUser = computed(() => store.state.auth.user)

    const loadCategoriesWithProducts = async () => {
      try {
        const categoriesResponse = await axiosInstance.get('/categories');
        const categoriesData = categoriesResponse.data;
        
        // Lấy preview sản phẩm cho mỗi danh mục
        const categoriesWithProducts = await Promise.all(
          categoriesData.map(async (category) => {
            const response = await axiosInstance.get(`/categories/${category.id}/preview?limit=4`);
            return {
              ...category,
              products: response.data.products
            };
          })
        );
        
        categories.value = categoriesWithProducts;
      } catch (error) {
        console.error('Lỗi khi tải danh mục và sản phẩm:', error);
      }
    };

    onMounted(() => {
      loadCategoriesWithProducts();
    });

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
      getCategoryIcon,
      handleAddToWishlist,
      handleAddToCart,
      loadRecommendations,
      isLoggedIn,
      currentUser
    }
  },
  methods: {
    // Remove these duplicate methods since they're already defined in setup()
    // handleAddToWishlist(product) {
    //   // Xử lý thêm vào wishlist
    // },
    // handleAddToCart(product) {
    //   // Xử lý thêm vào giỏ hàng
    // }
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
  .hero-section {
    padding: 40px 0;
  }
  
  .hero-content {
    text-align: center;
  }
  
  .hero-content h1 {
    font-size: 2rem;
  }
  
  .flash-card {
    margin-bottom: 20px;
  }
  
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  .product-card {
    padding: 10px;
  }
  
  .product-title {
    font-size: 0.9rem;
  }
  
  .product-price {
    font-size: 0.85rem;
  }
}

.product-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.product-card {
  transition: transform 0.3s ease;
}

.product-link:hover .product-card {
  transform: translateY(-5px);
}

.product-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 2.4em;
  color: #333;
  margin-bottom: 0.5rem;
}

.product-price {
  margin-bottom: 0.5rem;
}

.new-price {
  font-weight: bold;
  color: #dc3545;
  font-size: 1.1rem;
}

.old-price {
  font-size: 0.9rem;
}

.brand-name {
  color: #6c757d;
}

/* Giữ nguyên các styles khác */
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
  z-index: 2;
}

.product-link:hover .product-actions {
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
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.action-btn:hover {
  background: #0061f2;
  color: white;
  transform: scale(1.1);
}

.flash-card, .trending-card {
  position: relative;
}

.discount-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: #dc3545;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
  z-index: 1;
}

.trend-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background: #ffc107;
  color: #000;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
  z-index: 1;
}

.category-block {
  background: #fff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.category-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

/* Responsive styles */
@media (max-width: 768px) {
  .category-block {
    padding: 1rem;
  }
  
  .category-title {
    font-size: 1.2rem;
  }
}
</style>

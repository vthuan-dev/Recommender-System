<template>
    <div class="home">
        <!-- Hero Section -->
        <section class="hero-section">
            <div class="carousel slide" data-bs-ride="carousel">
                <div class="carousel-inner">
                    <div class="carousel-item active">
                        <div class="hero-content text-center py-5">
                            <i class="fas fa-laptop-code fa-4x mb-4 text-primary"></i>
                            <h1>Công Nghệ Hàng Đầu</h1>
                            <p>Khám phá những sản phẩm công nghệ mới nhất</p>
                            <router-link to="/products" class="btn btn-primary btn-lg">
                                Xem ngay
                            </router-link>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Featured Categories -->
        <section class="categories-section container py-5">
            <h2 class="section-title text-center mb-4">Danh Mục Sản Phẩm</h2>
            <div class="row g-4">
                <div v-for="category in categories" :key="category.id" class="col-6 col-md-3">
                    <router-link :to="`/products/${category.id}`" class="category-card">
                        <div class="card h-100 text-center border-0 shadow-sm">
                            <div class="card-body">
                                <i :class="[getCategoryIcon(category.name), 'fa-3x mb-3 text-primary']"></i>
                                <h5 class="card-title">{{ category.name }}</h5>
                            </div>
                        </div>
                    </router-link>
                </div>
            </div>
        </section>

        <!-- Flash Sale -->
        <section class="flash-sale container py-5">
            <div class="section-header d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 class="section-title mb-0">Flash Sale</h2>
                    <div class="countdown d-flex gap-2 mt-2">
                        <div class="time-block">
                            <span class="hours">24</span>
                            <small>Giờ</small>
                        </div>
                        <div class="time-block">
                            <span class="minutes">00</span>
                            <small>Phút</small>
                        </div>
                        <div class="time-block">
                            <span class="seconds">00</span>
                            <small>Giây</small>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row g-4">
                <div v-for="product in featuredProducts" :key="product.id" class="col-6 col-md-3">
                    <div class="product-card card h-100 border-0 shadow-sm">
                        <div class="position-relative text-center p-4">
                            <i class="fas fa-laptop fa-4x text-primary"></i>
                            <div class="sale-badge">-{{ product.discount }}%</div>
                        </div>
                        <div class="card-body">
                            <h5 class="product-title">{{ product.name }}</h5>
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <span class="old-price">{{ formatPrice(product.original_price) }}</span>
                                    <p class="price mb-0">{{ formatPrice(product.price) }}</p>
                                </div>
                                <button class="btn btn-primary btn-sm" @click="addToCart(product)">
                                    <i class="fas fa-cart-plus"></i>
                                </button>
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

export default {
    name: 'HomeComponent',
    setup() {
        const store = useStore()

        const heroSlides = ref([
            {
                icon: 'fas fa-sun fa-3x',
                title: 'Bộ sưu tập mùa hè 2024',
                description: 'Khám phá những xu hướng mới nhất',
                link: '/products/summer-collection'
            }
        ])

        const featuredProducts = computed(() => store.state.products.slice(0, 8))
        const categories = computed(() => store.state.categories)

        const formatPrice = (price) => {
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(price)
        }

        const getCategoryIcon = (categoryName) => {
            const icons = {
                'Laptop': 'fas fa-laptop',
                'Điện thoại': 'fas fa-mobile-alt',
                'Máy tính bảng': 'fas fa-tablet-alt',
                'Phụ kiện': 'fas fa-headphones',
                'default': 'fas fa-desktop'
            }
            return icons[categoryName] || icons.default
        }

        onMounted(() => {
            store.dispatch('fetchProducts')
            store.dispatch('fetchCategories')
        })

        return {
            heroSlides,
            featuredProducts,
            categories,
            formatPrice,
            getCategoryIcon
        }
    }
}
</script>

<style scoped>
.hero-section {
    margin-bottom: 2rem;
}

.carousel-item {
    height: 500px;
}

.carousel-item img {
    object-fit: cover;
    height: 100%;
}

.carousel-caption {
    background: rgba(0, 0, 0, 0.5);
    padding: 2rem;
    border-radius: 10px;
}

.category-icon {
    font-size: 2.5rem;
    color: var(--bs-primary);
}

.category-card:hover {
    transform: translateY(-5px);
    transition: transform 0.3s ease;
}

.product-card {
    transition: transform 0.3s ease;
}

.product-card:hover {
    transform: translateY(-5px);
}

.btn-wishlist {
    position: absolute;
    top: 10px;
    right: 10px;
    background: white;
    border: none;
    border-radius: 50%;
    width: 35px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.product-title {
    font-size: 1rem;
    margin-bottom: 0.5rem;
    height: 2.4rem;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
}

.price {
    color: var(--bs-danger);
    font-weight: bold;
}

.offer-card {
    overflow: hidden;
    border-radius: 10px;
}

.offer-content {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    padding: 2rem;
}

@media (max-width: 768px) {
    .carousel-item {
        height: 300px;
    }

    .carousel-caption {
        padding: 1rem;
    }

    .carousel-caption h2 {
        font-size: 1.5rem;
    }
}

.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
}

.time-block {
    background: #dc3545;
    color: white;
    padding: 8px 12px;
    border-radius: 6px;
    text-align: center;
    min-width: 60px;
}

.time-block span {
    font-size: 1.2rem;
    font-weight: bold;
    display: block;
}

.time-block small {
    font-size: 0.8rem;
    opacity: 0.8;
}

.flash-sale-slider {
    margin: 0 -15px;
    padding: 0 15px;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.flash-sale-slider::-webkit-scrollbar {
    display: none;
}
</style>

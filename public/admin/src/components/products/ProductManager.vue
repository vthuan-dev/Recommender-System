<!-- src/components/Products/ProductManager.vue -->
<template>
  <div class="product-manager">
    <!-- Header Section -->
    <div class="header-section">
      <h1 class="page-title">Quản lý sản phẩm</h1>
      <div class="action-buttons">
        <button class="btn btn-primary" @click="openAddModal">
          <i class="fas fa-plus"></i> Thêm sản phẩm
        </button>
        <button class="btn btn-secondary">
          <i class="fas fa-file-excel"></i> Xuất Excel
        </button>
      </div>
    </div>

    <!-- Search & Filter Section -->
    <div class="search-filter-section">
      <div class="search-box">
        <input 
          type="text" 
          v-model="filters.search" 
          class="form-control search-input" 
          placeholder="Tìm kiếm theo tên, mô tả..."
          @input="handleSearch"
        >
        <i class="fas fa-search search-icon"></i>
        <button 
          v-if="filters.search" 
          class="clear-search" 
          @click="clearSearch"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="filters-wrapper">
        <div class="filters">
          <select 
            v-model="filters.category" 
            class="form-select" 
            @change="handleFilters"
          >
            <option value="">Tất cả danh mục</option>
            <option 
              v-for="cat in categories" 
              :key="cat.id" 
              :value="cat.id"
            >
              {{ cat.name }}
            </option>
          </select>

          <select 
            v-model="filters.brand" 
            class="form-select" 
            @change="handleFilters"
          >
            <option value="">Tất cả thương hiệu</option>
            <option 
              v-for="brand in brands" 
              :key="brand.id" 
              :value="brand.id"
            >
              {{ brand.name }}
            </option>
          </select>
        </div>

        <button 
          v-if="hasActiveFilters"
          class="btn btn-light clear-filters"
          @click="clearAllFilters"
        >
          <i class="fas fa-times"></i> Xóa bộ lọc
        </button>
      </div>
    </div>

    <!-- Products Grid with No Results Message -->
    <div v-if="loading" class="loading-state">
      <i class="fas fa-spinner fa-spin"></i>
      <p>Đang tải...</p>
    </div>
    
    <div v-else-if="!products.length" class="no-results">
      <i class="fas fa-search"></i>
      <p>Không tìm thấy sản phẩm{{ hasActiveFilters ? ' phù hợp với bộ lọc' : '' }}</p>
      <button 
        v-if="hasActiveFilters"
        class="btn btn-outline-primary mt-3"
        @click="clearAllFilters"
      >
        <i class="fas fa-times"></i> Xóa bộ lọc
      </button>
    </div>

    <div v-else class="products-grid">
      <div v-for="product in products" :key="product.id" class="product-card">
        <div class="product-image">
          <img :src="product.image_url || '/placeholder.png'" :alt="product.name">
          <div class="product-actions">
            <button class="action-btn edit" @click="editProduct(product)" title="Sửa sản phẩm">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete" @click="confirmDelete(product)" title="Xóa sản phẩm">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        
        <div class="product-info">
          <div class="tags">
            <span class="category-tag">{{ product.category_name }}</span>
            <span class="brand-tag">{{ product.brand_name }}</span>
          </div>
          
          <h3 class="product-name">{{ product.name }}</h3>
          <p class="description">{{ truncateText(product.description, 100) }}</p>

          <div class="variants-section">
            <div class="variants-header">
              <span class="variants-title">{{ product.variants?.length || 0 }} Phiên bản</span>
              <span class="total-stock">Tổng: {{ calculateTotalStock(product.variants) }} sản phẩm</span>
            </div>

            <div class="variants-list">
              <div v-for="variant in product.variants?.slice(0, 3)" :key="variant.id" 
                   class="variant-item" :class="getStockClass(variant.initial_stock)">
                <div class="variant-info">
                  <span class="name">{{ variant.name }}</span>
                  <span class="stock">{{ variant.initial_stock }} sp</span>
                </div>
                <span class="price">{{ formatPrice(variant.price) }}</span>
              </div>
              
              <div v-if="product.variants?.length > 3" class="variant-more">
                + {{ product.variants.length - 3 }} phiên bản khác
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div class="pagination-section">
      <div class="pagination-info">
        <span>Hiển thị {{ products.length }} / {{ totalProducts }} sản phẩm</span>
      </div>
      <div class="pagination-controls">
        <button 
          :disabled="currentPage === 1" 
          @click="changePage(currentPage - 1)"
          class="btn btn-outline-primary"
        >
          <i class="fas fa-chevron-left"></i>
        </button>
        <span>Trang {{ currentPage }} / {{ totalPages }}</span>
        <button 
          :disabled="currentPage === totalPages" 
          @click="changePage(currentPage + 1)"
          class="btn btn-outline-primary"
        >
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <!-- Modals -->
    <ProductModal 
      v-if="showModal"
      :show="showModal"
      :is-edit="!!selectedProduct"
      :product-data="selectedProduct"
      :categories="categories"
      :brands="brands"
      @close="closeModal"
      @saved="handleProductSaved"
    />
  </div>
</template>

<script>
import { productService } from '../../services/productService'
import ProductModal from './ProductModal.vue'
import Swal from 'sweetalert2'
import { debounce } from 'lodash'

export default {
  name: 'ProductManager',
  components: {
    ProductModal
  },
  data() {
    return {
      products: [],
      categories: [],
      brands: [],
      searchQuery: '',
      selectedCategory: '',
      selectedBrand: '',
      showModal: false,
      selectedProduct: null,
      currentPage: 1,
      totalPages: 1,
      limit: 10,
      loading: false,
      filters: {
        search: '',
        category: '',
        brand: ''
      },
      debounceTimeout: null
    }
  },
  computed: {
    hasActiveFilters() {
      return this.filters.search || this.filters.category || this.filters.brand
    }
  },
  methods: {
    async fetchProducts() {
      try {
        this.loading = true
        const params = {
          page: this.currentPage,
          limit: this.limit,
          search: this.filters.search,
          category: this.filters.category,
          brand: this.filters.brand
        }
        
        const response = await productService.getProducts(params)
        console.log('Products response:', response) // Debug
        
        if (response && response.products) {
          this.products = response.products
          this.totalPages = response.totalPages
          this.totalProducts = response.totalProducts
        } else {
          console.error('Invalid response format:', response)
          this.products = []
        }
      } catch (error) {
        console.error('Error fetching products:', error)
        Swal.fire({
          icon: 'error',
          title: 'Lỗi',
          text: 'Không thể tải danh sách sản phẩm'
        })
        this.products = []
      } finally {
        this.loading = false
      }
    },

    async fetchCategories() {
      try {
        this.categories = await productService.getCategories()
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    },

    async fetchBrands() {
      try {
        this.brands = await productService.getBrands()
      } catch (error) {
        console.error('Error fetching brands:', error)
      }
    },

    handleSearch() {
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout)
      }
      
      this.debounceTimeout = setTimeout(() => {
        this.currentPage = 1
        this.fetchProducts()
      }, 300)
    },

    handleFilters() {
      this.currentPage = 1
      this.fetchProducts()
    },

    clearSearch() {
      this.filters.search = ''
      this.handleSearch()
    },

    clearAllFilters() {
      this.filters.search = ''
      this.filters.category = ''
      this.filters.brand = ''
      this.handleSearch()
    },

    async changePage(page) {
      this.currentPage = page
      await this.fetchProducts()
    },

    openAddModal() {
      this.selectedProduct = null
      this.showModal = true
    },

    async editProduct(product) {
      try {
        const productDetail = await productService.getProductDetail(product.id)
        this.selectedProduct = productDetail
        this.showModal = true
      } catch (error) {
        console.error('Error fetching product detail:', error)
      }
    },

    confirmDelete(product) {
      Swal.fire({
        title: 'Xác nhận xóa',
        text: `Bạn có chắc chắn muốn xóa sản phẩm "${product.name}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Xóa',
        cancelButtonText: 'Hủy',
        showLoaderOnConfirm: true,
        preConfirm: async () => {
          try {
            await productService.deleteProduct(product.id);
            return true;
          } catch (error) {
            Swal.showValidationMessage(
              `Lỗi: ${error.response?.data?.message || 'Không thể xóa sản phẩm'}`
            );
            return false;
          }
        },
        allowOutsideClick: () => !Swal.isLoading()
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            await this.fetchProducts(); // Refresh danh sách
            Swal.fire({
              icon: 'success',
              title: 'Đã xóa!',
              text: 'Sản phẩm đã được xóa thành công.',
              timer: 1500,
              showConfirmButton: false
            });
          } catch (error) {
            Swal.fire({
              icon: 'error',
              title: 'Lỗi!',
              text: 'Không thể tải lại danh sách sản phẩm.',
              timer: 1500
            });
          }
        }
      });
    },

    closeModal() {
      this.showModal = false
      this.selectedProduct = null
    },

    async handleProductSaved(product) {
      await this.fetchProducts()
      this.closeModal()
      Swal.fire({
        icon: 'success',
        title: 'Thành công!',
        text: 'Sản phẩm đã được lưu thành công',
        timer: 1500,
        showConfirmButton: false
      })
    },

    truncateText(text, length) {
      if (!text) return ''
      return text.length > length ? text.substring(0, length) + '...' : text
    },

    formatPrice(price) {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price)
    },

    calculateTotalStock(variants) {
      return variants.reduce((total, variant) => total + (variant.initial_stock || 0), 0)
    },

    getStockClass(stock) {
      if (stock <= 0) return 'out-of-stock'
      if (stock < 10) return 'low-stock'
      return 'in-stock'
    },

    manageInventory(product) {
      // Thêm chức năng quản lý kho sau
    },

    async handleAddProduct(newProduct) {
      try {
        const response = await productService.addProduct(newProduct);
        if (response.success) {
          // Thêm sản phẩm mới vào đầu danh sách
          this.products.unshift(response.data);
          this.$toast.success('Thêm sản phẩm thành công');
          this.closeAddModal();
        }
      } catch (error) {
        console.error('Lỗi thêm sản phẩm:', error);
        this.$toast.error('Lỗi thêm sản phẩm');
      }
    }
  },
  async mounted() {
    await Promise.all([
      this.fetchProducts(),
      this.fetchCategories(),
      this.fetchBrands()
    ])
  }
}
</script>

<style scoped>
.product-manager {
  padding: 20px;
  position: relative;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.action-buttons .btn {
  margin-left: 10px;
}

.search-filter-section {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  margin-bottom: 20px;
}

.search-box {
  position: relative;
  margin-bottom: 15px;
}

.search-input {
  padding-left: 40px;
  padding-right: 40px;
  height: 45px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.search-icon {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.clear-search {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 5px;
}

.filters-wrapper {
  display: flex;
  gap: 15px;
  align-items: center;
}

.filters {
  display: flex;
  gap: 15px;
  flex: 1;
}

.form-select {
  flex: 1;
  height: 45px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.clear-filters {
  height: 45px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 20px;
  border-radius: 8px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  color: #666;
}

.clear-filters:hover {
  background: #eeeeee;
  color: #dc3545;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.product-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.product-image {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

.product-actions {
  position: absolute;
  top: 15px;
  right: 15px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transform: translateX(10px);
  transition: all 0.3s ease;
}

.product-card:hover .product-actions {
  opacity: 1;
  transform: translateX(0);
}

.action-btn {
  width: 35px;
  height: 35px;
  border-radius: 8px;
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(5px);
}

.action-btn.edit { background: rgba(76, 175, 80, 0.9); }
.action-btn.delete { background: rgba(244, 67, 54, 0.9); }

.action-btn:hover {
  transform: scale(1.1);
}

.product-info {
  padding: 15px;
}

.tags {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.category-tag, .brand-tag {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.category-tag {
  background: #e3f2fd;
  color: #1976d2;
}

.brand-tag {
  background: #f3e5f5;
  color: #7b1fa2;
}

.product-name {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 6px;
}

.description {
  color: #666;
  font-size: 13px;
  line-height: 1.5;
  margin-bottom: 15px;
}

.variants-section {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 12px;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
}

.variants-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #dee2e6;
}

.variants-title {
  font-weight: 600;
  color: #2c3e50;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
}

.variants-title::before {
  content: '';
  display: inline-block;
  width: 8px;
  height: 8px;
  background: #4CAF50;
  border-radius: 50%;
  margin-right: 8px;
}

.total-stock {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
}

.variants-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.variant-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: white;
  border-radius: 10px;
  border: 1px solid #eee;
  transition: all 0.2s ease;
}

.variant-item:hover {
  transform: translateX(5px);
  border-color: #4CAF50;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.variant-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.variant-info .name {
  font-weight: 500;
  color: #2c3e50;
}

.variant-info .stock {
  font-size: 0.85rem;
  padding: 4px 10px;
  border-radius: 15px;
  font-weight: 500;
}

.variant-item.out-of-stock {
  border-left: 4px solid #ef5350;
}

.variant-item.low-stock {
  border-left: 4px solid #ffa726;
}

.variant-item.in-stock {
  border-left: 4px solid #66bb6a;
}

.variant-item.out-of-stock .stock {
  background: #ffebee;
  color: #d32f2f;
}

.variant-item.low-stock .stock {
  background: #fff3e0;
  color: #f57c00;
}

.variant-item.in-stock .stock {
  background: #e8f5e9;
  color: #2e7d32;
}

.price {
  font-weight: 600;
  color: #2c3e50;
  background: #f5f5f5;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 0.95rem;
}

.variant-more {
  text-align: center;
  padding: 12px;
  background: white;
  border: 2px dashed #e0e0e0;
  border-radius: 10px;
  color: #757575;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
}

.variant-more:hover {
  background: #f5f5f5;
  border-color: #9e9e9e;
  color: #424242;
}

.pagination-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  margin-top: 30px;
  background: #f8f9fa;
  border-radius: 10px;
}

.pagination-info {
  color: #6c757d;
  font-size: 0.9rem;
}

.pagination-info span {
  background: #fff;
  padding: 8px 15px;
  border-radius: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.pagination-controls button {
  width: 35px;
  height: 35px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.pagination-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-controls span {
  font-size: 0.9rem;
  color: #495057;
}

.loading-state {
  text-align: center;
  padding: 2rem;
  grid-column: 1 / -1;
  color: #666;
}

.no-products {
  text-align: center;
  padding: 2rem;
  grid-column: 1 / -1;
  color: #666;
}

.no-products i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #ccc;
}

.loading-state i {
  font-size: 2rem;
  color: #4e73df;
}

.no-results {
  text-align: center;
  padding: 50px 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  margin: 20px 0;
}

.no-results i {
  font-size: 3rem;
  color: #ccc;
  margin-bottom: 1rem;
}

.no-results p {
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.no-results .btn {
  padding: 8px 20px;
  font-size: 0.9rem;
}

.no-results .btn i {
  font-size: 0.9rem;
  color: currentColor;
  margin-right: 5px;
  margin-bottom: 0;
}

@media (min-width: 1400px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 1200px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
}

@media (max-width: 768px) {
  .filters-wrapper {
    flex-direction: column;
  }
  
  .filters {
    flex-direction: column;
  }
  
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }

  .pagination-section {
    flex-direction: column;
    gap: 15px;
  }
}
</style>
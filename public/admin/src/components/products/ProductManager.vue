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
          v-model="searchQuery" 
          class="form-control" 
          placeholder="Tìm kiếm theo tên, mô tả..."
          @input="handleSearch"
        >
        <i class="fas fa-search search-icon"></i>
      </div>
      <div class="filters">
        <select v-model="selectedCategory" class="form-select" @change="handleSearch">
          <option value="">Tất cả danh mục</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.name }}
          </option>
        </select>
        <select v-model="selectedBrand" class="form-select" @change="handleSearch">
          <option value="">Tất cả thương hiệu</option>
          <option v-for="brand in brands" :key="brand.id" :value="brand.id">
            {{ brand.name }}
          </option>
        </select>
      </div>
    </div>

    <!-- Products Grid -->
    <div class="products-grid">
      <div v-if="loading" class="loading-state">
        <i class="fas fa-spinner fa-spin"></i> Đang tải...
      </div>
      
      <div v-else-if="products.length === 0" class="no-products">
        <i class="fas fa-box-open"></i>
        <p>Không có sản phẩm nào</p>
      </div>

      <div v-else v-for="product in products" :key="product.id" class="product-card">
        <div class="product-image">
          <img :src="product.image_url || '/placeholder.png'" :alt="product.name">
        </div>
        <div class="product-info">
          <h3>{{ product.name }}</h3>
          <p class="description">{{ truncateText(product.description, 100) }}</p>
          <div class="tags">
            <span class="category-tag">{{ product.category_name }}</span>
            <span class="brand-tag">{{ product.brand_name }}</span>
          </div>
          <div class="variants-info">
            <span>{{ product.variants?.length || 0 }} biến thể</span>
          </div>
        </div>
        <div class="product-actions">
          <button class="btn btn-edit" @click="editProduct(product)">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-delete" @click="confirmDelete(product)">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div class="pagination-section">
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

    <!-- Modals -->
    <ProductModal 
      v-if="showModal"
      :show="showModal"
      :product="selectedProduct"
      :categories="categories"
      :brands="brands"
      @close="closeModal"
      @save="saveProduct"
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
      limit: 12,
      loading: false
    }
  },
  methods: {
    async fetchProducts() {
      try {
        this.loading = true
        const params = {
          page: this.currentPage,
          limit: this.limit,
          search: this.searchQuery || '',
          category_id: this.selectedCategory || '',
          brand_id: this.selectedBrand || ''
        }
        
        const response = await productService.getProducts(params)
        console.log('Products response:', response) // Debug
        
        if (response && response.products) {
          this.products = response.products
          this.totalPages = response.totalPages
          this.currentPage = response.currentPage
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

    handleSearch: debounce(function() {
      this.currentPage = 1
      this.fetchProducts()
    }, 300),

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
        cancelButtonText: 'Hủy'
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            await productService.deleteProduct(product.id)
            await this.fetchProducts() // Refresh danh sách
            Swal.fire(
              'Đã xóa!',
              'Sản phẩm đã được xóa thành công.',
              'success'
            )
          } catch (error) {
            Swal.fire(
              'Lỗi!',
              error.message || 'Không thể xóa sản phẩm.',
              'error'
            )
          }
        }
      })
    },

    closeModal() {
      this.showModal = false
      this.selectedProduct = null
    },

    async saveProduct() {
      await this.fetchProducts()
      this.closeModal()
    },

    truncateText(text, length) {
      if (!text) return ''
      return text.length > length ? text.substring(0, length) + '...' : text
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
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}

.search-box {
  position: relative;
  flex: 1;
}

.search-icon {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
}

.filters {
  display: flex;
  gap: 15px;
}

.filters select {
  min-width: 200px;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.product-card {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  overflow: hidden;
  transition: transform 0.2s;
}

.product-card:hover {
  transform: translateY(-5px);
}

.product-image {
  height: 200px;
  overflow: hidden;
}

.product-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  padding: 15px;
}

.product-info h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #2c3e50;
}

.description {
  color: #666;
  font-size: 14px;
  margin-bottom: 10px;
}

.tags {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.category-tag, .brand-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.category-tag {
  background: #e3f2fd;
  color: #1976d2;
}

.brand-tag {
  background: #f3e5f5;
  color: #7b1fa2;
}

.variants-info {
  font-size: 13px;
  color: #666;
}

.product-actions {
  padding: 15px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-edit, .btn-delete {
  padding: 8px;
  border-radius: 6px;
}

.btn-edit {
  background: #4caf50;
  color: white;
}

.btn-delete {
  background: #f44336;
  color: white;
}

.pagination-section {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-top: 30px;
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

@media (max-width: 768px) {
  .search-filter-section {
    flex-direction: column;
  }
  
  .filters {
    flex-direction: column;
  }
  
  .products-grid {
    grid-template-columns: 1fr;
  }
}
</style>
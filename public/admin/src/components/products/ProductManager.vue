<!-- src/components/Products/ProductManager.vue -->
<template>
    <div>
      <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
        <h1 class="h2">Quản lý sản phẩm</h1>
        <div class="btn-toolbar mb-2 mb-md-0">
          <div class="btn-group me-2">
            <button type="button" class="btn btn-sm btn-outline-secondary" @click="openAddModal">
              Thêm mới
            </button>
            <button type="button" class="btn btn-sm btn-outline-secondary">
              Xuất Excel
            </button>
          </div>
        </div>
      </div>
  
      <!-- Search Bar -->
      <div class="search-container mb-4">
        <div class="search-wrapper">
          <input 
            type="text" 
            v-model="searchQuery" 
            class="form-control" 
            placeholder="Tìm kiếm sản phẩm..."
          >
          <button class="btn btn-primary" @click="searchProducts">
            <i class="fas fa-search"></i>
          </button>
        </div>
      </div>
  
      <!-- Products Table -->
      <div class="table-responsive">
        <table class="table table-hover product-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Hình ảnh</th>
              <th>Tên sản phẩm</th>
              <th>Mô tả</th>
              <th>Danh mục</th>
              <th>Thương hiệu</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in products" :key="product.id">
              <td>{{ product.id }}</td>
              <td>
                <img :src="product.image" alt="product" class="product-image" />
              </td>
              <td>{{ product.name }}</td>
              <td>{{ product.description }}</td>
              <td>{{ product.category }}</td>
              <td>{{ product.brand }}</td>
              <td>
                <button class="btn btn-sm btn-primary me-2" @click="editProduct(product)">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" @click="deleteProduct(product.id)">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
  
      <!-- Add/Edit Product Modal -->
      <ProductModal 
        v-if="showModal"
        :show="showModal"
        :product="selectedProduct"
        @close="closeModal"
        @save="saveProduct"
      />
    </div>
  </template>
  
  <script>
  import ProductModal from './ProductModal.vue'
  
  export default {
    name: 'ProductManager',
    components: {
      ProductModal
    },
    data() {
      return {
        products: [],
        searchQuery: '',
        showModal: false,
        selectedProduct: null,
        categories: [],
        brands: []
      }
    },
    methods: {
      async fetchProducts() {
        try {
          const token = localStorage.getItem('adminToken')
          const response = await fetch('/admin/products', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
          const data = await response.json()
          this.products = data
        } catch (error) {
          console.error('Error fetching products:', error)
        }
      },
      openAddModal() {
        this.selectedProduct = null
        this.showModal = true
      },
      closeModal() {
        this.showModal = false
        this.selectedProduct = null
      },
      async saveProduct(productData) {
        // Implementation for saving product
      },
      editProduct(product) {
        this.selectedProduct = product
        this.showModal = true
      },
      async deleteProduct(productId) {
        // Implementation for deleting product
      }
    },
    mounted() {
      this.fetchProducts()
    }
  }
  </script>
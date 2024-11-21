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
        <button class="btn btn-secondary" @click="exportToExcel">
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

    <div v-else class="table-responsive">
      <table class="table">
        <thead>
          <tr>
            <th style="width: 50px">
              <input type="checkbox" v-model="selectAll" @change="handleSelectAll">
            </th>
            <th style="width: 70px">Hình ảnh</th>
            <th style="width: 200px">Tên sản phẩm</th>
            <th style="width: 150px">Danh mục</th>
            <th style="width: 150px">Thương hiệu</th>
            <th style="width: 100px">Số phiên bản</th>
            <th style="width: 100px">Tổng tồn</th>
            <th style="width: 150px">Giá thấp nhất</th>
            <th style="width: 150px">Giá cao nhất</th>
            <th style="width: 120px">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="product in products" :key="product.id">
            <!-- Main product row -->
            <tr :class="{ 'expanded': expandedProduct === product.id }" @click="toggleProductDetails(product.id)">
              <td>
                <input 
                  type="checkbox" 
                  v-model="selectedProducts" 
                  :value="product.id"
                  @click.stop
                >
              </td>
              <td>
                <img 
                  :src="getImageUrl(product.image_url)" 
                  :alt="product.name"
                  class="product-thumbnail"
                  @error="handleImageError"
                >
              </td>
              <td>
                <div class="product-name-cell">
                  <span class="product-name">{{ product.name }}</span>
                  <small class="product-description">
                    {{ truncateText(product.description, 50) }}
                  </small>
                </div>
              </td>
              <td>
                <span class="category-badge">
                  {{ product.category_name }}
                </span>
              </td>
              <td>
                <span class="brand-badge">
                  {{ product.brand_name }}
                </span>
              </td>
              <td class="text-center">
                {{ product.variants?.length || 0 }}
              </td>
              <td class="text-center">
                <span :class="getStockClass(calculateTotalStock(product.variants))">
                  {{ calculateTotalStock(product.variants) }}
                </span>
              </td>
              <td>{{ formatPrice(getMinPrice(product.variants)) }}</td>
              <td>{{ formatPrice(getMaxPrice(product.variants)) }}</td>
              <td>
                <div class="action-buttons">
                  <button 
                    class="btn btn-sm btn-outline-primary"
                    @click="editProduct(product)"
                    title="Sửa"
                  >
                    <i class="fas fa-edit"></i>
                  </button>
                  <button 
                    class="btn btn-sm btn-outline-danger" 
                    title="Xóa"
                    :disabled="isDeleting && productToDelete === product.id"
                    @click="confirmDelete(product, $event)"
                  >
                    <i class="fas fa-spinner fa-spin" v-if="isDeleting && productToDelete === product.id"></i>
                    <i class="fas fa-trash" v-else></i>
                  </button>
                </div>
              </td>
            </tr>
            
            <!-- Variants detail row -->
            <tr v-if="expandedProduct === product.id" class="variant-details">
              <td colspan="10">
                <div class="variants-wrapper">
                  <h5>Phiên bản sản phẩm ({{ product.variants?.length || 0 }})</h5>
                  <table class="variants-table">
                    <thead>
                      <tr>
                        <th>Tên phiên bản</th>
                        <th>SKU</th>
                        <th>Giá bán</th>
                        <th>Tồn kho</th>
                        <th>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="variant in product.variants" :key="variant.id">
                        <td>{{ variant.name }}</td>
                        <td>{{ variant.sku }}</td>
                        <td>{{ formatPrice(variant.price) }}</td>
                        <td>
                          <span :class="getStockClass(variant.initial_stock)">
                            {{ variant.initial_stock }}
                          </span>
                        </td>
                        <td>
                          <span class="status-badge" :class="variant.status ? 'active' : 'inactive'">
                            {{ variant.status ? 'Đang bán' : 'Ngừng bán' }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Bulk Actions -->
    <div v-if="selectedProducts.length" class="bulk-actions">
      <span>Đã chọn {{ selectedProducts.length }} sản phẩm</span>
      <button class="btn btn-danger" @click="deleteBulk">
        <i class="fas fa-trash"></i> Xóa đã chọn
      </button>
    </div>

    <!-- Pagination -->
    <div class="pagination-wrapper">
      <div class="pagination-info">
        Hiển thị {{ startItem }}-{{ endItem }} / {{ totalItems }} sản phẩm
      </div>

      <div class="pagination">
        <button 
          class="pagination-btn first" 
          :disabled="currentPage === 1"
          @click="goToPage(1)"
        >
          <i class="fas fa-angle-double-left"></i>
        </button>

        <button 
          class="pagination-btn prev" 
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >
          <i class="fas fa-angle-left"></i>
        </button>

        <template v-for="page in visiblePages" :key="page">
          <button 
            v-if="page !== '...'"
            class="pagination-btn number" 
            :class="{ active: page === currentPage }"
            @click="goToPage(page)"
          >
            {{ page }}
          </button>
          <span v-else class="pagination-ellipsis">...</span>
        </template>

        <button 
          class="pagination-btn next" 
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >
          <i class="fas fa-angle-right"></i>
        </button>

        <button 
          class="pagination-btn last" 
          :disabled="currentPage === totalPages"
          @click="goToPage(totalPages)"
        >
          <i class="fas fa-angle-double-right"></i>
        </button>
      </div>

      <div class="per-page-selector">
        <select v-model="perPage" @change="handlePerPageChange">
          <option :value="10">10 / trang</option>
          <option :value="20">20 / trang</option>
          <option :value="50">50 / trang</option>
          <option :value="100">100 / trang</option>
        </select>
      </div>
    </div>

    <!-- Separate modals for add and edit -->
    <ProductModal
      v-if="showAddModal"
      :show="showAddModal"
      @close="closeAddModal"
      @product-saved="handleProductSaved"
    />

    <EditProductModal
      v-if="showEditModal"
      :show="showEditModal"
      :product="selectedProduct"
      @close="closeEditModal"
      @product-updated="handleProductUpdated"
    />

    <!-- Thêm modal xác nhận xóa -->
    <div class="modal fade" id="deleteModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Xác nhận xóa</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            Bạn có chắc chắn muốn xóa sản phẩm này?
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Hủy</button>
            <button type="button" class="btn btn-danger" @click="deleteProduct" :disabled="isDeleting">
              <i class="fas fa-spinner fa-spin" v-if="isDeleting"></i>
              {{ isDeleting ? 'Đang xóa...' : 'Xóa' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { productService } from '@/services/productService'
import ProductModal from './ProductModal.vue'
import EditProductModal from './EditProductModal.vue'
import Swal from 'sweetalert2'
import path from 'path'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

// State variables
const products = ref([])
const loading = ref(true)
const showAddModal = ref(false)
const showEditModal = ref(false)
const selectedProduct = ref(null)
const currentPage = ref(1)
const totalPages = ref(0)
const totalProducts = ref(0)
const selectedProducts = ref([])
const selectAll = ref(false)

const filters = ref({
  search: '',
  category: '',
  brand: ''
})

const categories = ref([])
const brands = ref([])

// Computed property để kiểm tra có filter nào đang active khng
const hasActiveFilters = computed(() => {
  return filters.value.search || filters.value.category || filters.value.brand
})

// Thêm các ref mới
const perPage = ref(10)
const itemsPerPage = ref(10)

// Thêm các computed properties cho phân trang
const startItem = computed(() => {
  if (totalProducts.value === 0) return 0;
  return (currentPage.value - 1) * perPage.value + 1;
});

const endItem = computed(() => {
  const end = currentPage.value * perPage.value;
  return end > totalProducts.value ? totalProducts.value : end;
});

const totalItems = computed(() => totalProducts.value);

const visiblePages = computed(() => {
  const total = totalPages.value;
  const current = currentPage.value;
  const delta = 2;
  const range = [];
  
  for (let i = 1; i <= total; i++) {
    if (
      i === 1 || // Luôn hiển thị trang đầu
      i === total || // Luôn hiển thị trang cuối
      (i >= current - delta && i <= current + delta) // Hiển thị các trang xung quanh trang hiện tại
    ) {
      range.push(i);
    } else if (range[range.length - 1] !== '...') {
      range.push('...');
    }
  }
  
  return range;
});

// Fetch products với xử lý loading state
const fetchProducts = async () => {
  try {
    loading.value = true;
    const response = await productService.getProducts({
      page: currentPage.value,
      limit: perPage.value, // Thêm limit vào params
      ...filters.value
    });
    
    if (response && response.products) {
      products.value = response.products;
      totalPages.value = response.totalPages;
      totalProducts.value = response.totalProducts;
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    products.value = [];
  } finally {
    loading.value = false;
  }
};

const fetchCategories = async () => {
  try {
    const data = await productService.getCategories()
    categories.value = data
  } catch (error) {
    console.error('Error fetching categories:', error)
  }
}

const fetchBrands = async () => {
  try {
    const data = await productService.getBrands()
    brands.value = data
  } catch (error) {
    console.error('Error fetching brands:', error)
  }
}

onMounted(async () => {
  await Promise.all([
    fetchProducts(),
    fetchCategories(),
    fetchBrands()
  ])
})

// Hàm mở modal
const openAddModal = () => {
  showAddModal.value = true
}

const closeAddModal = () => {
  showAddModal.value = false
}

// Xử lý khi lưu sản phẩm
const handleProductSaved = async (newProduct) => {
  // Nếu đang ở trang đầu tiên, thêm sản phẩm mới vào đầu danh sách
  if (currentPage.value === 1) {
    products.value = [newProduct, ...products.value];
    // Nếu danh sách vượt quá items per page, xóa item cuối
    if (products.value.length > itemsPerPage) {
      products.value.pop();
    }
  }
  
  // Cập nhật tổng số sản phẩm
  totalProducts.value++;
  
  // Tính lại tổng số trang
  totalPages.value = Math.ceil(totalProducts.value / itemsPerPage);
  
  // Tải lại danh sách nếu không ở trang đầu
  if (currentPage.value !== 1) {
    await loadProducts();
  }
}

const handleSearch = async () => {
  currentPage.value = 1
  await fetchProducts()
}

const handleFilters = async () => {
  currentPage.value = 1
  await fetchProducts()
}

const clearSearch = () => {
  filters.value.search = ''
  handleSearch()
}

const clearAllFilters = () => {
  filters.value.search = ''
  filters.value.category = ''
  filters.value.brand = ''
  handleSearch()
}

const editProduct = (product) => {
  selectedProduct.value = product
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  selectedProduct.value = null
}

const handleProductUpdated = async (updatedProduct) => {
  await fetchProducts() // Refresh product list
  closeEditModal()
}

// Helper functions
const truncateText = (text, length) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price)
}

const calculateTotalStock = (variants) => {
  if (!variants) return 0
  return variants.reduce((total, variant) => total + (parseInt(variant.initial_stock) || 0), 0)
}

const getStockClass = (stock) => {
  stock = parseInt(stock) || 0
  if (stock === 0) return 'stock-badge stock-out'
  if (stock < 10) return 'stock-badge stock-low'
  return 'stock-badge stock-ok'
}

// Thêm các computed và methods mới
const getMinPrice = (variants) => {
  if (!variants?.length) return 0;
  return Math.min(...variants.map(v => v.price));
};

const getMaxPrice = (variants) => {
  if (!variants?.length) return 0;
  return Math.max(...variants.map(v => v.price));
};

// Add new ref for expanded product
const expandedProduct = ref(null)

// Add new method to toggle product details
const toggleProductDetails = (productId) => {
  expandedProduct.value = expandedProduct.value === productId ? null : productId
}

const getImageUrl = (url) => {
  if (!url) return 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj2GqhUbpEqRxJvzyk3TvXjZ0drENlUZUtyUEf0SxgT9s6QJfEt2X6WHORiJBreix1VMbi8Qi1Pgqel1G3nWElQywahVfUI8U6kfjMfELukWOsWbJorp0ODdBL2oJXOLft-XRu02-r_WIw/s580/placeholder-image.jpg';
  if (url.startsWith('http')) return url;
  
  // Sửa lại đường dẫn để match với cấu hình trong app.js
  return `${import.meta.env.VITE_API_URL}/assets/uploads/products/${path.basename(url)}`;
};

const handleImageError = (e) => {
  e.target.src = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj2GqhUbpEqRxJvzyk3TvXjZ0drENlUZUtyUEf0SxgT9s6QJfEt2X6WHORiJBreix1VMbi8Qi1Pgqel1G3nWElQywahVfUI8U6kfjMfELukWOsWbJorp0ODdBL2oJXOLft-XRu02-r_WIw/s580/placeholder-image.jpg';
};

// Thêm methods xử lý phân trang
const goToPage = async (page) => {
  if (page === currentPage.value) return;
  currentPage.value = page;
  await fetchProducts();
};

const handlePerPageChange = async () => {
  currentPage.value = 1;
  itemsPerPage.value = perPage.value;
  await fetchProducts();
};

// Thêm state cho việc xóa
const isDeleting = ref(false)
const productToDelete = ref(null)

// Thêm method xử lý xóa
const confirmDelete = async (product, event) => {
  // Ngăn sự kiện click lan ra ngoài (tránh mở expanded row)
  event.stopPropagation()
  
  try {
    const result = await Swal.fire({
      title: 'Xác nhận xóa?',
      text: `Bạn có chắc chắn muốn xóa sản phẩm "${product.name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    })

    if (result.isConfirmed) {
      isDeleting.value = true
      productToDelete.value = product.id
      
      try {
        await productService.deleteProduct(product.id)
        
        // Cập nhật UI
        products.value = products.value.filter(p => p.id !== product.id)
        totalProducts.value--
        
        // Tính lại tổng số trang
        totalPages.value = Math.ceil(totalProducts.value / itemsPerPage.value)
        
        // Nếu xóa hết sản phẩm ��� trang hiện tại, load trang trớc đó
        if (products.value.length === 0 && currentPage.value > 1) {
          currentPage.value--
          await fetchProducts()
        }
        
        Swal.fire(
          'Đã xóa!',
          'Sản phẩm đã được xóa thành công.',
          'success'
        )
      } catch (error) {
        console.error('Error deleting product:', error)
        Swal.fire(
          'Lỗi!',
          'Không thể xóa sản phẩm. Vui lòng thử lại sau.',
          'error'
        )
      }
    }
  } catch (error) {
    console.error('Error in delete confirmation:', error)
  } finally {
    isDeleting.value = false
    productToDelete.value = null
  }
}

// Thêm method xuất Excel
const exportToExcel = async () => {
  try {
    // Hiển thị loading
    Swal.fire({
      title: 'Đang xuất Excel',
      text: 'Vui lòng đợi trong giây lát...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading()
      }
    })

    // Lấy toàn bộ dữ liệu
    const response = await productService.getAllProducts()
    const productsData = response.products

    // Định dạng dữ liệu cho Excel
    const excelData = productsData.map((product, index) => ({
      'STT': index + 1,
      'Mã SP': product.id,
      'Tên sản phẩm': product.name,
      'Danh mục': product.category_name || '',
      'Thương hiệu': product.brand_name || '',
      'Mô tả': product.description || '',
      'Số phiên bản': product.variants?.length || 0,
      'Tổng tồn kho': calculateTotalStock(product.variants),
      'Giá thấp nhất': product.min_price ? Number(product.min_price) : 0,
      'Giá cao nhất': product.max_price ? Number(product.max_price) : 0,
      'Trạng thái': product.status ? 'Đang bán' : 'Ngừng bán',
      'Ngày tạo': product.created_at ? new Date(product.created_at).toLocaleDateString('vi-VN') : '',
      'Cập nhật lần cuối': product.updated_at ? new Date(product.updated_at).toLocaleDateString('vi-VN') : ''
    }))

    // Tạo worksheet
    const ws = XLSX.utils.json_to_sheet(excelData, {
      header: Object.keys(excelData[0])
    })

    // Điều chỉnh độ rộng cột
    const colWidths = Object.keys(excelData[0]).map(key => ({
      wch: Math.max(
        key.length,
        ...excelData.map(row => String(row[key] || '').length)
      )
    }))
    ws['!cols'] = colWidths

    // Tạo workbook
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Danh sách sản phẩm')

    // Xuất file
    const excelBuffer = XLSX.write(wb, { 
      bookType: 'xlsx', 
      type: 'array',
      bookSST: false
    })
    
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    })

    // Tạo tên file với timestamp
    const fileName = `products_${new Date().toISOString().slice(0,10)}.xlsx`
    
    // Lưu file
    saveAs(blob, fileName)

    // Đóng loading và hiển thị thông báo thành công
    Swal.fire({
      icon: 'success',
      title: 'Xuất Excel thành công!',
      text: `File đã được tải xuống với tên "${fileName}"`,
      timer: 2000,
      showConfirmButton: false
    })

  } catch (error) {
    console.error('Error exporting to Excel:', error)
    Swal.fire({
      icon: 'error',
      title: 'Lỗi xuất Excel',
      text: 'Có lỗi xảy ra khi xuất file Excel. Vui lòng thử lại sau.'
    })
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

.pagination-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.pagination-info {
  color: #6c757d;
  font-size: 0.9rem;
}

.pagination {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.pagination-btn {
  min-width: 36px;
  height: 36px;
  padding: 0 0.5rem;
  border: 1px solid #dee2e6;
  background: white;
  color: #333;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination-btn:hover:not(:disabled) {
  background: #e9ecef;
  border-color: #dee2e6;
  color: #0d6efd;
}

.pagination-btn.active {
  background: #0d6efd;
  border-color: #0d6efd;
  color: white;
}

.pagination-btn:disabled {
  background: #f8f9fa;
  border-color: #dee2e6;
  color: #6c757d;
  cursor: not-allowed;
}

.pagination-ellipsis {
  color: #6c757d;
  padding: 0 0.5rem;
}

.per-page-selector select {
  padding: 0.375rem 2rem 0.375rem 0.75rem;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
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

/* Thêm styles mới cho dạng bảng */
.table-responsive {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  margin-bottom: 20px;
}

.table {
  margin-bottom: 0;
}

.table th {
  background: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
  padding: 12px;
  font-weight: 600;
  color: #495057;
}

.table td {
  padding: 12px;
  vertical-align: middle;
}

.product-thumbnail {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
}

.product-name-cell {
  display: flex;
  flex-direction: column;
}

.product-name {
  font-weight: 500;
}

.product-description {
  color: #6c757d;
  font-size: 0.85rem;
}

.category-badge, .brand-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
}

.category-badge {
  background: #e3f2fd;
  color: #1976d2;
}

.brand-badge {
  background: #f3e5f5;
  color: #7b1fa2;
}

.stock-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 500;
}

.stock-out {
  background: #ffebee;
  color: #d32f2f;
}

.stock-low {
  background: #fff3e0;
  color: #f57c00;
}

.stock-ok {
  background: #e8f5e9;
  color: #2e7d32;
}

.action-buttons {
  display: flex;
  gap: 5px;
}

.bulk-actions {
  margin-top: 15px;
  padding: 10px;
  background: #fff3cd;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Add these new styles */
.expanded {
  background-color: #f8f9fa;
}

.variant-details {
  background-color: #f8f9fa;
}

.variants-wrapper {
  padding: 15px;
}

.variants-wrapper h5 {
  margin-bottom: 15px;
  color: #2c3e50;
}

.variants-table {
  width: 100%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.variants-table th,
.variants-table td {
  padding: 12px;
  border: 1px solid #eee;
}

.variants-table thead {
  background: #f8f9fa;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
}

.status-badge.active {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-badge.inactive {
  background: #ffebee;
  color: #d32f2f;
}

tr {
  cursor: pointer;
}

tr:hover {
  background-color: #f5f5f5;
}

/* Thêm styles cho modal và nút xóa */
.btn-outline-danger {
  padding: 0.25rem 0.5rem;
}

.btn-outline-danger:hover {
  background-color: #dc3545;
  color: white;
}

.modal-footer .btn-danger:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.fa-spinner {
  margin-right: 0.5rem;
}
</style>

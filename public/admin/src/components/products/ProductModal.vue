<!-- src/components/products/ProductModal.vue -->
<template>
  <Teleport to="body">
    <div class="modal-wrapper" v-if="show">
      <div class="modal-backdrop" @click="$emit('close')"></div>
      <div class="modal-container">
        <div class="modal-content">
          <div class="modal-header">
            <div class="d-flex align-items-center">
              <i class="fas fa-box-open me-2"></i>
              <h5 class="modal-title mb-0">
                {{ isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới' }}
              </h5>
            </div>
            <button 
              type="button" 
              class="btn-close ms-auto" 
              @click="$emit('close')" 
              aria-label="Đóng"
            ></button>
          </div>

          <div class="modal-body">
            <form @submit.prevent="handleSubmit" enctype="multipart/form-data">
              <div class="section-wrapper">
                <h6 class="section-title">
                  <i class="fas fa-info-circle me-2"></i>Thông tin cơ bản
                </h6>
                
                <div class="mb-4">
                  <label class="form-label required">Tên sản phẩm</label>
                  <input 
                    type="text" 
                    class="form-control form-control-lg" 
                    v-model="formData.name"
                    placeholder="Nhập tên sản phẩm (VD: iPhone 15 Pro Max)"
                    required
                    :class="{'is-invalid': errors.name}"
                  >
                  <div class="invalid-feedback">{{ errors.name }}</div>
                </div>

                <div class="mb-4">
                  <label class="form-label required">Mô tả sản phẩm</label>
                  <textarea 
                    class="form-control" 
                    v-model="formData.description"
                    placeholder="Mô tả chi tiết về sản phẩm..."
                    rows="4"
                    required
                    :class="{'is-invalid': errors.description}"
                  ></textarea>
                  <div class="invalid-feedback">{{ errors.description }}</div>
                </div>

                <div class="row">
                  <div class="col-md-6 mb-4">
                    <label class="form-label required">Danh mục</label>
                    <select 
                      class="form-select form-select-lg" 
                      v-model="formData.category_id"
                      required
                      :class="{'is-invalid': errors.category_id}"
                    >
                      <option value="">-- Chọn danh mục --</option>
                      <option v-for="category in categories" :key="category.id" :value="category.id">
                        {{ category.name }}
                      </option>
                    </select>
                    <div class="invalid-feedback">{{ errors.category_id }}</div>
                  </div>

                  <div class="col-md-6 mb-4">
                    <label class="form-label required">Thương hiệu</label>
                    <select 
                      class="form-select form-select-lg"
                      v-model="formData.brand_id"
                      required
                      :class="{'is-invalid': errors.brand_id}"
                    >
                      <option value="">-- Chọn thương hiệu --</option>
                      <option v-for="brand in brands" :key="brand.id" :value="brand.id">
                        {{ brand.name }}
                      </option>
                    </select>
                    <div class="invalid-feedback">{{ errors.brand_id }}</div>
                  </div>
                </div>
              </div>

              <div class="section-wrapper">
                <h6 class="section-title">
                  <i class="fas fa-image me-2"></i>Hình ảnh sản phẩm
                </h6>
                
                <div class="image-upload-wrapper" @click="triggerFileInput">
                  <input
                    type="file"
                    ref="fileInput"
                    @change="handleImageChange"
                    accept="image/*"
                    class="hidden-input"
                  >
                  <div v-if="imagePreview" class="preview-wrapper">
                    <img :src="getImageUrl(imagePreview)" class="preview-image">
                    <button @click.stop="removeImage" class="remove-image">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                  <div v-else class="upload-placeholder">
                    <i class="fas fa-cloud-upload-alt"></i>
                    <p>Click để tải ảnh lên</p>
                  </div>
                </div>
              </div>

              <div class="section-wrapper">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <h6 class="section-title mb-0">
                    <i class="fas fa-tags me-2"></i>Phiên bản sản phẩm
                  </h6>
                  <button type="button" class="btn btn-primary btn-sm" @click="addVariant">
                    <i class="fas fa-plus me-1"></i>Thêm phiên bản
                  </button>
                </div>

                <div class="variants-container">
                  <TransitionGroup name="variant">
                    <div v-for="(variant, index) in formData.variants" 
                         :key="index" 
                         class="variant-item">
                      <div class="row g-3">
                        <div class="col-md-4">
                          <label class="form-label required">Tên phiên bản</label>
                          <input type="text" 
                                 class="form-control" 
                                 v-model="variant.name"
                                 placeholder="VD: 256GB - Đen"
                                 required>
                        </div>
                        <div class="col-md-3">
                          <label class="form-label required">Giá (VNĐ)</label>
                          <input type="number" 
                                 class="form-control" 
                                 v-model="variant.price"
                                 placeholder="Nhập giá"
                                 required>
                        </div>
                        <div class="col-md-3">
                          <label class="form-label required">Số lượng</label>
                          <input type="number" 
                                 class="form-control" 
                                 v-model="variant.initial_stock"
                                 placeholder="Nhập số lượng"
                                 required 
                                 min="0">
                        </div>
                        <div class="col-md-2 d-flex align-items-end">
                          <button type="button" 
                                  class="btn btn-outline-danger w-100"
                                  @click="removeVariant(index)">
                            <i class="fas fa-trash-alt"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </TransitionGroup>
                </div>
              </div>
            </form>
          </div>

          <div class="modal-footer">
            <button type="button" 
                    class="btn btn-light btn-lg" 
                    @click="$emit('close')">
              <i class="fas fa-times me-1"></i>Hủy bỏ
            </button>
            <button type="button"
                    class="btn btn-primary btn-lg"
                    @click="handleSubmit"
                    :disabled="isSubmitting">
              <i class="fas fa-save me-1"></i>
              <span v-if="isSubmitting" class="spinner-border spinner-border-sm me-1"></span>
              {{ isSubmitting ? 'Đang lưu...' : 'Lưu sản phẩm' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { productService } from '@/services/productService'
import Swal from 'sweetalert2'

const props = defineProps({
  show: Boolean,
  editingProduct: Object
})

const emit = defineEmits(['close', 'save'])

// Khai báo reactive states
const formData = ref({
  name: '',
  description: '',
  category_id: '',
  brand_id: '',
  image: null,
  variants: [{
    name: '',
    price: 0,
    initial_stock: 0
  }]
})

const errors = ref({})
const isSubmitting = ref(false)
const imagePreview = ref('')
const categories = ref([])
const brands = ref([])

// Methods
const handleSubmit = async () => {
  try {
    if (!validateForm()) return;
    
    isSubmitting.value = true;
    
    // Tạo FormData object
    const submitData = new FormData();
    submitData.append('name', formData.value.name);
    submitData.append('description', formData.value.description);
    submitData.append('category_id', formData.value.category_id);
    submitData.append('brand_id', formData.value.brand_id);
    submitData.append('variants', JSON.stringify(formData.value.variants));
    
    if (formData.value.image) {
      submitData.append('image', formData.value.image);
    }

    let response;
    
    // Kiểm tra xem đang thêm mới hay cập nhật
    if (props.editingProduct) {
      // Nếu là cập nhật, gọi API update
      response = await productService.updateProduct(props.editingProduct.id, submitData);
    } else {
      // Nếu là thêm mới, gọi API create
      response = await productService.createProduct(submitData);
    }

    if (response.success) {
      // Hiển thị thông báo thành công
      Swal.fire({
        icon: 'success',
        title: 'Thành công!',
        text: props.editingProduct ? 'Cập nhật sản phẩm thành công' : 'Thêm sản phẩm mới thành công',
        timer: 1500,
        showConfirmButton: false
      });
      
      // Emit event với data sản phẩm
      emit('product-saved', response.data);
      emit('close');
    }
  } catch (error) {
    console.error('Error submitting form:', error);
    Swal.fire({
      icon: 'error',
      title: 'Lỗi!',
      text: error.message || 'Có lỗi xảy ra khi xử lý sản phẩm',
    });
  } finally {
    isSubmitting.value = false;
  }
};

// Lifecycle hooks
const fetchInitialData = async () => {
  try {
    const [categoriesData, brandsData] = await Promise.all([
      productService.getCategories(),
      productService.getBrands()
    ])
    categories.value = categoriesData
    brands.value = brandsData
  } catch (error) {
    console.error('Lỗi khi tải dữ liệu:', error)
  }
}

onMounted(() => {
  fetchInitialData()
  if (props.isEdit && props.productData) {
    Object.assign(formData.value, props.productData)
  }
})

watch(props.show, (newVal) => {
  if (newVal) {
    document.body.classList.add('modal-open')
  } else {
    document.body.classList.remove('modal-open')
  }
})

watch(() => props.editingProduct, (newVal) => {
  if (newVal) {
    // Cập nhật formData với dữ liệu sản phẩm
    formData.value = {
      name: newVal.name,
      description: newVal.description,
      category_id: newVal.category_id,
      brand_id: newVal.brand_id,
      image_url: newVal.image_url,
      variants: newVal.variants || []
    };
    // Cập nhật preview ảnh nếu có
    if (newVal.image_url) {
      imagePreview.value = newVal.image_url;
    }
  } else {
    // Reset form khi thêm mới
    formData.value = {
      name: '',
      description: '',
      category_id: '',
      brand_id: '',
      image: null,
      variants: [{
        name: '',
        price: 0,
        initial_stock: 0
      }]
    };
    imagePreview.value = '';
  }
}, { immediate: true });

onUnmounted(() => {
  document.body.classList.remove('modal-open')
})

const validateForm = () => {
  errors.value = {}
  let isValid = true

  if (!formData.value.name) {
    errors.value.name = 'Tên sản phẩm là bắt buộc'
    isValid = false
  }

  if (!formData.value.description) {
    errors.value.description = 'Mô tả là bắt buộc'
    isValid = false
  }

  if (!formData.value.category_id) {
    errors.value.category_id = 'Vui lòng chọn danh mục'
    isValid = false
  }

  if (!formData.value.brand_id) {
    errors.value.brand_id = 'Vui lòng chọn thương hiệu'
    isValid = false
  }

  // Validate variants
  if (!formData.value.variants.length) {
    errors.value.variants = 'Phải có ít nhất một phiên bản sản phẩm'
    isValid = false
  }

  formData.value.variants.forEach((variant, index) => {
    if (!variant.name || variant.price <= 0) {
      errors.value.variants = 'Thông tin phiên bản không hợp lệ'
      isValid = false
    }
  })

  return isValid
}

const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads')) return `http://localhost:5173${url}`; // Thêm domain
  return url;
};

const handleImageChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    formData.value.image = file;
    imagePreview.value = URL.createObjectURL(file);
  }
};

const removeImage = () => {
  formData.value.image = null;
  imagePreview.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

// Thêm methods để quản lý variants
const addVariant = () => {
  formData.value.variants.push({
    name: '',
    price: 0,
    initial_stock: 0
  })
}

const removeVariant = (index) => {
  formData.value.variants.splice(index, 1)
  // Đảm bảo luôn có ít nhất 1 variant
  if (formData.value.variants.length === 0) {
    addVariant()
  }
}
</script>

<style scoped>
.modal-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1040;
}

.modal-container {
  position: relative;
  width: 95%;
  max-width: 900px;
  max-height: 95vh;
  margin: 2rem;
  z-index: 1060;
}

.modal-content {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 1.25rem;
  color: #2c3e50;
  font-weight: 600;
  margin: 0;
}

.btn-close {
  padding: 1rem;
  margin: -1rem -1rem -1rem auto;
  transition: all 0.2s ease;
}

.btn-close:hover {
  background-color: rgba(0,0,0,0.1);
  transform: rotate(90deg);
}

.fa-box-open {
  font-size: 1.2rem;
  color: #0d6efd;
}

.modal-body {
  padding: 1.5rem;
  max-height: calc(95vh - 180px);
  overflow-y: auto;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #eee;
  background: #f8f9fa;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.section-wrapper {
  background: #fff;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid #eee;
}

.section-title {
  color: #2c3e50;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  font-weight: 600;
}

.form-label {
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.required:after {
  content: " *";
  color: #dc3545;
}

.image-upload-wrapper {
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.3s ease;
}

.image-upload-wrapper:hover {
  border-color: #6c757d;
  background: #fff;
}

.upload-placeholder {
  position: relative;
}

.upload-placeholder i {
  font-size: 3rem;
  color: #6c757d;
  margin-bottom: 1rem;
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.image-preview-container {
  position: relative;
  display: inline-block;
}

.preview-img {
  max-width: 300px;
  max-height: 300px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.remove-image {
  position: absolute;
  top: -10px;
  right: -10px;
  border-radius: 50%;
  width: 25px;
  height: 25px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.variant-item {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  border: 1px solid #eee;
  transition: all 0.3s ease;
}

.variant-item:hover {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

/* Animation styles */
.variant-enter-active,
.variant-leave-active {
  transition: all 0.3s ease;
}

.variant-enter-from,
.variant-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Custom button styles */
.btn-lg {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
}

.btn-primary {
  background: #0d6efd;
  border: none;
  box-shadow: 0 2px 4px rgba(13, 110, 253, 0.2);
}

.btn-primary:hover {
  background: #0b5ed7;
  box-shadow: 0 4px 8px rgba(13, 110, 253, 0.3);
}

.btn-light {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
}

.btn-light:hover {
  background: #e9ecef;
}

/* Scrollbar styling */
.modal-body::-webkit-scrollbar {
  width: 8px;
}

.modal-body::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

.modal-body::-webkit-scrollbar-thumb:hover {
  background: #999;
}
</style>
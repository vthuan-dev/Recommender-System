<!-- src/components/products/ProductModal.vue -->
<template>
  <Teleport to="body">
    <div class="modal-wrapper" v-if="show">
      <div class="modal-backdrop" @click="$emit('close')"></div>
      <div class="modal-container">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới' }}</h5>
            <button type="button" class="btn-close" @click="$emit('close')"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleSubmit" enctype="multipart/form-data">
              <div class="mb-3">
                <label class="form-label required">Tên sản phẩm</label>
                <input 
                  type="text" 
                  class="form-control" 
                  v-model="formData.name" 
                  required
                  :class="{'is-invalid': errors.name}"
                >
                <div class="invalid-feedback">{{ errors.name }}</div>
              </div>

              <div class="mb-3">
                <label class="form-label required">Mô tả</label>
                <textarea 
                  class="form-control" 
                  v-model="formData.description" 
                  rows="3"
                  required
                  :class="{'is-invalid': errors.description}"
                ></textarea>
                <div class="invalid-feedback">{{ errors.description }}</div>
              </div>

              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label required">Danh mục</label>
                  <select 
                    class="form-select" 
                    v-model="formData.category_id" 
                    required
                    :class="{'is-invalid': errors.category_id}"
                  >
                    <option value="">Chọn danh mục</option>
                    <option v-for="category in categories" :key="category.id" :value="category.id">
                      {{ category.name }}
                    </option>
                  </select>
                  <div class="invalid-feedback">{{ errors.category_id }}</div>
                </div>

                <div class="col-md-6 mb-3">
                  <label class="form-label required">Thương hiệu</label>
                  <select 
                    class="form-select" 
                    v-model="formData.brand_id" 
                    required
                    :class="{'is-invalid': errors.brand_id}"
                  >
                    <option value="">Chọn thương hiệu</option>
                    <option v-for="brand in brands" :key="brand.id" :value="brand.id">
                      {{ brand.name }}
                    </option>
                  </select>
                  <div class="invalid-feedback">{{ errors.brand_id }}</div>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label required">Ảnh sản phẩm</label>
                <input 
                  type="file" 
                  class="form-control" 
                  @change="handleImageChange" 
                  accept="image/*"
                  :class="{'is-invalid': errors.image}"
                >
                <div class="invalid-feedback">{{ errors.image }}</div>
                <div class="image-preview mt-2" v-if="imagePreview">
                  <img :src="imagePreview" class="preview-img">
                </div>
              </div>

              <div class="variants-section mb-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <h6 class="mb-0">Phiên bản sản phẩm</h6>
                  <button type="button" class="btn btn-sm btn-primary" @click="addVariant">
                    <i class="fas fa-plus"></i> Thêm phiên bản
                  </button>
                </div>
                
                <div v-if="errors.variants" class="alert alert-danger">
                  {{ errors.variants }}
                </div>

                <div v-for="(variant, index) in formData.variants" :key="index" class="variant-item p-3 mb-2">
                  <div class="row">
                    <div class="col-md-4">
                      <label class="form-label required">Tên phiên bản</label>
                      <input type="text" class="form-control" v-model="variant.name" required>
                    </div>
                    <div class="col-md-3">
                      <label class="form-label required">Giá</label>
                      <input type="number" class="form-control" v-model="variant.price" required>
                    </div>
                    <div class="col-md-3">
                      <label class="form-label required">Số lượng nhập</label>
                      <input type="number" class="form-control" v-model="variant.initial_stock" required min="0">
                    </div>
                    <div class="col-md-2 d-flex align-items-end">
                      <button type="button" class="btn btn-danger w-100" @click="removeVariant(index)">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="$emit('close')">Đóng</button>
            <button 
              type="button" 
              class="btn btn-primary" 
              @click="handleSubmit"
              :disabled="isSubmitting"
            >
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

const props = defineProps({
  show: Boolean,
  isEdit: Boolean,
  productData: Object
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
  if (!validateForm()) return

  try {
    isSubmitting.value = true
    const formDataToSend = new FormData()
    
    // Append basic fields
    formDataToSend.append('name', formData.value.name)
    formDataToSend.append('description', formData.value.description)
    formDataToSend.append('category_id', formData.value.category_id)
    formDataToSend.append('brand_id', formData.value.brand_id)
    
    // Append image if exists
    if (formData.value.image) {
      formDataToSend.append('image', formData.value.image)
    }
    
    // Append variants as JSON string
    formDataToSend.append('variants', JSON.stringify(formData.value.variants))

    const response = props.isEdit 
      ? await productService.updateProduct(props.productData.id, formDataToSend)
      : await productService.createProduct(formDataToSend)

    emit('save', response)
    emit('close')
  } catch (error) {
    console.error('Lỗi khi lưu sản phẩm:', error)
    if (error.response?.data?.errors) {
      errors.value = error.response.data.errors
    }
  } finally {
    isSubmitting.value = false
  }
}

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

watch(() => props.productData, (newVal) => {
  if (newVal && props.isEdit) {
    Object.assign(formData.value, {
      name: newVal.name,
      description: newVal.description,
      category_id: newVal.category_id,
      brand_id: newVal.brand_id,
      image_url: newVal.image_url,
      variants: newVal.variants || []
    });
    if (newVal.image_url) {
      imagePreview.value = newVal.image_url;
    }
  }
}, { immediate: true })

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
</script>

<style scoped>
.required:after {
  content: " *";
  color: red;
}

.preview-img {
  max-width: 200px;
  max-height: 200px;
  object-fit: contain;
}

.variant-item {
  border: 1px solid #dee2e6;
  border-radius: 4px;
}

.variant-item .btn-danger {
  height: 38px;
}

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
  z-index: 1040;
}

.modal-container {
  position: relative;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  margin: 2rem;
  z-index: 1060;
  overflow-y: auto;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.modal-header {
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-body {
  padding: 1rem;
}

/* Thêm style cho body khi modal mở */
:global(body.modal-open) {
  overflow: hidden;
}
</style>
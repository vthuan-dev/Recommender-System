<!-- src/components/products/ProductModal.vue -->
<template>
  <div class="modal-wrapper" v-if="show">
    <div class="modal" tabindex="-1">
      <div class="modal-dialog modal-lg">
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
    <div class="modal-backdrop" @click="$emit('close')"></div>
  </div>
</template>

<script>
import { ref, reactive, onMounted, watch, onUnmounted } from 'vue'
import { productService } from '@/services/productService'

export default {
  name: 'ProductModal',
  props: {
    show: {
      type: Boolean,
      required: true
    },
    isEdit: {
      type: Boolean,
      default: false
    },
    productData: {
      type: Object,
      default: () => ({})
    }
  },

  setup(props, { emit }) {
    const formData = reactive({
      name: '',
      description: '',
      category_id: '',
      brand_id: '',
      image: null,
      variants: []
    })

    const errors = reactive({})
    const categories = ref([])
    const brands = ref([])
    const imagePreview = ref('')
    const isSubmitting = ref(false)

    // Methods
    const validateForm = () => {
      errors.value = {}
      let isValid = true

      if (!formData.name) {
        errors.name = 'Vui lòng nhập tên sản phẩm'
        isValid = false
      }

      if (!formData.description) {
        errors.description = 'Vui lòng nhập mô tả sản phẩm'
        isValid = false
      }

      if (!formData.category_id) {
        errors.category_id = 'Vui lòng chọn danh mục'
        isValid = false
      }

      if (!formData.brand_id) {
        errors.brand_id = 'Vui lòng chọn thương hiệu'
        isValid = false
      }

      if (!formData.image && !props.isEdit) {
        errors.image = 'Vui lòng chọn ảnh sản phẩm'
        isValid = false
      }

      if (formData.variants.length === 0) {
        errors.variants = 'Vui lòng thêm ít nhất một phiên bản sản phẩm'
        isValid = false
      }

      return isValid
    }

    const handleImageChange = (event) => {
      const file = event.target.files[0]
      if (file) {
        formData.image = file
        imagePreview.value = URL.createObjectURL(file)
      }
    }

    const addVariant = () => {
      formData.variants.push({
        name: '',
        price: 0,
        initial_stock: 0
      })
    }

    const removeVariant = (index) => {
      formData.variants.splice(index, 1)
    }

    const handleSubmit = async () => {
      if (!validateForm()) return

      try {
        isSubmitting.value = true
        const response = await productService.createProduct(formData)
        emit('saved', response)
        emit('close')
      } catch (error) {
        console.error('Lỗi khi lưu sản phẩm:', error)
        // Xử lý lỗi từ server
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
        Object.assign(formData, props.productData)
      }
    })

    watch(props.show, (newVal) => {
      if (newVal) {
        document.body.classList.add('modal-open')
      } else {
        document.body.classList.remove('modal-open')
      }
    })

    onUnmounted(() => {
      document.body.classList.remove('modal-open')
    })

    return {
      formData,
      errors,
      categories,
      brands,
      imagePreview,
      isSubmitting,
      handleImageChange,
      addVariant,
      removeVariant,
      handleSubmit
    }
  }
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
  align-items: center;
  justify-content: center;
  z-index: 1050;
}

.modal {
  position: relative;
  width: 100%;
  z-index: 1052;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-dialog {
  position: relative;
  width: 100%;
  max-width: 800px;
  margin: 1.75rem auto;
  pointer-events: auto;
}

.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1051;
}

/* Thêm style cho body khi modal mở */
:global(body.modal-open) {
  overflow: hidden;
}
</style>
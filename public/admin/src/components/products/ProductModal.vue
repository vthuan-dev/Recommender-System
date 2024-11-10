<!-- src/components/products/ProductModal.vue -->
<template>
    <div class="modal fade" id="productModal" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới' }}</h5>
            <button type="button" class="btn-close" @click="$emit('close')"></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleSubmit">
              <div class="mb-3">
                <label class="form-label">Tên sản phẩm</label>
                <input type="text" class="form-control" v-model="formData.name" required>
              </div>
              <div class="mb-3">
                <label class="form-label">Danh mục</label>
                <select class="form-select" v-model="formData.categoryId" required>
                  <option value="">Chọn danh mục</option>
                  <option v-for="category in categories" :key="category.id" :value="category.id">
                    {{ category.name }}
                  </option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">Thương hiệu</label>
                <select class="form-select" v-model="formData.brandId" required>
                  <option value="">Chọn thương hiệu</option>
                  <option v-for="brand in brands" :key="brand.id" :value="brand.id">
                    {{ brand.name }}
                  </option>
                </select>
              </div>
              <div class="variants-container">
                <h6>Phiên bản sản phẩm</h6>
                <div v-for="(variant, index) in formData.variants" :key="index" class="variant-item">
                  <div class="row">
                    <div class="col">
                      <input type="text" class="form-control" v-model="variant.name" placeholder="Tên phiên bản">
                    </div>
                    <div class="col">
                      <input type="number" class="form-control" v-model="variant.price" placeholder="Giá">
                    </div>
                    <div class="col">
                      <input type="number" class="form-control" v-model="variant.stock" placeholder="Số lượng">
                    </div>
                    <div class="col-auto">
                      <button type="button" class="btn btn-danger" @click="removeVariant(index)">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
                <button type="button" class="btn btn-secondary mt-2" @click="addVariant">
                  <i class="fas fa-plus"></i> Thêm phiên bản
                </button>
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="$emit('close')">Đóng</button>
            <button type="button" class="btn btn-primary" @click="handleSubmit">Lưu sản phẩm</button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'ProductModal',
    props: {
      isEdit: {
        type: Boolean,
        default: false
      },
      productData: {
        type: Object,
        default: () => ({})
      }
    },
    data() {
      return {
        categories: [],
        brands: [],
        formData: {
          name: '',
          categoryId: '',
          brandId: '',
          variants: []
        }
      }
    },
    methods: {
      async fetchCategories() {
        // Implement fetching categories
      },
      async fetchBrands() {
        // Implement fetching brands
      },
      addVariant() {
        this.formData.variants.push({
          name: '',
          price: 0,
          stock: 0
        })
      },
      removeVariant(index) {
        this.formData.variants.splice(index, 1)
      },
      handleSubmit() {
        this.$emit('save', this.formData)
      }
    },
    mounted() {
      this.fetchCategories()
      this.fetchBrands()
    }
  }
  </script>
import api from '../utils/axios'

export const productService = {
  getProducts: async (params) => {
    try {
      const response = await api.get('/products', { params })
      return {
        products: response.data.products,
        totalPages: response.data.totalPages,
        currentPage: response.data.currentPage,
        totalProducts: response.data.totalProducts
      }
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  createProduct: async (productData) => {
    try {
      const formData = new FormData()
      
      // Thêm các trường thông tin cơ bản
      formData.append('name', productData.name)
      formData.append('description', productData.description)
      formData.append('category_id', productData.category_id)
      formData.append('brand_id', productData.brand_id)
      
      // Thêm ảnh nếu có
      if (productData.image) {
        formData.append('image', productData.image)
      }
      
      // Thêm variants dưới dạng JSON string
      if (productData.variants) {
        formData.append('variants', JSON.stringify(productData.variants))
      }

      const response = await api.post('/add-products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  updateProduct: async (id, productData) => {
    try {
      const formData = new FormData()
      
      formData.append('name', productData.name)
      formData.append('description', productData.description)
      formData.append('category_id', productData.category_id)
      formData.append('brand_id', productData.brand_id)
      
      if (productData.image) {
        formData.append('image', productData.image)
      }
      
      if (productData.variants) {
        formData.append('variants', JSON.stringify(productData.variants))
      }

      const response = await api.put(`/products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  getCategories: async () => {
    try {
      const response = await api.get('/categories')
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  getBrands: async () => {
    try {
      const response = await api.get('/admin/brands')
      return response.data
    } catch (error) {
      console.error('Error fetching brands:', error)
      throw error.response?.data || error.message
    }
  },

  getProductDetail: async (id) => {
    try {
      const response = await api.get(`/products/${id}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  deleteProduct: async (id) => {
    try {
      const response = await api.delete(`/products/${id}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  }
}
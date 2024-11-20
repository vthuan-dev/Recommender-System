import api from '../utils/axios'

export const productService = {
  getProducts: async (params) => {
    try {
      const response = await api.get('/admin/products', { params })
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

  createProduct: async (formData) => {
    try {
      const response = await api.post('/admin/add-products', formData, {
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

      const response = await api.put(`/admin/products/${id}`, formData, {
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

  deleteProduct: async (productId) => {
    try {
      const response = await api.delete(`/admin/products/${productId}`);
      return response.data;
    } catch (error) {
      console.error('Error in deleteProduct:', error);
      throw new Error(error.response?.data?.message || 'Không thể xóa sản phẩm');
    }
  },

  async getProduct(id) {
    try {
      const response = await api.get(`/admin/products/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Lỗi lấy thông tin sản phẩm');
    }
  },

  getAllProducts: async () => {
    try {
      const response = await api.get('/admin/products/all');
      return response.data;
    } catch (error) {
      console.error('Error fetching all products:', error);
      throw error.response?.data || error.message;
    }
  }
}
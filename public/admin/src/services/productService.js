import api from '../utils/axios'

export const productService = {
  getProducts: async (params = {}) => {
    try {
      const response = await api.get('/admin/products', { 
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          search: params.search || '',
          category: params.category || '',
          brand: params.brand || ''
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error.response?.data || { 
        success: false, 
        message: 'Lỗi khi tải danh sách sản phẩm' 
      };
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
      const response = await api.get('/admin/categories')
      return response.data
    } catch (error) {
      console.error('Error fetching categories:', error)
      return []
    }
  },

  getBrands: async () => {
    try {
      const response = await api.get('/admin/brands')
      return response.data
    } catch (error) {
      console.error('Error fetching brands:', error)
      return []
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
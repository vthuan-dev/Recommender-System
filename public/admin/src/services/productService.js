import axios from 'axios'

const api = axios.create({
  baseURL: '/api/admin',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
  }
})

export const productService = {
  // Lấy danh sách sản phẩm có phân trang và tìm kiếm
  getProducts: async (params) => {
    const response = await api.get('/products', { params })
    return response.data
  },

  // Lấy danh sách categories
  getCategories: async () => {
    const response = await api.get('/categories')
    return response.data
  },

  // Lấy danh sách brands
  getBrands: async () => {
    const response = await api.get('/brands')
    return response.data
  },

  // Thêm sản phẩm mới
  createProduct: async (productData) => {
    const formData = new FormData()
    Object.keys(productData).forEach(key => {
      if (key === 'variants') {
        formData.append(key, JSON.stringify(productData[key]))
      } else if (key === 'image' && productData[key]) {
        formData.append('image', productData[key])
      } else {
        formData.append(key, productData[key])
      }
    })
    const response = await api.post('/add-products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // Cập nhật sản phẩm
  updateProduct: async (id, productData) => {
    const formData = new FormData()
    Object.keys(productData).forEach(key => {
      if (key === 'variants') {
        formData.append(key, JSON.stringify(productData[key]))
      } else if (key === 'image' && productData[key]) {
        formData.append('image', productData[key])
      } else {
        formData.append(key, productData[key])
      }
    })
    const response = await api.put(`/products/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // Xóa sản phẩm
  deleteProduct: async (productId) => {
    try {
      const response = await api.delete(`/products/${productId}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Lấy chi tiết sản phẩm
  getProductDetail: async (id) => {
    const response = await api.get(`/products/${id}`)
    return response.data
  }
}
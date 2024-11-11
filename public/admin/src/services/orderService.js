import api from '../utils/axios'

export const orderService = {
  getOrders: async (params) => {
    try {
      const response = await api.get('/orders', { params })
      return {
        orders: response.data.orders,
        totalPages: response.data.totalPages,
        currentPage: response.data.currentPage,
        totalOrders: response.data.totalOrders
      }
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  updateOrderStatus: async (orderId, status) => {
    try {
      const response = await api.put(`/orders/${orderId}/status`, { status })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  getOrderStats: async () => {
    try {
      const response = await api.get('/orders/stats')
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  async getOrderDetail(orderId) {
    try {
      console.log('Calling API with orderId:', orderId)
      const response = await api.get(`/orders/${orderId}`)
      console.log('Raw API Response:', response)
      
      if (!response.data) {
        throw new Error('Không có dữ liệu trả về')
      }
      
      return response.data
    } catch (error) {
      console.error('Error in getOrderDetail:', error)
      throw error
    }
  }
}
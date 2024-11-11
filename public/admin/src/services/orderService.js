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

  getOrderDetails: async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`)
      return response.data
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
  }
}
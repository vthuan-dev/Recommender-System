import api from '../utils/axios'

export const customerService = {
  getCustomers: async (params) => {
    const response = await api.get('/users', { params })
    return response.data
  },

  getCustomerById: async (id) => {
    const response = await api.get(`/api/admin/users/${id}`)
    return response.data
  },

  createCustomer: async (customerData) => {
    const response = await api.post('/api/admin/users', customerData)
    return response.data
  },

  updateCustomer: async (id, customerData) => {
    const response = await api.put(`/api/admin/users/${id}`, customerData)
    return response.data
  },

  deleteCustomer: async (id) => {
    const response = await api.delete(`/api/admin/users/${id}`)
    return response.data
  },

  deleteMultipleCustomers: async (ids) => {
    const response = await api.post('/api/admin/users/delete-multiple', { ids })
    return response.data
  },

  exportCustomers: async (filters) => {
    const response = await api.get('/api/admin/users/export', { 
      params: filters,
      responseType: 'blob'
    })
    return response.data
  },

  getCustomerStats: async () => {
    const response = await api.get('/api/admin/users/stats')
    return response.data
  }
}


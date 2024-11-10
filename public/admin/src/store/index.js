import { createStore } from 'vuex'

export default createStore({
  state: {
    user: null
  },
  mutations: {
    SET_USER(state, user) {
      state.user = user
    },
    CLEAR_USER(state) {
      state.user = null
    }
  },
  getters: {
    isAuthenticated: state => !!state.user,
    userFullName: state => state.user ? state.user.fullname : ''
  },
  actions: {
    async login({ commit }, credentials) {
      try {
        const response = await fetch('/admin/login-admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(credentials)
        })
        const data = await response.json()
        if (response.ok) {
          const userData = {
            token: data.token,
            userId: data.userId,
            fullname: data.fullname,
            role: data.role
          }
          commit('SET_USER', userData)
          localStorage.setItem('adminToken', data.token)
          localStorage.setItem('userData', JSON.stringify(userData))
          return data
        }
        throw new Error(data.message)
      } catch (error) {
        throw error
      }
    },
    logout({ commit }) {
      localStorage.removeItem('adminToken')
      localStorage.removeItem('userData')
      commit('CLEAR_USER')
    },
    initializeAuth({ commit }) {
      const userData = localStorage.getItem('userData')
      if (userData) {
        commit('SET_USER', JSON.parse(userData))
      }
    }
  }
}) 
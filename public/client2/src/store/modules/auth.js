export default {
    namespaced: true,
    
    state: {
      isAuthenticated: false,
      user: null,
      token: null
    },
  
    mutations: {
      setUser(state, userData) {
        state.isAuthenticated = true
        state.user = userData
        state.token = userData.token
      },
      
      clearUser(state) {
        state.isAuthenticated = false
        state.user = null
        state.token = null
      }
    },
  
    actions: {
      async checkAuthStatus({ commit }) {
        const token = localStorage.getItem('token')
        if (!token) {
          commit('clearUser')
          return false
        }

        try {
          const response = await fetch('http://localhost:3000/api/verify-token', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })

          if (!response.ok) {
            throw new Error('Token invalid')
          }

          return true
        } catch (error) {
          commit('clearUser')
          localStorage.removeItem('token')
          localStorage.removeItem('userId')
          localStorage.removeItem('fullname')
          localStorage.removeItem('role')
          return false
        }
      },

      async logout({ commit }) {
        localStorage.removeItem('token')
        localStorage.removeItem('userId')
        localStorage.removeItem('fullname')
        localStorage.removeItem('role')
        localStorage.removeItem('rememberMe')
        commit('clearUser')
      }
    }
  }
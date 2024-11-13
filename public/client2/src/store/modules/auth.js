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
      async logout({ commit }) {
        // Xóa thông tin người dùng khỏi localStorage
        localStorage.removeItem('token')
        localStorage.removeItem('userId')
        localStorage.removeItem('fullname')
        localStorage.removeItem('role')
        localStorage.removeItem('rememberMe')
        
        // Cập nhật state
        commit('clearUser')
      }
    }
  }
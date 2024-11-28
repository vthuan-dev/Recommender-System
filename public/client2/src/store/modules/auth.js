export default {
    namespaced: true,
    
    state: {
      user: JSON.parse(localStorage.getItem('user')) || null,
      isAuthenticated: !!localStorage.getItem('user')
    },
  
    mutations: {
      SET_USER(state, user) {
        state.user = user
        state.isAuthenticated = !!user
        if (user) {
          localStorage.setItem('user', JSON.stringify(user))
        } else {
          localStorage.removeItem('user')
        }
      }
    },
  
    actions: {
      initializeAuth({ commit }) {
        const user = JSON.parse(localStorage.getItem('user'))
        if (user) {
          commit('SET_USER', user)
        }
      },
      
      login({ commit }, userData) {
        commit('SET_USER', userData)
      },
      
      logout({ commit }) {
        commit('SET_USER', null)
      }
    }
  }
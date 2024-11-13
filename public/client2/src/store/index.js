import { createStore } from 'vuex'

export default createStore({
  state: {
    categories: [],
    cart: [],
    user: null,
    products: [],
    loading: false,
    error: null,
    orders: []
  },
  
  getters: {
    isAuthenticated: state => !!state.user,
    cartTotal: state => {
      return state.cart.reduce((total, item) => {
        return total + (item.price * item.quantity)
      }, 0)
    },
    cartItemCount: state => {
      return state.cart.reduce((total, item) => total + item.quantity, 0)
    }
  },
  
  mutations: {
    SET_CATEGORIES(state, categories) {
      state.categories = categories
    },
    SET_PRODUCTS(state, products) {
      state.products = products
    },
    SET_LOADING(state, status) {
      state.loading = status
    },
    SET_ERROR(state, error) {
      state.error = error
    },
    SET_USER(state, user) {
      state.user = user
    },
    ADD_TO_CART(state, product) {
      const existingItem = state.cart.find(item => item.id === product.id)
      if (existingItem) {
        existingItem.quantity++
      } else {
        state.cart.push({...product, quantity: 1})
      }
      // Lưu giỏ hàng vào localStorage
      localStorage.setItem('cart', JSON.stringify(state.cart))
    },
    REMOVE_FROM_CART(state, productId) {
      state.cart = state.cart.filter(item => item.id !== productId)
      localStorage.setItem('cart', JSON.stringify(state.cart))
    },
    UPDATE_CART_QUANTITY(state, {productId, quantity}) {
      const item = state.cart.find(item => item.id === productId)
      if (item) {
        item.quantity = quantity
        localStorage.setItem('cart', JSON.stringify(state.cart))
      }
    },
    CLEAR_CART(state) {
      state.cart = []
      localStorage.removeItem('cart')
    },
    SET_ORDERS(state, orders) {
      state.orders = orders
    }
  },
  
  actions: {
    async fetchCategories({ commit }) {
      try {
        commit('SET_LOADING', true)
        const response = await fetch('/api/categories')
        const data = await response.json()
        commit('SET_CATEGORIES', data)
      } catch (error) {
        commit('SET_ERROR', error.message)
      } finally {
        commit('SET_LOADING', false)
      }
    },

    async fetchProducts({ commit }, categoryId = null) {
      try {
        commit('SET_LOADING', true)
        const url = categoryId ? `/api/products?category=${categoryId}` : '/api/products'
        const response = await fetch(url)
        const data = await response.json()
        commit('SET_PRODUCTS', data)
      } catch (error) {
        commit('SET_ERROR', error.message)
      } finally {
        commit('SET_LOADING', false)
      }
    },

    async login({ commit }, credentials) {
      try {
        commit('SET_LOADING', true)
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(credentials)
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.message)
        
        localStorage.setItem('token', data.token)
        commit('SET_USER', data.user)
        return data
      } catch (error) {
        commit('SET_ERROR', error.message)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },

    async fetchOrders({ commit, state }) {
      if (!state.user) return
      
      try {
        commit('SET_LOADING', true)
        const response = await fetch('/api/orders', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        const data = await response.json()
        commit('SET_ORDERS', data)
      } catch (error) {
        commit('SET_ERROR', error.message)
      } finally {
        commit('SET_LOADING', false)
      }
    },

    logout({ commit }) {
      localStorage.removeItem('token')
      commit('SET_USER', null)
      commit('CLEAR_CART')
    },

    initializeStore({ commit }) {
      // Khôi phục giỏ hàng từ localStorage
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        const cart = JSON.parse(savedCart)
        cart.forEach(item => commit('ADD_TO_CART', item))
      }
      
      // Khôi phục thông tin user từ token
      const token = localStorage.getItem('token')
      if (token) {
        // Thực hiện validate token và lấy thông tin user
        // Implement logic here
      }
    }
  }
})
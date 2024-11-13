import { createStore } from 'vuex'
import axiosInstance from '../utils/axios'

export default createStore({
  state: {
    auth: {
      user: null,
      isAuthenticated: false
    },
    cart: {
      items: [],
      itemCount: 0
    },
    wishlist: {
      items: [],
      itemCount: 0
    },
    products: {
      trending: [],
      recommended: [],
      recentlyViewed: []
    }
  },
  
  mutations: {
    setUser(state, userData) {
      state.auth.user = userData;
      state.auth.isAuthenticated = true;
    },
    clearUser(state) {
      state.auth.user = null;
      state.auth.isAuthenticated = false;
    },
    setCartCount(state, count) {
      state.cart.itemCount = count;
    },
    setWishlistCount(state, count) {
      state.wishlist.itemCount = count;
    },
    setTrendingProducts(state, products) {
      state.products.trending = products
    },
    setRecommendedProducts(state, products) {
      state.products.recommended = products
    },
    setRecentlyViewed(state, products) {
      state.products.recentlyViewed = products
    }
  },
  
  actions: {
    async login({ commit }, credentials) {
      const response = await axiosInstance.post('/login-client', credentials);
      const userData = {
        userId: response.data.userId,
        fullname: response.data.fullname,
        role: response.data.role,
        token: response.data.token
      };
      
      localStorage.setItem('token', userData.token);
      localStorage.setItem('userId', userData.userId);
      localStorage.setItem('fullname', userData.fullname);
      localStorage.setItem('role', userData.role);
      
      commit('setUser', userData);
      return userData;
    },
    
    logout({ commit }) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('fullname');
      localStorage.removeItem('role');
      commit('clearUser');
    }
  },
  
  getters: {
    isAuthenticated: state => state.auth.isAuthenticated,
    currentUser: state => state.auth.user,
    cartCount: state => state.cart.itemCount,
    wishlistCount: state => state.wishlist.itemCount
  }
})
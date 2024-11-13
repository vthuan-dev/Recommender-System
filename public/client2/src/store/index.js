import { createStore } from 'vuex'
// import axiosInstance from '../utils/axios'

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
      state.auth = {
        user: {
          userId: userData.userId,
          fullname: userData.fullname,
          email: userData.email,
          role: userData.role,
          token: userData.token,
          avatarUrl: userData.avatar_url || null,
          phonenumber: userData.phonenumber
        },
        isAuthenticated: true
      };
      
      localStorage.setItem('token', userData.token);
      localStorage.setItem('userId', userData.userId);
      localStorage.setItem('fullname', userData.fullname);
      localStorage.setItem('role', userData.role);
      localStorage.setItem('avatar_url', userData.avatar_url || '');
      localStorage.setItem('email', userData.email || '');
    },
    
    initializeAuth(state) {
      const token = localStorage.getItem('token');
      if (token) {
        state.auth = {
          user: {
            userId: localStorage.getItem('userId'),
            fullname: localStorage.getItem('fullname'),
            email: localStorage.getItem('email'),
            role: localStorage.getItem('role'),
            token: token,
            avatarUrl: localStorage.getItem('avatar_url'),
            phonenumber: localStorage.getItem('phonenumber')
          },
          isAuthenticated: true
        };
      }
    }
  },
  
  actions: {
    async login({ commit }, credentials) {
      try {
        const response = await fetch('http://localhost:3000/api/login-client', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(credentials)
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Đăng nhập thất bại');
        }

        const userData = {
          userId: data.userId,
          fullname: data.fullname,
          role: data.role || 'customer',
          token: data.token
        };

        localStorage.setItem('token', userData.token);
        localStorage.setItem('userId', userData.userId);
        localStorage.setItem('fullname', userData.fullname);
        localStorage.setItem('role', userData.role);
        
        commit('setUser', userData);
        return userData;
      } catch (error) {
        console.error('Login error:', error);
        throw error;
      }
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
    currentUser: state => state.auth.user
  }
})
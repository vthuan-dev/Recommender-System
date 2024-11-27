import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import vue3GoogleLogin from 'vue3-google-login'
import axios from 'axios'
import Toast from "vue-toastification"
import "vue-toastification/dist/index.css"

import 'bootstrap/dist/js/bootstrap.bundle.min.js'

// Import styles
import 'bootstrap/dist/css/bootstrap.min.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import './assets/styles/main.css'

// Import Bootstrap JS
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

const app = createApp(App)

// Sử dụng các plugins
app.use(router)
app.use(store)
app.use(vue3GoogleLogin, {
  clientId: '650947848929-3805gmuubt8o3squkptgj9bdpj2pjgsr.apps.googleusercontent.com',
  scope: 'email profile',
  prompt: 'select_account'
})

// Thêm global property
app.config.globalProperties.$gapi = {
  async signIn() {
    return new Promise((resolve, reject) => {
      window.google.accounts.id.initialize({
        client_id: '650947848929-3805gmuubt8o3squkptgj9bdpj2pjgsr.apps.googleusercontent.com',
        callback: (response) => resolve(response),
        error_callback: reject
      });
      window.google.accounts.id.prompt();
    });
  }
};

// Khôi phục trạng thái auth từ localStorage
store.commit('initializeAuth');

axios.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      router.push('/login');
    }
    return Promise.reject(error);
  }
);

const options = {
  position: "top-right",
  timeout: 3000,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: "button",
  icon: true,
  rtl: false
}

app.use(Toast, options)

app.mount('#app')
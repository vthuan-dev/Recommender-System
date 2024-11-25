import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import '@fortawesome/fontawesome-free/css/all.min.css'
import '@/styles/sweetalert2-custom.css'
import 'animate.css'
import i18n from './i18n'
import './styles/themes.css'
import './styles/variables.css'
import axios from 'axios'

// Cấu hình base URL cho axios
axios.defaults.baseURL = 'http://localhost:5173' // Thay đổi port nếu cần

const app = createApp(App)
app.use(store)
app.use(router)
app.use(i18n)

// Khôi phục theme từ localStorage
const savedTheme = localStorage.getItem('theme') || 'default'
document.documentElement.setAttribute('data-theme', savedTheme)

app.mount('#app')

// Initialize auth state
store.dispatch('initializeAuth')

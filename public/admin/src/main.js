import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import '@fortawesome/fontawesome-free/css/all.min.css'
import '@/styles/sweetalert2-custom.css'
import 'animate.css'

const app = createApp(App)
app.use(store)
app.use(router)
app.mount('#app')

// Initialize auth state
store.dispatch('initializeAuth')
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

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

app.mount('#app')
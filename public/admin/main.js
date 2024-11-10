import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'

// Import CSS
import 'bootstrap/dist/css/bootstrap.min.css'
import '@fortawesome/fontawesome-free/css/all.min.css'

const app = createApp(App)

app.use(router)
app.use(store)
app.mount('#app')
<template>
  <div id="app">
    <Header />
    <router-view></router-view>
    <Footer />
    <ChatBot />
  </div>
</template>

<script>
import Header from '@/components/Layout/Header.vue'
import Footer from '@/components/Layout/Footer.vue'
import ChatBot from '@/components/ChatBot/ChatBot.vue'
import { onMounted, onUnmounted, ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'

// Thêm danh sách các route cần bảo vệ
const protectedRoutes = [
  '/cart',
  '/checkout',
  '/profile',
  '/orders',
  '/addresses'
]

export default {
  name: 'App',
  components: {
    Header,
    Footer,
    ChatBot
  },
  setup() {
    const store = useStore()
    const router = useRouter()
    const tokenCheckInterval = ref(null)

    const checkAuth = () => {
      const token = localStorage.getItem('token')
      const currentPath = router.currentRoute.value.path
      
      if (!token && protectedRoutes.includes(currentPath)) {
        Swal.fire({
          icon: 'warning',
          title: 'Yêu cầu đăng nhập',
          text: 'Vui lòng đăng nhập để tiếp tục',
          confirmButtonText: 'Đăng nhập ngay'
        }).then((result) => {
          if (result.isConfirmed) {
            router.push('/login')
          }
        })
        return false
      }
      return true
    }

    onMounted(async () => {
      const token = localStorage.getItem('token')
      const userId = localStorage.getItem('userId')
      const fullname = localStorage.getItem('fullname')
      const role = localStorage.getItem('role')

      if (token && userId && fullname) {
        store.commit('setUser', {
          userId,
          fullname,
          role,
          token
        })
        await checkAuth()
      }

      // Kiểm tra token mỗi 5 phút
      tokenCheckInterval.value = setInterval(checkAuth, 300000)
    })

    // Cleanup khi component unmount
    onUnmounted(() => {
      if (tokenCheckInterval.value) {
        clearInterval(tokenCheckInterval.value)
      }
    })

    return {
      checkAuth
    }
  }
}
</script>

<style>
@import 'bootstrap/dist/css/bootstrap.min.css';
@import '@fortawesome/fontawesome-free/css/all.min.css';

#app {
  font-family: 'Roboto', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
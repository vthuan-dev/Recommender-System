<template>
  <div id="app">
    <Header />
    <router-view></router-view>
    <Footer />
  </div>
</template>

<script>
import Header from '@/components/Layout/Header.vue'
import Footer from '@/components/Layout/Footer.vue'
import { onMounted, onUnmounted, ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import CustomSweetAlert from '@/components/Common/CustomSweetAlert'

export default {
  name: 'App',
  components: {
    Header,
    Footer
  },
  setup() {
    const store = useStore()
    const router = useRouter()
    const tokenCheckInterval = ref(null)

    const checkAuth = async () => {
      const isValid = await store.dispatch('checkAuthStatus')
      if (!isValid && router.currentRoute.value.meta.requiresAuth) {
        CustomSweetAlert.warning(
          'Phiên đăng nhập đã hết hạn',
          'Vui lòng đăng nhập lại để tiếp tục!'
        )
        router.push('/login')
      }
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
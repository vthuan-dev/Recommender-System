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
import { onMounted } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'App',
  components: {
    Header,
    Footer
  },
  setup() {
    const store = useStore()

    onMounted(() => {
      // Kiểm tra token trong localStorage
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
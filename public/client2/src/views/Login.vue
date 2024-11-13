<template>
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <div class="card">
            <div class="card-body">
              <h3 class="card-title text-center mb-4">Đăng nhập</h3>
              <form @submit.prevent="handleLogin">
                <div class="mb-3">
                  <label class="form-label">Email</label>
                  <input type="email" class="form-control" v-model="form.email" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Mật khẩu</label>
                  <input type="password" class="form-control" v-model="form.password" required>
                </div>
                <button type="submit" class="btn btn-primary w-100">Đăng nhập</button>
              </form>
              <p class="text-center mt-3">
                Chưa có tài khoản? 
                <router-link to="/register">Đăng ký</router-link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref } from 'vue'
  import { useStore } from 'vuex'
  import { useRouter } from 'vue-router'
  
  export default {
    name: 'LoginView',
    setup() {
      const store = useStore()
      const router = useRouter()
      const form = ref({
        email: '',
        password: ''
      })
  
      const handleLogin = async () => {
        try {
          // Gọi action login từ store
          await store.dispatch('login', form.value)
          // Chuyển hướng sau khi đăng nhập thành công
          router.push('/')
        } catch (error) {
          console.error('Login failed:', error)
        }
      }
  
      return {
        form,
        handleLogin
      }
    }
  }
  </script>
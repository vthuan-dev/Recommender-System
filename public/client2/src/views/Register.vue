<template>
    <div class="container py-5">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <div class="card">
            <div class="card-body">
              <h3 class="card-title text-center mb-4">Đăng ký tài khoản</h3>
              <form @submit.prevent="handleRegister">
                <div class="mb-3">
                  <label class="form-label">Họ tên</label>
                  <input type="text" class="form-control" v-model="form.name" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Email</label>
                  <input type="email" class="form-control" v-model="form.email" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Mật khẩu</label>
                  <input type="password" class="form-control" v-model="form.password" required>
                </div>
                <div class="mb-3">
                  <label class="form-label">Xác nhận mật khẩu</label>
                  <input type="password" class="form-control" v-model="form.confirmPassword" required>
                </div>
                <button type="submit" class="btn btn-primary w-100">Đăng ký</button>
              </form>
              <p class="text-center mt-3">
                Đã có tài khoản? 
                <router-link to="/login">Đăng nhập</router-link>
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
    name: 'RegisterView',
    setup() {
      const store = useStore()
      const router = useRouter()
      const form = ref({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      })
  
      const handleRegister = async () => {
        try {
          // Kiểm tra mật khẩu xác nhận
          if (form.value.password !== form.value.confirmPassword) {
            throw new Error('Mật khẩu xác nhận không khớp')
          }
          
          // Gọi action register từ store
          await store.dispatch('register', form.value)
          // Chuyển hướng sau khi đăng ký thành công
          router.push('/login')
        } catch (error) {
          console.error('Register failed:', error)
        }
      }
  
      return {
        form,
        handleRegister
      }
    }
  }
  </script>
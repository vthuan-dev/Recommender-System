<!-- src/components/Auth/SignIn.vue -->
<template>
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h3 class="mb-0">
                <i class="fas fa-sign-in-alt me-2"></i>Đăng nhập Admin
              </h3>
            </div>
            <div class="card-body">
              <form @submit.prevent="handleLogin">
                <div class="mb-3">
                  <label for="email" class="form-label">Email</label>
                  <input
                    type="email"
                    class="form-control"
                    id="email"
                    v-model="formData.email"
                    autocomplete="username"
                    required
                  />
                </div>
                <div class="mb-3">
                  <label for="password" class="form-label">Mật khẩu</label>
                  <input
                    type="password"
                    class="form-control"
                    id="password"
                    v-model="formData.password"
                    autocomplete="current-password"
                    required
                  />
                </div>
                <div class="d-grid">
                  <button type="submit" class="btn btn-primary" :disabled="loading">
                    {{ loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    name: 'SignIn',
    data() {
      return {
        formData: {
          email: '',
          password: ''
        },
        loading: false,
        errors: []
      }
    },
    methods: {
      validateForm() {
        this.errors = []
        
        if (!this.formData.email.match(/^[a-zA-Z0-9._%+-]+@gmail\.com$/)) {
          this.errors.push('Email không đúng định dạng')
        }

        return this.errors.length === 0
      },

      async handleLogin() {
        if (!this.validateForm()) {
          alert(this.errors.join('\n'))
          return
        }

        try {
          this.loading = true
          const response = await fetch('/api/admin/login-admin', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(this.formData),
            credentials: 'include'
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.message || 'Đăng nhập thất bại')
          }

          if (data.token) {
            localStorage.setItem('adminToken', data.token)
            localStorage.setItem('fullname', data.fullname)
            localStorage.setItem('role', data.role)
            window.location.href = '/admin/dashboard'
          }
        } catch (error) {
          console.error('Login error:', error)
          alert('Lỗi đăng nhập: ' + (error.message || 'Không thể kết nối đến server'))
        } finally {
          this.loading = false
        }
      }
    }
  }
  </script>
  
  <style scoped>
  .card {
    border: none;
    border-radius: 10px;
    box-shadow: 0 0 20px rgba(0,0,0,0.1);
  }
  
  .card-header {
    background-color: #4e73df;
    color: white;
    text-align: center;
    border-radius: 10px 10px 0 0 !important;
    padding: 20px;
  }
  
  .btn-primary {
    background-color: #4e73df;
    border-color: #4e73df;
  }
  
  .btn-primary:hover {
    background-color: #2e59d9;
    border-color: #2e59d9;
  }
  </style>
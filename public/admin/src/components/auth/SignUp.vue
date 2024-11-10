<!-- src/components/Auth/SignUp.vue -->
<template>
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header">
              <h3 class="mb-0">
                <i class="fas fa-user-plus me-2"></i>Đăng ký tài khoản Admin
              </h3>
            </div>
            <div class="card-body">
              <form @submit.prevent="handleRegister">
                <div class="mb-3">
                  <label for="fullname" class="form-label">Họ và tên</label>
                  <input
                    type="text"
                    class="form-control"
                    id="fullname"
                    v-model="formData.fullname"
                    required
                  />
                </div>
                <div class="mb-3">
                  <label for="phonenumber" class="form-label">Số điện thoại</label>
                  <input
                    type="tel"
                    class="form-control"
                    id="phonenumber"
                    v-model="formData.phonenumber"
                    required
                  />
                </div>
                <div class="mb-3">
                  <label for="email" class="form-label">Email</label>
                  <input
                    type="email"
                    class="form-control"
                    id="email"
                    v-model="formData.email"
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
                    required
                  />
                </div>
                <div class="mb-3">
                  <label for="confirmPassword" class="form-label">Xác nhận mật khẩu</label>
                  <input
                    type="password"
                    class="form-control"
                    id="confirmPassword"
                    v-model="formData.confirmPassword"
                    required
                  />
                </div>
                <div class="d-grid">
                  <button type="submit" class="btn btn-primary" :disabled="loading">
                    {{ loading ? 'Đang đăng ký...' : 'Đăng ký' }}
                  </button>
                </div>
                <div class="dangnhap mt-3 text-center">
                  <p>Nếu đã có tài khoản, hãy <router-link to="/admin/login">đăng nhập</router-link></p>
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
    name: 'SignUp',
    data() {
      return {
        formData: {
          fullname: '',
          phonenumber: '',
          email: '',
          password: '',
          confirmPassword: ''
        },
        loading: false,
        errors: []
      }
    },
    methods: {
      validateForm() {
        this.errors = []
        
        // Validate email
        if (!this.formData.email.match(/^[a-zA-Z0-9._%+-]+@gmail\.com$/)) {
          this.errors.push('Email không đúng định dạng')
        }

        // Validate phone number
        if (!this.formData.phonenumber.match(/^0[0-9]{9}$/)) {
          this.errors.push('Số điện thoại không đúng định dạng')
        }

        // Validate password match
        if (this.formData.password !== this.formData.confirmPassword) {
          this.errors.push('Mật khẩu và mật khẩu xác nhận không khớp')
        }

        return this.errors.length === 0
      },

      async handleRegister() {
        if (!this.validateForm()) {
          alert(this.errors.join('\n'))
          return
        }

        try {
          this.loading = true
          const response = await fetch('/admin/register-admin', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fullname: this.formData.fullname,
              phonenumber: this.formData.phonenumber,
              email: this.formData.email,
              password: this.formData.password
            })
          })

          const data = await response.json()

          if (response.ok) {
            alert('Đăng ký thành công: ' + data.message)
            this.$router.push('/admin/login')
          } else {
            throw new Error(data.message || 'Đăng ký thất bại')
          }
        } catch (error) {
          alert('Lỗi đăng ký: ' + error.message)
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
  
  a {
    color: #4e73df;
    text-decoration: none;
  }
  
  a:hover {
    text-decoration: underline;
  }
  </style>
<!-- src/components/Auth/SignIn.vue -->
<template>
  <div class="auth-wrapper">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="logo-container">
            <i class="fas fa-shield-alt"></i>
          </div>
          <h2>Admin Portal</h2>
          <p>Đăng nhập để quản lý hệ thống</p>
        </div>
        
        <form @submit.prevent="handleLogin" class="auth-form">
          <div class="form-group">
            <label>
              <i class="fas fa-envelope"></i>
              <input
                type="email"
                v-model="formData.email"
                placeholder="Email của bạn"
                required
              />
            </label>
          </div>

          <div class="form-group">
            <label>
              <i class="fas fa-lock"></i>
              <input
                :type="showPassword ? 'text' : 'password'"
                v-model="formData.password"
                placeholder="Mật khẩu"
                required
              />
              <i 
                :class="['fas', showPassword ? 'fa-eye-slash' : 'fa-eye', 'password-toggle']"
                @click="showPassword = !showPassword"
              ></i>
            </label>
          </div>

          <div class="form-options">
            <label class="remember-me">
              <input type="checkbox" v-model="rememberMe">
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <a href="#" class="forgot-password">Quên mật khẩu?</a>
          </div>

          <button type="submit" :disabled="loading" class="auth-button">
            <span v-if="!loading">Đăng nhập</span>
            <div v-else class="spinner"></div>
          </button>
        </form>

        <div class="auth-footer">
          <p>Chưa có tài khoản? 
            <router-link :to="{ name: 'SignUp' }">Đăng ký ngay</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.auth-container {
  width: 100%;
  max-width: 420px;
}

.auth-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
}

.auth-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo-container {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-container i {
  font-size: 35px;
  color: white;
}

.auth-header h2 {
  color: #2d3748;
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 10px;
}

.auth-header p {
  color: #718096;
  font-size: 16px;
}

.form-group {
  margin-bottom: 25px;
}

.form-group label {
  position: relative;
  display: block;
}

.form-group i {
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: #718096;
}

.form-group input {
  width: 100%;
  padding: 15px 15px 15px 45px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.3s;
}

.form-group input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  outline: none;
}

.password-toggle {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #718096;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #718096;
  cursor: pointer;
}

.forgot-password {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.auth-button {
  width: 100%;
  padding: 15px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.auth-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.auth-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.auth-footer {
  text-align: center;
  margin-top: 30px;
  color: #718096;
}

.auth-footer a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.auth-footer a:hover {
  text-decoration: underline;
}
</style>

<script>
import Swal from 'sweetalert2'

export default {
  name: 'SignIn',
  data() {
    return {
      formData: {
        email: '',
        password: ''
      },
      loading: false,
      errors: [],
      showPassword: false,
      rememberMe: false
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
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          html: this.errors.map(err => `<div class="custom-error">${err}</div>`).join(''),
          customClass: {
            popup: 'custom-swal-popup',
            title: 'custom-swal-title',
            icon: 'custom-swal-icon',
            content: 'custom-swal-content',
            confirmButton: 'custom-swal-confirm-button'
          },
          buttonsStyling: false,
          showClass: {
            popup: 'animate__animated animate__fadeInDown animate__faster'
          },
          hideClass: {
            popup: 'animate__animated animate__fadeOutUp animate__faster'
          }
        });
        return;
      }

      try {
        this.loading = true;
        const response = await fetch('/api/admin/login-admin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(this.formData),
          credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Đăng nhập thất bại');
        }

        if (data.token) {
          localStorage.setItem('adminToken', data.token);
          localStorage.setItem('fullname', data.fullname);
          localStorage.setItem('role', data.role);

          await Swal.fire({
            icon: 'success',
            title: 'Đăng nhập thành công!',
            text: 'Đang chuyển hướng...',
            timer: 1500,
            timerProgressBar: true,
            showConfirmButton: false,
            customClass: {
              popup: 'custom-swal-popup',
              title: 'custom-swal-title',
              icon: 'custom-swal-icon',
              content: 'custom-swal-content'
            },
            showClass: {
              popup: 'animate__animated animate__fadeInDown animate__faster'
            },
            hideClass: {
              popup: 'animate__animated animate__fadeOutUp animate__faster'
            }
          });

          await this.$router.push('/admin/dashboard');
        }
      } catch (error) {
        console.error('Login error:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi đăng nhập!',
          text: error.message || 'Không thể kết nối đến server',
          customClass: {
            popup: 'custom-swal-popup',
            title: 'custom-swal-title',
            icon: 'custom-swal-icon',
            content: 'custom-swal-content',
            confirmButton: 'custom-swal-confirm-button'
          },
          buttonsStyling: false
        });
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>
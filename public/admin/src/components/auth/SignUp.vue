<!-- src/components/Auth/SignUp.vue -->
<template>
  <div class="auth-wrapper">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="logo-container">
            <i class="fas fa-user-shield"></i>
          </div>
          <h2>Tạo tài khoản Admin</h2>
          <p>Điền thông tin để bắt đầu</p>
        </div>
        
        <form @submit.prevent="handleRegister" class="auth-form">
          <div class="form-group">
            <label>
              <i class="fas fa-user"></i>
              <input
                type="text"
                v-model="formData.fullname"
                placeholder="Họ và tên"
                required
              />
            </label>
          </div>

          <div class="form-group">
            <label>
              <i class="fas fa-phone"></i>
              <input
                type="tel"
                v-model="formData.phonenumber"
                placeholder="Số điện thoại"
                required
              />
            </label>
          </div>

          <div class="form-group">
            <label>
              <i class="fas fa-envelope"></i>
              <input
                type="email"
                v-model="formData.email"
                placeholder="Email"
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

          <div class="form-group">
            <label>
              <i class="fas fa-lock"></i>
              <input
                :type="showConfirmPassword ? 'text' : 'password'"
                v-model="formData.confirmPassword"
                placeholder="Xác nhận mật khẩu"
                required
              />
              <i 
                :class="['fas', showConfirmPassword ? 'fa-eye-slash' : 'fa-eye', 'password-toggle']"
                @click="showConfirmPassword = !showConfirmPassword"
              ></i>
            </label>
          </div>

          <button type="submit" :disabled="loading" class="auth-button">
            <span v-if="!loading">Đăng ký</span>
            <div v-else class="spinner"></div>
          </button>
        </form>

        <div class="auth-footer">
          <p>Đã có tài khoản? 
            <router-link :to="{ name: 'SignIn' }">Đăng nhập</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Swal from 'sweetalert2'

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
      showPassword: false,
      showConfirmPassword: false,
      errors: []
    }
  },
  methods: {
    validateForm() {
      this.errors = []
      
      // Validate email
      if (!this.formData.email.match(/^[a-zA-Z0-9._%+-]+@gmail\.com$/)) {
        this.errors.push('Email không đúng định dạng (phải là địa chỉ @gmail.com)')
      }

      // Validate phone number
      if (!this.formData.phonenumber.match(/^0[0-9]{9}$/)) {
        this.errors.push('Số điện thoại phải bắt đầu bằng số 0 và có 10 chữ số')
      }

      // Validate password match
      if (this.formData.password !== this.formData.confirmPassword) {
        this.errors.push('Mật khẩu và xác nhận mật khẩu không khớp')
      }

      // Validate password length
      if (this.formData.password.length < 6) {
        this.errors.push('Mật khẩu phải có ít nhất 6 ký tự')
      }

      return this.errors.length === 0
    },

    async handleRegister() {
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
          buttonsStyling: false
        });
        return;
      }

      try {
        this.loading = true;
        const response = await fetch('/api/admin/register-admin', {
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
        });

        const data = await response.json();

        if (response.ok) {
          await Swal.fire({
            icon: 'success',
            title: 'Đăng ký thành công!',
            text: 'Bạn sẽ được chuyển đến trang đăng nhập',
            timer: 2000,
            timerProgressBar: true,
            showConfirmButton: false,
            customClass: {
              popup: 'custom-swal-popup',
              title: 'custom-swal-title',
              icon: 'custom-swal-icon',
              content: 'custom-swal-content'
            }
          });
          
          this.$router.push({ name: 'SignIn' });
        } else {
          throw new Error(data.message || 'Đăng ký thất bại');
        }
      } catch (error) {
        console.error('Register error:', error);
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi đăng ký!',
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
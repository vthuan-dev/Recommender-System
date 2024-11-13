<template>
  <div class="register-wrapper">
    <div class="register-container">
      <div class="register-card">
        <!-- Logo và Header -->
        <div class="register-header">
          <div class="logo">
            <i class="fas fa-shopping-bag"></i>
          </div>
          <h2>Tạo tài khoản mới</h2>
          <p>Đăng ký để trải nghiệm mua sắm tốt nhất</p>
        </div>

        <!-- Form đăng ký -->
        <form @submit.prevent="handleRegister" class="register-form">
          <div class="form-group">
            <label>
              <i class="fas fa-user"></i>
              <input
                type="text"
                v-model="form.fullname"
                placeholder="Họ và tên"
                required
              />
            </label>
          </div>

          <div class="form-group">
            <label>
              <i class="fas fa-envelope"></i>
              <input
                type="email"
                v-model="form.email"
                placeholder="Email của bạn"
                required
              />
            </label>
          </div>

          <div class="form-group">
            <label>
              <i class="fas fa-phone"></i>
              <input
                type="tel"
                v-model="form.phonenumber"
                placeholder="Số điện thoại"
                required
                pattern="[0-9]{10}"
              />
            </label>
          </div>

          <div class="form-group">
            <label>
              <i class="fas fa-lock"></i>
              <input
                :type="showPassword ? 'text' : 'password'"
                v-model="form.password"
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
                v-model="form.confirmPassword"
                placeholder="Xác nhận mật khẩu"
                required
              />
              <i 
                :class="['fas', showConfirmPassword ? 'fa-eye-slash' : 'fa-eye', 'password-toggle']"
                @click="showConfirmPassword = !showConfirmPassword"
              ></i>
            </label>
          </div>

          <button type="submit" :disabled="loading" class="register-button">
            <span v-if="!loading">Đăng ký</span>
            <div v-else class="spinner"></div>
          </button>

          <div class="social-register">
            <div class="divider">
              <span>Hoặc đăng ký với</span>
            </div>
            <div class="social-buttons">
              <button type="button" class="social-btn google-btn" @click="handleGoogleRegister">
                <i class="fab fa-google"></i>
                Google
              </button>
              <button type="button" class="social-btn facebook-btn">
                <i class="fab fa-facebook-f"></i>
                Facebook
              </button>
            </div>
          </div>
        </form>

        <div class="register-footer">
          <p>Đã có tài khoản? 
            <router-link to="/login">Đăng nhập ngay</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import Swal from 'sweetalert2'

export default {
  name: 'RegisterView',
  setup() {
    const router = useRouter();
    const store = useStore();
    const form = ref({
      fullname: '',
      email: '',
      phonenumber: '',
      password: '',
      confirmPassword: ''
    });
    
    const loading = ref(false);
    const showPassword = ref(false);
    const showConfirmPassword = ref(false);

    // Hàm validate form
    const validateForm = () => {
      const errors = [];
      
      if (form.value.fullname.length < 2) {
        errors.push('Họ tên phải có ít nhất 2 ký tự');
      }

      if (!form.value.email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)) {
        errors.push('Email không đúng định dạng');
      }

      if (!form.value.phonenumber.match(/^0[0-9]{9}$/)) {
        errors.push('Số điện thoại phải bắt đầu bằng số 0 và có 10 chữ số');
      }

      if (form.value.password.length < 6) {
        errors.push('Mật khẩu phải có ít nhất 6 ký tự');
      }

      if (form.value.password !== form.value.confirmPassword) {
        errors.push('Mật khẩu và xác nhận mật khẩu không khớp');
      }

      if (errors.length > 0) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          html: errors.map(err => `<div class="custom-error">${err}</div>`).join(''),
          customClass: {
            popup: 'custom-swal-popup',
            title: 'custom-swal-title',
            icon: 'custom-swal-icon',
            content: 'custom-swal-content',
            confirmButton: 'custom-swal-confirm-button'
          },
          buttonsStyling: false
        });
        return false;
      }
      return true;
    };

    const handleRegister = async () => {
      if (!validateForm()) return;

      try {
        loading.value = true;
        
        const response = await fetch('http://localhost:3000/api/register-client', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            fullname: form.value.fullname,
            email: form.value.email,
            phonenumber: form.value.phonenumber,
            password: form.value.password
          })
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Đăng ký thất bại');
        }

        await Swal.fire({
          icon: 'success',
          title: 'Đăng ký thành công!',
          text: 'Chào mừng bạn đến với hệ thống của chúng tôi',
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

        await store.dispatch('login', {
          email: form.value.email,
          password: form.value.password
        });

        router.push('/');
      } catch (error) {
        Swal.fire({
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
        loading.value = false;
      }
    };

    const handleGoogleRegister = async () => {
      try {
        const response = await store.dispatch('googleLogin');
        if (response.success) {
          Swal.fire({
            icon: 'success',
            title: 'Đăng nhập thành công!',
            text: 'Đăng nhập bằng Google thành công',
            confirmButtonText: 'Đồng ý',
            confirmButtonColor: '#667eea'
          });
          router.push('/');
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: 'Đăng nhập bằng Google thất bại',
          confirmButtonText: 'Đóng',
          confirmButtonColor: '#667eea'
        });
      }
    };

    return {
      form,
      loading,
      showPassword,
      showConfirmPassword,
      handleRegister,
      handleGoogleRegister
    };
  }
}
</script>

<style scoped>
.register-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-container {
  width: 100%;
  max-width: 480px;
}

.register-card {
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.register-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
}

.logo i {
  font-size: 30px;
  color: white;
}

.register-header h2 {
  font-size: 24px;
  color: #2d3748;
  margin-bottom: 8px;
}

.register-header p {
  color: #718096;
  font-size: 16px;
}

.form-group {
  position: relative;
  margin-bottom: 20px;
}

.form-group label {
  display: flex;
  align-items: center;
  background: #f8fafc;
  border-radius: 10px;
  padding: 5px 15px;
  transition: all 0.3s ease;
}

.form-group label:focus-within {
  background: white;
  box-shadow: 0 0 0 2px #667eea;
}

.form-group i:not(.password-toggle) {
  color: #a0aec0;
  font-size: 18px;
  width: 24px;
}

.form-group input {
  border: none;
  background: transparent;
  padding: 12px;
  width: 100%;
  outline: none;
  font-size: 16px;
}

.password-toggle {
  cursor: pointer;
  color: #a0aec0;
  transition: color 0.3s ease;
  position: absolute;
  right: 15px;
}

.password-toggle:hover {
  color: #667eea;
}

.register-button {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(to right, #667eea, #764ba2);
  color: white;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 25px;
}

.register-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.register-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.divider {
  text-align: center;
  position: relative;
  margin: 25px 0;
}

.divider::before,
.divider::after {
  content: "";
  position: absolute;
  top: 50%;
  width: calc(50% - 60px);
  height: 1px;
  background: #e2e8f0;
}

.divider::before {
  left: 0;
}

.divider::after {
  right: 0;
}

.divider span {
  background: white;
  padding: 0 15px;
  color: #718096;
  font-size: 14px;
}

.social-buttons {
  display: flex;
  gap: 15px;
}

.social-btn {
  flex: 1;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  color: #4a5568;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.social-btn:hover {
  background: #f7fafc;
  border-color: #cbd5e0;
}

.social-btn i {
  font-size: 18px;
}

.google-btn i {
  color: #ea4335;
}

.facebook-btn i {
  color: #1877f2;
}

.register-footer {
  text-align: center;
  margin-top: 30px;
  color: #718096;
}

.register-footer a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.register-footer a:hover {
  text-decoration: underline;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #ffffff;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 480px) {
  .register-card {
    padding: 30px 20px;
  }

  .social-buttons {
    flex-direction: column;
  }
}

.error-message {
  background-color: #fff5f5;
  color: #c53030;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.error-message i {
  font-size: 16px;
}

/* Add these styles for SweetAlert customization */
.custom-swal-popup {
  font-family: 'Roboto', sans-serif;
  border-radius: 15px;
}

.custom-swal-title {
  color: #2d3748;
  font-weight: 600;
}

.custom-swal-icon {
  border-color: #667eea !important;
}

.custom-swal-content {
  color: #4a5568;
}

.custom-error {
  color: #e53e3e;
  margin: 8px 0;
  text-align: left;
  padding-left: 20px;
}

.custom-swal-confirm-button {
  background-color: #667eea !important;
  color: white;
  border-radius: 8px;
  padding: 10px 24px;
  font-weight: 500;
}
</style>
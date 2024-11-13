<template>
  <div class="auth-wrapper">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="logo">
            <i class="fas fa-shopping-bag"></i>
          </div>
          <h2>Tạo tài khoản</h2>
        </div>

        <form @submit.prevent="handleRegister" class="auth-form">
          <div class="form-group">
            <input
              type="text"
              v-model="form.fullname"
              placeholder="Họ và tên"
              required
            />
            <i class="fas fa-user"></i>
          </div>

          <div class="form-group">
            <input
              type="email"
              v-model="form.email"
              placeholder="Email"
              required
            />
            <i class="fas fa-envelope"></i>
          </div>

          <div class="form-group">
            <input
              type="tel"
              v-model="form.phonenumber"
              placeholder="Số điện thoại"
              required
              pattern="[0-9]{10}"
            />
            <i class="fas fa-phone"></i>
          </div>

          <div class="form-group">
            <input
              :type="showPassword ? 'text' : 'password'"
              v-model="form.password"
              placeholder="Mật khẩu"
              required
            />
            <i class="fas fa-lock"></i>
            <i 
              :class="['fas', showPassword ? 'fa-eye-slash' : 'fa-eye', 'toggle-password']"
              @click="showPassword = !showPassword"
            ></i>
          </div>

          <div class="form-group">
            <input
              :type="showConfirmPassword ? 'text' : 'password'"
              v-model="form.confirmPassword"
              placeholder="Xác nhận mật khẩu"
              required
            />
            <i class="fas fa-lock"></i>
            <i 
              :class="['fas', showConfirmPassword ? 'fa-eye-slash' : 'fa-eye', 'toggle-password']"
              @click="showConfirmPassword = !showConfirmPassword"
            ></i>
          </div>

          <button type="submit" :disabled="loading" class="auth-button">
            <span v-if="!loading">Đăng ký</span>
            <div v-else class="spinner"></div>
          </button>

          <div class="social-auth">
            <div class="divider">hoặc</div>
            <button type="button" class="google-btn" @click="handleGoogleRegister">
              <i class="fab fa-google"></i>
              Tiếp tục với Google
            </button>
          </div>
        </form>

        <div class="auth-footer">
          <p>Đã có tài khoản? <router-link to="/login">Đăng nhập</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import CustomSweetAlert from '@/components/Common/CustomSweetAlert'

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
    const validateForm = async () => {
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
        await CustomSweetAlert.validation(errors);
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

        await CustomSweetAlert.success(
          'Đăng ký thành công!',
          'Chào mừng bạn đến với hệ thống của chúng tôi'
        );

        await store.dispatch('login', {
          email: form.value.email,
          password: form.value.password
        });

        router.push('/');
      } catch (error) {
        CustomSweetAlert.error(
          'Lỗi đăng ký!',
          error.message || 'Không thể kết nối đến server'
        );
      } finally {
        loading.value = false;
      }
    };

    const handleGoogleRegister = () => {
      loading.value = true;
      window.location.href = 'http://localhost:3000/api/auth/google';
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
.auth-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7fafc;
  padding: 20px;
}

.auth-container {
  width: 100%;
  max-width: 400px;
}

.auth-card {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
}

.auth-header {
  text-align: center;
  margin-bottom: 32px;
}

.logo {
  width: 60px;
  height: 60px;
  margin: 0 auto 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo i {
  font-size: 28px;
  color: white;
}

.auth-header h2 {
  font-size: 24px;
  color: #1a202c;
  margin: 0;
}

.form-group {
  position: relative;
  margin-bottom: 16px;
}

.form-group input {
  width: 100%;
  padding: 12px 40px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s;
}

.form-group input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
  outline: none;
}

.form-group i:not(.toggle-password) {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
}

.toggle-password {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
  cursor: pointer;
}

.auth-button {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.auth-button:hover {
  opacity: 0.95;
  transform: translateY(-1px);
}

.social-auth {
  margin-top: 24px;
}

.divider {
  text-align: center;
  position: relative;
  margin: 20px 0;
  color: #a0aec0;
  font-size: 14px;
}

.divider::before,
.divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 45%;
  height: 1px;
  background: #e2e8f0;
}

.divider::before { left: 0; }
.divider::after { right: 0; }

.google-btn {
  width: 100%;
  padding: 12px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
}

.google-btn:hover {
  background: #f7fafc;
}

.google-btn i {
  color: #ea4335;
}

.auth-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: #718096;
}

.auth-footer a {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid white;
  border-top: 2px solid transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
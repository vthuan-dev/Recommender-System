<template>
  <div class="login-wrapper">
    <div class="login-container">
      <div class="login-card">
        <!-- Logo và Header -->
        <div class="login-header">
          <div class="logo">
            <i class="fas fa-shopping-bag"></i>
          </div>
          <h2>Chào mừng trở lại!</h2>
          <p>Đăng nhập để tiếp tục mua sắm</p>
        </div>

        <!-- Form đăng nhập -->
        <form @submit.prevent="handleLogin" class="login-form">
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

          <div class="form-options">
            <label class="remember-me">
              <input type="checkbox" v-model="rememberMe">
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <a href="#" class="forgot-password">Quên mật khẩu?</a>
          </div>

          <div v-if="error" class="error-message">
            <i class="fas fa-exclamation-circle"></i>
            {{ error }}
          </div>

          <button type="submit" :disabled="loading" class="login-button">
            <span v-if="!loading">Đăng nhập</span>
            <div v-else class="spinner"></div>
          </button>

          <!-- Social Login -->
          <div class="social-login">
            <p>Hoặc đăng nhập với</p>
            <div class="social-buttons">
              <button type="button" class="google-btn" @click="handleGoogleLogin">
                <i class="fab fa-google"></i>
                Google
              </button>
              <button type="button" class="facebook-btn">
                <i class="fab fa-facebook-f"></i>
                Facebook
              </button>
            </div>
          </div>
        </form>

        <div class="login-footer">
          <p>Chưa có tài khoản? 
            <router-link to="/register">Đăng ký ngay</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// import axiosInstance from '@/utils/axios';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import Swal from 'sweetalert2'

export default {
  name: 'LoginView',
  setup() {
    const router = useRouter();
    const store = useStore();
    
    const form = ref({
      email: '',
      password: ''
    });
    
    const loading = ref(false);
    const showPassword = ref(false);
    const rememberMe = ref(false);
    const error = ref('');

    const handleLogin = async () => {
      try {
        loading.value = true;
        error.value = '';
        
        await store.dispatch('login', {
          email: form.value.email,
          password: form.value.password
        });

        if (rememberMe.value) {
          localStorage.setItem('rememberMe', 'true');
        }

        router.push('/');
      } catch (err) {
        error.value = err.response?.data?.message || 'Có lỗi xảy ra khi đăng nhập';
      } finally {
        loading.value = false;
      }
    };

    const handleGoogleLogin = async () => {
      try {
        loading.value = true;
        error.value = '';
        
        // Load Google API
        await loadGoogleAPI();
        
        const googleAuth = window.google.accounts.oauth2.initTokenClient({
          client_id: process.env.VUE_APP_GOOGLE_CLIENT_ID,
          callback: async (response) => {
            try {
              // Gửi token đến server
              await store.dispatch('googleLogin', response.access_token);
              router.push('/');
            } catch (err) {
              error.value = 'Đăng nhập bằng Google thất bại';
            } finally {
              loading.value = false;
            }
          },
          error_callback: (err) => {
            error.value = 'Đăng nhập bằng Google thất bại';
            loading.value = false;
          }
        });

        googleAuth.requestAccessToken();

      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Lỗi đăng nhập!',
          text: err.message || 'Không thể kết nối với Google',
          customClass: {
            popup: 'custom-swal-popup',
            title: 'custom-swal-title',
            icon: 'custom-swal-icon',
            content: 'custom-swal-content',
            confirmButton: 'custom-swal-confirm-button'
          },
          buttonsStyling: false
        });
        loading.value = false;
      }
    };

    const loadGoogleAPI = () => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    };

    return {
      form,
      loading,
      showPassword,
      rememberMe,
      error,
      handleLogin,
      handleGoogleLogin
    };
  }
};
</script>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 450px;
}

.login-card {
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo {
  width: 80px;
  height: 80px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo i {
  font-size: 35px;
  color: white;
}

.login-header h2 {
  color: #2d3748;
  font-size: 24px;
  margin-bottom: 10px;
}

.login-header p {
  color: #718096;
  font-size: 16px;
}

.form-group {
  margin-bottom: 20px;
  position: relative;
}

.form-group label {
  display: flex;
  align-items: center;
  background: #f7fafc;
  border-radius: 10px;
  padding: 5px 15px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.form-group label:focus-within {
  border-color: #667eea;
  background: white;
}

.form-group i {
  color: #a0aec0;
  font-size: 18px;
  margin-right: 10px;
}

.form-group input {
  width: 100%;
  padding: 12px 0;
  border: none;
  background: transparent;
  outline: none;
  font-size: 16px;
}

.password-toggle {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
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

.login-button {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.login-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.login-button:disabled {
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

.social-login {
  margin-top: 30px;
  text-align: center;
}

.social-login p {
  color: #718096;
  margin-bottom: 15px;
  position: relative;
}

.social-login p::before,
.social-login p::after {
  content: "";
  position: absolute;
  top: 50%;
  width: 30%;
  height: 1px;
  background: #e2e8f0;
}

.social-login p::before {
  left: 0;
}

.social-login p::after {
  right: 0;
}

.social-buttons {
  display: flex;
  gap: 15px;
}

.social-buttons button {
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

.social-buttons button:hover {
  background: #f7fafc;
  border-color: #cbd5e0;
}

.social-buttons i {
  font-size: 18px;
}

.google-btn i {
  color: #ea4335;
}

.facebook-btn i {
  color: #1877f2;
}

.login-footer {
  text-align: center;
  margin-top: 30px;
  color: #718096;
}

.login-footer a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.login-footer a:hover {
  text-decoration: underline;
}

@media (max-width: 480px) {
  .login-card {
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
</style>
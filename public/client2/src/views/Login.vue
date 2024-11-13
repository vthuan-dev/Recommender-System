<template>
  <div class="auth-wrapper">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <div class="logo">
            <i class="fas fa-shopping-bag"></i>
          </div>
          <h2>Đăng nhập</h2>
        </div>

        <form @submit.prevent="handleLogin" class="auth-form">
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

          <button type="submit" :disabled="loading" class="auth-button">
            <span v-if="!loading">Đăng nhập</span>
            <div v-else class="spinner"></div>
          </button>

          <div class="social-auth">
            <div class="divider">hoặc</div>
            <button type="button" class="google-btn" @click="handleGoogleLogin">
              <svg class="google-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.8055 10.0415H21V10H12V14H17.6515C16.827 16.3285 14.6115 18 12 18C8.6865 18 6 15.3135 6 12C6 8.6865 8.6865 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C6.4775 2 2 6.4775 2 12C2 17.5225 6.4775 22 12 22C17.5225 22 22 17.5225 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#FFC107"/>
                <path d="M3.15295 7.3455L6.43845 9.755C7.32745 7.554 9.48045 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C8.15895 2 4.82795 4.1685 3.15295 7.3455Z" fill="#FF3D00"/>
                <path d="M12 22C14.583 22 16.93 21.0115 18.7045 19.404L15.6095 16.785C14.5718 17.5742 13.3038 18.0011 12 18C9.39903 18 7.19053 16.3415 6.35853 14.027L3.09753 16.5395C4.75253 19.778 8.11353 22 12 22Z" fill="#4CAF50"/>
                <path d="M21.8055 10.0415H21V10H12V14H17.6515C17.2571 15.1082 16.5467 16.0766 15.608 16.7855L15.6095 16.785L18.7045 19.404C18.4855 19.6025 22 17 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z" fill="#1976D2"/>
              </svg>
              <span>Tiếp tục với Google</span>
            </button>
          </div>
        </form>

        <div class="auth-footer">
          <p>Chưa có tài khoản? <router-link to="/register">Đăng ký</router-link></p>
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
import CustomSweetAlert from '@/components/Common/CustomSweetAlert'

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
        
        const response = await fetch('http://localhost:3000/api/login-client', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(form.value)
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Đăng nhập thất bại');
        }

        // Lưu token vào localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.userId);
        localStorage.setItem('fullname', data.fullname);
        localStorage.setItem('role', 'customer');

        // Cập nhật state trong store
        await store.commit('setUser', {
          userId: data.userId,
          fullname: data.fullname,
          token: data.token,
          role: 'customer'
        });

        await CustomSweetAlert.success(
          'Đăng nhập thành công!',
          `Chào mừng ${data.fullname} quay trở lại`
        );

        setTimeout(() => {
          router.push('/');
        }, 2000);

      } catch (err) {
        CustomSweetAlert.error(
          'Lỗi đăng nhập!',
          err.message || 'Email hoặc mật khẩu không đúng'
        );
      } finally {
        loading.value = false;
      }
    };

    const handleGoogleLogin = () => {
      loading.value = true;
      
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const googleWindow = window.open(
        'http://localhost:3000/api/auth/google',
        'Google Login',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Lắng nghe message từ cửa sổ popup
      window.addEventListener('message', async (event) => {
        if (event.origin !== 'http://localhost:3000') return;
        
        if (event.data.type === 'google-auth-success') {
          const { token, user } = event.data;
          
          // Cập nhật store
          await store.commit('setUser', {
            userId: user.id,
            fullname: user.fullname,
            email: user.email,
            role: user.role_name,
            token,
            avatar_url: user.avatar_url
          });

          await CustomSweetAlert.success(
            'Đăng nhập thành công!',
            `Chào mừng ${user.fullname}`
          );

          if (googleWindow) {
            googleWindow.close();
          }
          router.push('/');
        }
        loading.value = false;
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
  padding: 12px 16px 12px 40px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s;
}

.form-group input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
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
  opacity: 0.9;
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
  gap: 12px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  font-weight: 500;
  color: #4a5568;
}

.google-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e0;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.google-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
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
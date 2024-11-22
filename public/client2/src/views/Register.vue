<template>
  <div class="auth-wrapper">
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <!-- <div class="brand-logo">
            <svg class="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20.94 19.2C20.94 19.84 20.42 20.36 19.78 20.36H4.22C3.58 20.36 3.06 19.84 3.06 19.2V18.04H20.94V19.2Z" fill="url(#paint0_linear)"/>
              <path d="M20.94 18.04H3.06L4.22 8.28C4.32 7.64 4.86 7.12 5.5 7.12H18.5C19.14 7.12 19.68 7.64 19.78 8.28L20.94 18.04Z" fill="url(#paint1_linear)"/>
              <path d="M15.1 7.12V5.96C15.1 4.68 14.06 3.64 12.78 3.64H11.22C9.94 3.64 8.9 4.68 8.9 5.96V7.12H15.1Z" fill="url(#paint2_linear)"/>
              <defs>
                <linearGradient id="paint0_linear" x1="3.06" y1="19.2" x2="20.94" y2="19.2" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#4F46E5"/>
                  <stop offset="1" stop-color="#7C3AED"/>
                </linearGradient>
                <linearGradient id="paint1_linear" x1="3.06" y1="12.58" x2="20.94" y2="12.58" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#4F46E5"/>
                  <stop offset="1" stop-color="#7C3AED"/>
                </linearGradient>
                <linearGradient id="paint2_linear" x1="8.9" y1="5.38" x2="15.1" y2="5.38" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#4F46E5"/>
                  <stop offset="1" stop-color="#7C3AED"/>
                </linearGradient>
              </defs>
            </svg>
            <span class="brand-name">LUXE</span>
          </div> -->
          <div class="header-content">
            <h2>Tạo tài khoản mới</h2>
            <p>Đăng ký để trải nghiệm mua sắm tuyệt vời</p>
          </div>
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
      
      const width = 500;
      const height = 600;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const googleWindow = window.open(
        'http://localhost:3000/api/auth/google',
        'Google Login',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Thêm kiểm tra khi cửa sổ bị đóng
      const checkWindow = setInterval(() => {
        if (googleWindow.closed) {
          loading.value = false;
          clearInterval(checkWindow);
        }
      }, 1000);

      // Lắng nghe message từ cửa sổ popup
      const handleMessage = async (event) => {
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
            'Đăng ký thành công!',
            `Chào mừng ${user.fullname}`
          );

          if (googleWindow) {
            googleWindow.close();
          }
          router.push('/');
        }
        loading.value = false;
        // Xóa event listener sau khi xử lý xong
        window.removeEventListener('message', handleMessage);
        clearInterval(checkWindow);
      };

      window.addEventListener('message', handleMessage);
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
  margin-bottom: 40px;
}

.brand-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  gap: 12px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  filter: drop-shadow(0 4px 6px rgba(124, 58, 237, 0.2));
}

.brand-name {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 2px;
  background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-content h2 {
  font-size: 24px;
  font-weight: 700;
  color: #1F2937;
  margin-bottom: 8px;
}

.header-content p {
  font-size: 16px;
  color: #6B7280;
  font-weight: 400;
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
  height: 48px;
  padding: 12px;
  background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-button:hover {
  opacity: 0.95;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.2);
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

@media (max-width: 768px) {
  .auth-card {
    padding: 24px;
  }
  
  .brand-name {
    font-size: 24px;
  }
  
  .header-content h2 {
    font-size: 20px;
  }
  
  .header-content p {
    font-size: 14px;
  }
}
</style>
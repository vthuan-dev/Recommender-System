<template>
    <div class="loading-wrapper">
      <div class="spinner"></div>
      <p>Đang xử lý đăng nhập...</p>
    </div>
  </template>
  
  <script>
  import { onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { useStore } from 'vuex';
  import CustomSweetAlert from '@/components/Common/CustomSweetAlert';
  
  export default {
    name: 'AuthCallback',
    setup() {
      const router = useRouter();
      const store = useStore();
  
      onMounted(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        
        if (token) {
          store.commit('setUser', {
            token,
            userId: params.get('userId'),
            fullname: params.get('fullname'),
            email: params.get('email'),
            role: params.get('role')
          });
          
          CustomSweetAlert.success(
            'Đăng nhập thành công!',
            `Chào mừng ${params.get('fullname')}`
          );
          
          router.push('/');
        } else {
          CustomSweetAlert.error(
            'Lỗi đăng nhập!',
            'Không thể xác thực với Google'
          );
          router.push('/login');
        }
      });
  
      return {};
    }
  }
  </script>
  
  <style scoped>
  .loading-wrapper {
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  </style>
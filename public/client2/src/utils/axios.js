import axios from 'axios';
import store from '@/store';
import router from '@/router';
import CustomSweetAlert from '@/components/Common/CustomSweetAlert';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Thêm interceptor để xử lý token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      store.dispatch('logout');
      CustomSweetAlert.warning(
        'Phiên đăng nhập đã hết hạn',
        'Vui lòng đăng nhập lại để tiếp tục!'
      );
      router.push('/login');
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
import axios from 'axios';
import router from '../router';
import Swal from 'sweetalert2';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/admin',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor cho request
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Interceptor cho response
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('fullname');
      localStorage.removeItem('role');

      await Swal.fire({
        icon: 'warning',
        title: 'Phiên đăng nhập đã hết hạn',
        text: 'Vui lòng đăng nhập lại',
        confirmButtonText: 'Đăng nhập lại'
      });

      router.push('/admin/sign-in');
    }
    return Promise.reject(error);
  }
);

export default api;
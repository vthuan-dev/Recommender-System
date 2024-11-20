import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/Home.vue'
import ProductList from '../views/ProductList.vue'
import ProductDetail from '../views/ProductDetail.vue'
import Cart from '../views/Cart.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Profile from '../views/Profile.vue'
import Orders from '../views/Orders.vue'
import { h, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import CustomSweetAlert from '@/components/Common/CustomSweetAlert'

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/products',
    name: 'Products',
    component: ProductList,
    meta: {
      title: 'Sản phẩm - T-Store' 
    }
  },
  {
    path: '/products/:category',
    name: 'ProductsByCategory',
    component: ProductList,
    meta: {
      title: 'Danh mục sản phẩm - T-Store'
    }
  },
  {
    path: '/product/:id',
    name: 'ProductDetail',
    component: ProductDetail
  },
  {
    path: '/cart',
    name: 'Cart',
    component: Cart
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
  {
    path: '/orders',
    name: 'Orders',
    component: Orders,
    meta: { requiresAuth: true }
  },
  {
    path: '/auth/callback',
    name: 'AuthCallback',
    component: {
      setup() {
        const route = useRoute();
        const router = useRouter();
        const store = useStore();

        onMounted(async () => {
          const { token, user } = route.query;
          
          if (token && user) {
            const userData = JSON.parse(decodeURIComponent(user));
            
            await store.commit('setUser', {
              userId: userData.id,
              fullname: userData.fullname,
              email: userData.email,
              role: userData.role_name,
              token: token,
              avatar_url: userData.avatar_url,
              phonenumber: userData.phonenumber
            });
            
            localStorage.setItem('token', token);
            localStorage.setItem('userId', userData.id);
            localStorage.setItem('fullname', userData.fullname);
            localStorage.setItem('role', userData.role_name);

            await CustomSweetAlert.success(
              'Đăng nhập thành công!',
              `Chào mừng ${userData.fullname}`
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

        return () => h('div', 'Đang xử lý đăng nhập...');
      }
    }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || 'T-Store'
  
  if (to.matched.some(record => record.meta.requiresAuth)) {
    const token = localStorage.getItem('token')
    if (!token) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
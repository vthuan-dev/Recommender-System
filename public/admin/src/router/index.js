import { createRouter, createWebHistory } from 'vue-router';
import SignIn from '../components/auth/SignIn.vue';
import SignUp from '../components/auth/SignUp.vue';
import AdminLayout from '../components/layout/AdminLayout.vue';
import Dashboard from '../views/Dashboard.vue';
import Settings from '../components/settings/Settings.vue';
import ProductManager from '../components/products/ProductManager.vue';
import Orders from '../views/Orders.vue';

const routes = [
  {
    path: '/sign-in',
    name: 'SignIn',
    component: SignIn,
    meta: { requiresUnauth: true }
  },
  {
    path: '/sign-up',
    name: 'SignUp',
    component: SignUp,
    meta: { requiresUnauth: true }
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard
      },
      {
        path: 'settings',
        name: 'Settings',
        component: Settings
      },
      {
        path: 'products',
        name: 'ProductManager',
        component: ProductManager,
        meta: {
          title: 'Quản lý sản phẩm'
        }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: Orders,
        meta: {
          title: 'Quản lý đơn hàng'
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
];

const router = createRouter({
  history: createWebHistory('/admin/'),
  routes
});

router.beforeEach((to, from, next) => {
  const adminToken = localStorage.getItem('adminToken')
  
  if (to.path.startsWith('/admin') && 
      !['SignIn', 'SignUp'].includes(to.name)) {
    if (!adminToken) {
      next({ name: 'SignIn' })
    } else {
      next()
    }
  } else {
    next()
  }
});

export default router;
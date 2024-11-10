import { createRouter, createWebHistory } from 'vue-router';
import SignIn from '../components/auth/SignIn.vue';
import SignUp from '../components/auth/SignUp.vue';
import AdminLayout from '../components/layout/AdminLayout.vue';
import Dashboard from '../views/Dashboard.vue';
import Settings from '../components/settings/Settings.vue';

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
  
  // Nếu route bắt đầu bằng /admin và không phải login/register
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
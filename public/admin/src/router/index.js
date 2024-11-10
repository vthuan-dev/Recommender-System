import { createRouter, createWebHistory } from 'vue-router';
import SignIn from '../components/auth/SignIn.vue';
import SignUp from '../components/auth/SignUp.vue';
import AdminLayout from '../components/layout/AdminLayout.vue';
import Dashboard from '../views/Dashboard.vue';

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
    path: '/',
    component: AdminLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard'
      },
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: Dashboard
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
  const isAuthenticated = !!localStorage.getItem('adminToken');

  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      next({ name: 'SignIn' });
    } else {
      next();
    }
  } else if (to.matched.some(record => record.meta.requiresUnauth)) {
    if (isAuthenticated) {
      next({ path: '/dashboard' });
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
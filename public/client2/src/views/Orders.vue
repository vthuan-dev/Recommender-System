<template>
    <div class="container py-5">
      <h2 class="mb-4">Đơn hàng của tôi</h2>
      <div v-if="loading" class="text-center">
        <i class="fas fa-spinner fa-spin fa-2x"></i>
      </div>
      <div v-else-if="!orders.length" class="text-center">
        <i class="fas fa-shopping-bag fa-3x mb-3 text-muted"></i>
        <p>Bạn chưa có đơn hàng nào</p>
        <router-link to="/products" class="btn btn-primary">
          Mua sắm ngay
        </router-link>
      </div>
      <div v-else class="row">
        <div v-for="order in orders" :key="order.id" class="col-12 mb-4">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <span>Đơn hàng #{{ order.id }}</span>
              <span :class="getStatusClass(order.status)">{{ order.status }}</span>
            </div>
            <div class="card-body">
              <div v-for="item in order.items" :key="item.id" class="d-flex mb-2">
                <i class="fas fa-box fa-2x me-3"></i>
                <div>
                  <h6 class="mb-0">{{ item.product_name }}</h6>
                  <small class="text-muted">
                    {{ item.quantity }} x {{ formatPrice(item.price) }}
                  </small>
                </div>
              </div>
              <hr>
              <div class="d-flex justify-content-between">
                <strong>Tổng tiền:</strong>
                <strong>{{ formatPrice(order.total) }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from 'vue'
  import { useStore } from 'vuex'
  
  export default {
    name: 'OrdersView',
    setup() {
      const store = useStore()
      const orders = ref([])
      const loading = ref(true)
  
      const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(price)
      }
  
      const getStatusClass = (status) => {
        const classes = {
          'pending': 'text-warning',
          'processing': 'text-primary',
          'completed': 'text-success',
          'cancelled': 'text-danger'
        }
        return classes[status] || 'text-muted'
      }
  
      onMounted(async () => {
        try {
          await store.dispatch('fetchOrders')
          orders.value = store.state.orders
        } finally {
          loading.value = false
        }
      })
  
      return {
        orders,
        loading,
        formatPrice,
        getStatusClass
      }
    }
  }
  </script>
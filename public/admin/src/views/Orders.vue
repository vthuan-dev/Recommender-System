<template>
  <div class="page-container">
    <OrderManager />
  </div>
</template>

<script>
import OrderManager from '../components/orders/OrderManager.vue'

export default {
  name: 'OrdersPage',
  components: {
    OrderManager
  }
}
</script>
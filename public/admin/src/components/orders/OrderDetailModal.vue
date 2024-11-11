<template>
  <Transition name="modal">
    <div class="modal-wrapper" v-if="show">
      <div class="modal" @click.self="$emit('close')">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <!-- Debug info -->
            <div v-if="debug" class="p-3 bg-light">
              <pre>{{ JSON.stringify(order, null, 2) }}</pre>
            </div>
            
            <div class="modal-header">
              <h5 class="modal-title">Chi tiết đơn hàng {{ order?.id ? `#${order.id}` : '' }}</h5>
              <button type="button" class="btn-close" @click="$emit('close')"></button>
            </div>
            
            <div class="modal-body">
              <div v-if="!order" class="loading-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Đang tải thông tin đơn hàng...</p>
              </div>

              <template v-else>
                <!-- Existing content -->
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
  
<script>
import { ref } from 'vue'

export default {
  name: 'OrderDetailModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    order: {
      type: Object,
      default: null
    }
  },
  setup() {
    const debug = ref(true) // Set to false in production
    
    return {
      debug,
      formatPrice: (price) => {
        if (!price) return '0 ₫'
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(price)
      },
      formatDate: (date) => {
        if (!date) return ''
        return new Date(date).toLocaleString('vi-VN')
      }
    }
  }
}
</script>
  
<style scoped>
.modal-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
  
.modal {
  position: relative;
  width: 100%;
  z-index: 10000;
}
  
.modal-dialog {
  width: 90%;
  max-width: 800px;
  margin: 1.75rem auto;
}
  
.modal-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}
  
.section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #eee;
}
  
.section:last-child {
  border-bottom: none;
}
  
.section h6 {
  margin-bottom: 1rem;
  color: #2c3e50;
  font-weight: 600;
}
  
.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}
  
.info-item {
  display: flex;
  flex-direction: column;
}
  
.label {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.25rem;
}
  
.table {
  margin-bottom: 0;
}
  
.table th {
  background: #f8f9fa;
  font-weight: 600;
}
  
.text-end {
  text-align: right;
}

/* Add loading state styles */
.loading-state {
  text-align: center;
  padding: 2rem;
}

.loading-state i {
  font-size: 2rem;
  color: #4299e1;
  margin-bottom: 1rem;
}

.loading-state p {
  color: #718096;
}

/* Add error state styles */
.error-state {
  text-align: center;
  padding: 2rem;
  color: #e74c3c;
}

.error-state i {
  font-size: 2rem;
  color: #e74c3c;
  margin-bottom: 1rem;
}

.error-state p {
  color: #718096;
}

/* Add transition styles */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.modal-enter-to,
.modal-leave-from {
  opacity: 1;
  transform: scale(1);
}

/* Make sure modal is on top of everything */
.modal {
  z-index: 1060;
}
</style>
<template>
  <div class="toast-container">
    <transition-group name="toast">
      <div v-for="toast in toasts" 
           :key="toast.id" 
           class="toast-notification"
           :class="toast.type">
        <div class="toast-content">
          <i :class="getIcon(toast.type)" class="toast-icon"></i>
          <span>{{ toast.message }}</span>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'AppToast',
  setup() {
    const toasts = ref([])
    let toastId = 0

    const showToast = (message, type = 'success') => {
      const id = toastId++
      toasts.value.push({ id, message, type })
      setTimeout(() => {
        removeToast(id)
      }, 3000)
    }

    const removeToast = (id) => {
      const index = toasts.value.findIndex(toast => toast.id === id)
      if (index > -1) {
        toasts.value.splice(index, 1)
      }
    }

    const getIcon = (type) => {
      switch (type) {
        case 'success':
          return 'fas fa-check-circle'
        case 'error':
          return 'fas fa-times-circle'
        default:
          return 'fas fa-info-circle'
      }
    }

    return {
      toasts,
      showToast,
      getIcon
    }
  }
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
}

.toast-notification {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  margin-bottom: 10px;
  min-width: 250px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  color: #333;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toast-icon {
  font-size: 1.2em;
}

.success {
  border-left: 4px solid #4caf50;
  .toast-icon {
    color: #4caf50;
  }
}

.error {
  border-left: 4px solid #f44336;
  .toast-icon {
    color: #f44336;
  }
}

/* Toast Animation */
.toast-enter-active {
  transition: all 0.3s ease-out;
}

.toast-leave-active {
  transition: all 0.3s ease-in;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style> 
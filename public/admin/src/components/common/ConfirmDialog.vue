<template>
  <div v-if="show" class="confirm-dialog-overlay">
    <div class="confirm-dialog">
      <div class="confirm-dialog-header">
        <h3>Xác nhận xóa</h3>
      </div>
      <div class="confirm-dialog-body">
        <p>Bạn có chắc chắn muốn xóa sản phẩm này?</p>
        <p class="warning-text">Hành động này không thể hoàn tác!</p>
      </div>
      <div class="confirm-dialog-footer">
        <button class="btn btn-secondary" @click="$emit('cancel')">
          Hủy bỏ
        </button>
        <button class="btn btn-danger" @click="$emit('confirm')">
          Xóa
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ConfirmDialog',
  props: {
    show: {
      type: Boolean,
      required: true
    }
  }
}
</script>

<style scoped>
.confirm-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.confirm-dialog {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  animation: slideIn 0.3s ease-out;
}

.confirm-dialog-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.confirm-dialog-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 1.25rem;
}

.confirm-dialog-body {
  padding: 1.5rem;
  color: #4b5563;
}

.warning-text {
  color: #dc2626;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.confirm-dialog-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: #e5e7eb;
  color: #4b5563;
  border: none;
}

.btn-secondary:hover {
  background: #d1d5db;
}

.btn-danger {
  background: #dc2626;
  color: white;
  border: none;
}

.btn-danger:hover {
  background: #b91c1c;
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 640px) {
  .confirm-dialog {
    width: 95%;
    margin: 1rem;
  }
}
</style>

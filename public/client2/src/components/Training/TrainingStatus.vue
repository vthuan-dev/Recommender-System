<template>
  <div class="training-status">
    <div class="card">
      <div class="card-body">
        <h5 class="card-title">Trạng thái Training</h5>
        <div class="status-info">
          <div class="status-item">
            <i class="fas fa-clock"></i>
            <span>Lần cập nhật cuối: {{ formatTime(status.last_train_time) }}</span>
          </div>
          <div class="status-item">
            <i class="fas fa-database"></i>
            <span>Events đã xử lý: {{ status.total_events_processed }}</span>
          </div>
          <div class="status-item">
            <i class="fas fa-hourglass-half"></i>
            <span>Events đang chờ: {{ status.pending_events }}</span>
          </div>
          <div class="status-item">
            <i class="fas fa-code-branch"></i>
            <span>Phiên bản model: {{ status.model_version }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import axios from 'axios'

export default {
  name: 'TrainingStatus',
  setup() {
    const status = ref({
      last_train_time: null,
      total_events_processed: 0,
      pending_events: 0,
      model_version: 1
    })
    
    let intervalId = null
    
    const fetchStatus = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/training/status')
        if (response.data.success) {
          status.value = response.data.status
        }
      } catch (error) {
        console.error('Error fetching training status:', error)
      }
    }
    
    const formatTime = (timestamp) => {
      if (!timestamp) return 'Chưa có'
      return new Date(timestamp).toLocaleString('vi-VN')
    }
    
    onMounted(() => {
      fetchStatus()
      intervalId = setInterval(fetchStatus, 5000) // Cập nhật mỗi 5 giây
    })
    
    onUnmounted(() => {
      if (intervalId) clearInterval(intervalId)
    })
    
    return {
      status,
      formatTime
    }
  }
}
</script>

<style scoped>
.training-status {
  margin: 1rem 0;
}

.status-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-item i {
  color: #0d6efd;
}
</style> 
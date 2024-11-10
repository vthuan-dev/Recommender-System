<template>
  <div class="dashboard">
    <div class="row g-4 mb-4">
      <div class="col-md-3">
        <div class="stat-card">
          <div class="stat-card-info">
            <h6>Tổng đơn hàng</h6>
            <h2>150</h2>
            <p class="mb-0"><span class="text-success">+12%</span> so với tháng trước</p>
          </div>
          <div class="stat-card-icon">
            <i class="fas fa-shopping-cart"></i>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="stat-card-info">
            <h6>Doanh thu</h6>
            <h2>45.6M</h2>
            <p class="mb-0"><span class="text-success">+8%</span> so với tháng trước</p>
          </div>
          <div class="stat-card-icon">
            <i class="fas fa-dollar-sign"></i>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-4">
      <div class="col-md-8">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Biểu đồ doanh thu</h5>
            <!-- Chart component -->
          </div>
        </div>
      </div>
      <div class="col-md-4">
        <div class="card">
          <div class="card-body">
            <h5 class="card-title">Đơn hàng gần đây</h5>
            <!-- Order list -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-card-icon {
  background: #4e73df;
  color: white;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stat-card h2 {
  margin: 0.5rem 0;
  font-weight: bold;
}

.stat-card p {
  color: #666;
  margin: 0;
}

.text-success {
  color: #1cc88a !important;
}
</style>

<script>
export default {
  name: 'Dashboard'
}
</script>
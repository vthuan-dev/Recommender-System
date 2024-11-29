<template>
  <div class="dashboard">
    <div class="row g-4 mb-4">
      <div class="col-md-3">
        <div class="stat-card">
          <div class="stat-card-info">
            <h6>Tổng đơn hàng</h6>
            <h2>{{ stats.orderStats.totalOrders || 0 }}</h2>
            <div class="order-details">
              <p>Chờ xử lý: {{ stats.orderStats.pendingOrders || 0 }}</p>
              <p>Đang xử lý: {{ stats.orderStats.processingOrders || 0 }}</p>
              <p>Hoàn thành: {{ stats.orderStats.completedOrders || 0 }}</p>
              <p>Đã hủy: {{ stats.orderStats.cancelledOrders || 0 }}</p>
            </div>
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
            <h2>{{ formatCurrency(stats.orderStats.totalRevenue || 0) }}</h2>
            <p class="mb-0">30 ngày qua</p>
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
            <LineChart 
              v-if="showChart"
              :data="revenueChartData"
              :options="chartOptions"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Line as LineChart } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default {
  name: 'Dashboard',
  components: { LineChart },
  data() {
    return {
      stats: {
        orderStats: {},
        dailyRevenue: [],
        monthlyRevenue: []
      },
      showChart: false,
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return 'Doanh thu: ' + new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND'
                }).format(context.raw);
              }
            }
          }
        }
      }
    };
  },
  computed: {
    revenueChartData() {
      return {
        labels: this.stats.dailyRevenue.map(item => {
          const date = new Date(item.date);
          return date.toLocaleDateString('vi-VN');
        }),
        datasets: [{
          label: 'Doanh thu',
          data: this.stats.dailyRevenue.map(item => item.revenue),
          borderColor: '#4e73df',
          tension: 0.4
        }]
      };
    }
  },
  methods: {
    formatCurrency(value) {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(value);
    },
    async fetchDashboardStats() {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          throw new Error('No authentication token found');
        }

        console.log('Fetching stats...'); // Debug log

        const response = await fetch('/api/admin/dashboard/stats', { // Updated URL
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token.trim()}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        console.log('Response status:', response.status); // Debug log

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText); // Debug log
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('API response:', result); // Debug log

        if (result.success) {
          this.stats = result.data;
          this.showChart = true;
        } else {
          throw new Error(result.message || 'Failed to fetch dashboard stats');
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        this.$emit('show-error', `Không thể tải dữ liệu thống kê: ${error.message}`);
      }
    }
  },
  mounted() {
    this.fetchDashboardStats();
  }
};
</script>

<style scoped>
.stat-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: start;
  height: 100%;
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

.order-details {
  margin-top: 0.5rem;
  font-size: 0.875rem;
}

.order-details p {
  margin: 0.25rem 0;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0,0,0,0.1);
}

.card-body {
  padding: 1.5rem;
}

.card-title {
  margin-bottom: 1.5rem;
  font-weight: 600;
}
</style>
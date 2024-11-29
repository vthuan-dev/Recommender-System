<template>
  <div class="dashboard">
    <!-- Thống kê tổng quan -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon orders">
          <i class="fas fa-shopping-cart"></i>
        </div>
        <div class="stat-info">
          <h3>Tổng đơn hàng</h3>
          <p class="stat-value">{{ stats.orderStats.totalOrders }}</p>
          <div class="stat-detail">
            <span class="pending">Chờ xử lý: {{ stats.orderStats.pendingOrders }}</span>
            <span class="processing">Đang xử lý: {{ stats.orderStats.processingOrders }}</span>
          </div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon revenue">
          <i class="fas fa-dollar-sign"></i>
        </div>
        <div class="stat-info">
          <h3>Doanh thu</h3>
          <p class="stat-value">{{ formatCurrency(stats.orderStats.totalRevenue) }}</p>
          <p class="stat-period">30 ngày qua</p>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon products">
          <i class="fas fa-box"></i>
        </div>
        <div class="stat-info">
          <h3>Sản phẩm</h3>
          <p class="stat-value">{{ stats.productStats.totalProducts }}</p>
          <div class="stat-detail">
            <span class="warning">Hết hàng: {{ stats.productStats.outOfStockProducts }}</span>
            <span class="alert">Sắp hết: {{ stats.productStats.lowStockProducts }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Biểu đồ doanh thu -->
    <div class="chart-section">
      <h2>Biểu đồ doanh thu</h2>
      <LineChart 
        v-if="showChart"
        :data="revenueChartData"
        :options="chartOptions"
        :height="300"
      />
    </div>

    <!-- Top sản phẩm -->
    <div class="top-products">
      <h2>Top sản phẩm bán chạy</h2>
      <div class="products-grid">
        <div v-for="product in stats.topProducts" 
             :key="product.id" 
             class="product-card">
          <img :src="product.image_url" :alt="product.name">
          <div class="product-info">
            <h4>{{ product.name }}</h4>
            <p>Đã bán: {{ product.total_sold }}</p>
            <p>Doanh thu: {{ formatCurrency(product.revenue) }}</p>
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
  components: {
    LineChart
  },
  data() {
    return {
      showChart: false,
      stats: {
        orderStats: {
          totalOrders: 0,
          pendingOrders: 0,
          processingOrders: 0,
          completedOrders: 0,
          cancelledOrders: 0,
          totalRevenue: 0
        },
        productStats: {
          totalProducts: 0,
          outOfStockProducts: 0,
          lowStockProducts: 0
        },
        topProducts: [],
        revenueChart: []
      },
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Biểu đồ doanh thu 30 ngày gần nhất'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };
  },
  computed: {
    revenueChartData() {
      return {
        labels: this.stats.revenueChart.map(item => item.date) || [],
        datasets: [
          {
            label: 'Doanh thu (VNĐ)',
            data: this.stats.revenueChart.map(item => item.revenue) || [],
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.2)',
            tension: 0.4,
            fill: true
          },
          {
            label: 'Số đơn hàng',
            data: this.stats.revenueChart.map(item => item.total_orders) || [],
            borderColor: '#2ecc71',
            backgroundColor: 'rgba(46, 204, 113, 0.2)',
            tension: 0.4,
            fill: true
          }
        ]
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
        const response = await fetch('/api/admin/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          }
        });
        const data = await response.json();
        if (data.success) {
          this.stats = data.data;
          this.showChart = true; // Chỉ hiển thị chart sau khi có data
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    }
  },
  mounted() {
    this.fetchDashboardStats();
  },
  beforeUnmount() {
    this.showChart = false;
  }
};
</script>

<style scoped>
.dashboard {
  padding: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.stat-icon.orders { background: rgba(52, 152, 219, 0.1); color: #3498db; }
.stat-icon.revenue { background: rgba(46, 204, 113, 0.1); color: #2ecc71; }
.stat-icon.products { background: rgba(155, 89, 182, 0.1); color: #9b59b6; }

.stat-info h3 {
  margin: 0;
  font-size: 1rem;
  color: #718096;
}

.stat-value {
  margin: 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #2d3748;
}

.stat-detail {
  display: flex;
  gap: 1rem;
  font-size: 0.875rem;
}

.chart-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chart-section h2 {
  margin: 0 0 1.5rem;
  font-size: 1.25rem;
  color: #2d3748;
}

.top-products {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.top-products h2 {
  margin: 0 0 1.5rem;
  font-size: 1.25rem;
  color: #2d3748;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.product-card {
  background: #f8fafc;
  border-radius: 8px;
  overflow: hidden;
}

.product-card img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.product-info {
  padding: 1rem;
}

.product-info h4 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  color: #2d3748;
}

.product-info p {
  margin: 0.25rem 0;
  font-size: 0.875rem;
  color: #718096;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}
</style> 
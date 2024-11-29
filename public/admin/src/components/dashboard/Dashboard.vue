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
            <span class="completed">Hoàn thành: {{ stats.orderStats.completedOrders }}</span>
            <span class="cancelled">Đã hủy: {{ stats.orderStats.cancelledOrders }}</span>
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
      <div class="chart-container">
        <LineChart 
          v-if="showChart"
          :data="revenueChartData"
          :options="chartOptions"
          :height="200"
        />
      </div>
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
  components: { LineChart },
  data() {
    return {
      stats: {
        orderStats: {
          totalOrders: 0,
          pendingOrders: 0,
          processingOrders: 0,
          completedOrders: 0,
          cancelledOrders: 0,
          totalRevenue: 0
        },
        dailyRevenue: [],
        monthlyRevenue: [],
        productStats: {},
        topProducts: [],
        revenueChart: []
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
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                  notation: 'compact',
                  maximumFractionDigits: 1
                }).format(value);
              },
              font: {
                size: 10
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 10
              },
              maxRotation: 45,
              minRotation: 45,
              autoSkip: true,
              maxTicksLimit: 10
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
          borderColor: '#4F46E5',
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

        const response = await fetch('/api/dashboard/stats', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token.trim()}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
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
.dashboard {
  padding: 1.5rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  font-size: 1.25rem;
}

.stat-icon.orders { background: rgba(52, 152, 219, 0.1); color: #3498db; }
.stat-icon.revenue { background: rgba(46, 204, 113, 0.1); color: #2ecc71; }
.stat-icon.products { background: rgba(155, 89, 182, 0.1); color: #9b59b6; }

.stat-info h3 {
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
}

.stat-value {
  margin: 0.25rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
}

.stat-detail {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.75rem;
}

.stat-detail span {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: #f1f5f9;
}

.pending { color: #eab308; }
.processing { color: #3b82f6; }
.warning { color: #ef4444; }
.alert { color: #f97316; }
.completed { color: #10b981; }
.cancelled { color: #ef4444; }

.stat-period {
  font-size: 0.75rem;
  color: #94a3b8;
  margin: 0;
}

.chart-section {
  background: white;
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  max-width: 100%;
}

.chart-container {
  position: relative;
  height: 300px;
  width: 100%;
  margin: 0 auto;
}

.chart-section h2 {
  margin: 0 0 1rem;
  font-size: 1rem;
  color: #2d3748;
  font-weight: 500;
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
  .dashboard {
    padding: 1rem;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
  
  .stat-card {
    padding: 1rem;
  }
  
  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
  
  .chart-section {
    padding: 1rem;
    margin-bottom: 1rem;
  }
  
  .chart-section h2 {
    font-size: 0.875rem;
  }
}
</style> 
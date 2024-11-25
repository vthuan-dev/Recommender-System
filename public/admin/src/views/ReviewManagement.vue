<template>
    <div class="review-management">
      <div class="page-header">
        <h2>Quản lý đánh giá sản phẩm</h2>
        <button @click="refreshData" class="btn btn-refresh">
          <i class="fas fa-sync-alt"></i>
          Làm mới
        </button>
      </div>
  
      <!-- Thống kê -->
      <div class="stats-cards" v-if="stats">
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-star"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalReviews }}</div>
            <div class="stat-label">Tổng đánh giá</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-star-half-alt"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.averageRating }} ⭐</div>
            <div class="stat-label">Điểm trung bình</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">
            <i class="fas fa-check-circle"></i>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.verifiedCount }}</div>
            <div class="stat-label">Đã xác minh</div>
          </div>
        </div>
      </div>
  
      <!-- Bộ lọc -->
      <div class="filters">
        <select v-model="filters.status" @change="loadReviews">
          <option value="all">Tất cả trạng thái</option>
          <option value="verified">Đã xác minh</option>
          <option value="unverified">Chưa xác minh</option>
        </select>
  
        <select v-model="filters.rating" @change="loadReviews">
          <option value="">Tất cả sao</option>
          <option v-for="n in 5" :key="n" :value="n">{{ n }} sao</option>
        </select>
      </div>
  
      <!-- Danh sách đánh giá -->
      <div class="reviews-list">
        <div v-for="review in reviews" :key="review.id" class="review-card">
          <div class="review-header">
            <img :src="review.product_image || '/placeholder.png'" :alt="review.product_name" class="product-image">
            <div class="review-info">
              <h5>{{ review.product_name }}</h5>
              <small>{{ review.brand_name }}</small>
              <div class="rating">
                <i v-for="n in 5" :key="n" 
                   class="fas fa-star"
                   :class="{ active: n <= review.rating }"></i>
              </div>
            </div>
            <div class="review-status">
              <span :class="{ verified: review.is_verified }">
                {{ review.is_verified ? 'Đã xác minh' : 'Chưa xác minh' }}
              </span>
            </div>
          </div>
  
          <div class="review-content">
            <p>{{ review.comment }}</p>
            <div class="review-meta">
              <div class="customer-info">
                <span>{{ review.customer_name }}</span>
                <small>{{ review.customer_email }}</small>
              </div>
              <span>{{ formatDate(review.created_at) }}</span>
            </div>
          </div>
  
          <div class="review-actions">
            <button @click="toggleVerify(review)" 
                    :class="{ verified: review.is_verified }"
                    class="btn">
              <i class="fas" :class="review.is_verified ? 'fa-check-circle' : 'fa-circle'"></i>
              {{ review.is_verified ? 'Bỏ xác minh' : 'Xác minh' }}
            </button>
            <button @click="deleteReview(review.id)" class="btn btn-danger">
              <i class="fas fa-trash"></i>
              Xóa
            </button>
          </div>
  
          <!-- Phần trả lời của admin -->
          <div class="admin-reply-section mt-3">
            <div v-if="review.admin_reply" class="existing-reply p-3 bg-light rounded">
              <div class="reply-header d-flex align-items-center mb-2">
                <img :src="review.admin_reply.admin_avatar || '/admin-avatar.png'" 
                     class="admin-avatar rounded-circle me-2" 
                     alt="Admin Avatar">
                <div>
                  <strong>{{ review.admin_reply.admin_name }}</strong>
                  <small class="text-muted d-block">
                    {{ formatDate(review.admin_reply.created_at) }}
                  </small>
                </div>
              </div>
              <p class="reply-content mb-0">{{ review.admin_reply.content }}</p>
            </div>
            
            <div v-else class="reply-form">
              <div class="input-group">
                <textarea 
                  v-model="review.replyContent" 
                  class="form-control"
                  placeholder="Nhập câu trả lời của bạn..."
                  rows="2">
                </textarea>
                <button 
                  class="btn btn-primary"
                  @click="submitReply(review)"
                  :disabled="!review.replyContent?.trim()">
                  <i class="fas fa-paper-plane me-1"></i>
                  Trả lời
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Phân trang -->
      <div class="pagination">
        <button 
          :disabled="currentPage === 1"
          @click="changePage(currentPage - 1)"
          class="btn">
          <i class="fas fa-chevron-left"></i>
        </button>
        <span>Trang {{ currentPage }} / {{ totalPages }}</span>
        <button 
          :disabled="currentPage === totalPages"
          @click="changePage(currentPage + 1)"
          class="btn">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
  
      <!-- Thêm nút refresh -->
      <div class="header-actions">
        <button @click="refreshData" class="btn btn-refresh">
          <i class="fas fa-sync-alt"></i>
          Làm mới
        </button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import Swal from 'sweetalert2';
  import api from '@/utils/api';
  import { useToast } from '@/composables/useToast';
  
  const toast = useToast();
  
  const reviews = ref([]);
  const stats = ref({
    totalReviews: 0,
    averageRating: 0,
    verifiedCount: 0,
    ratingDistribution: {
      5: 0, 4: 0, 3: 0, 2: 0, 1: 0
    }
  });
  const currentPage = ref(1);
  const totalPages = ref(1);
  const filters = ref({
    status: 'all',
    rating: ''
  });
  
  // Load đánh giá
  const loadReviews = async () => {
    try {
      const response = await api.get('/admin/reviews', {
        params: {
          page: currentPage.value,
          ...filters.value
        }
      });
      reviews.value = response.data.reviews;
      totalPages.value = response.data.totalPages;
    } catch (error) {
      console.error('Load reviews error:', error);
      toast.error('Lỗi khi tải danh sách đánh giá: ' + (error.response?.data?.message || error.message));
    }
  };
  
  // Load thống kê
  const loadStats = async () => {
    try {
      const response = await api.get('/admin/reviews/stats');
      stats.value = response.data.stats;
    } catch (error) {
      console.error('Load stats error:', error);
      toast.error('Lỗi khi tải thống kê: ' + (error.response?.data?.message || error.message));
    }
  };
  
  // Xác minh/Bỏ xác minh
  const toggleVerify = async (review) => {
    try {
      await api.put(`/admin/reviews/${review.id}/verify`, {
        isVerified: !review.is_verified
      });
      review.is_verified = !review.is_verified;
      toast.success(`Đã ${review.is_verified ? 'xác minh' : 'bỏ xác minh'} đánh giá`);
      loadStats();
    } catch (error) {
      toast.error('Lỗi khi cập nhật trạng thái xác minh');
    }
  };
  
  // Xóa đánh giá
  const deleteReview = async (id) => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa?',
      text: "Bạn không thể hoàn tác sau khi xóa!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/admin/reviews/${id}`);
        reviews.value = reviews.value.filter(r => r.id !== id);
        toast.success('Đã xóa đánh giá');
        loadStats();
      } catch (error) {
        toast.error('Lỗi khi xóa đánh giá');
      }
    }
  };
  
  // Đổi trang
  const changePage = (page) => {
    currentPage.value = page;
    loadReviews();
  };
  
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Thêm hàm refresh
  const refreshData = async () => {
    await Promise.all([loadReviews(), loadStats()]);
    toast.success('Đã cập nhật dữ liệu');
  };
  
  // Thêm method để gửi reply
  const submitReply = async (review) => {
    try {
      const response = await api.post(`/admin/reviews/${review.id}/reply`, {
        content: review.replyContent
      });
      
      // Cập nhật UI
      review.admin_reply = response.data.reply;
      review.replyContent = '';
      
      toast.success('Đã trả lời đánh giá thành công');
    } catch (error) {
      console.error('Error submitting reply:', error);
      toast.error('Lỗi khi gửi trả lời: ' + (error.response?.data?.message || error.message));
    }
  };
  
  onMounted(() => {
    loadReviews();
    loadStats();
  });
  </script>
  
  <style scoped>
  .review-management {
    padding: 2rem;
  }
  
  .stats-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }
  
  .stat-card {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    text-align: center;
  }
  
  .stat-value {
    font-size: 2rem;
    font-weight: bold;
    color: #2563eb;
  }
  
  .stat-label {
    color: #6b7280;
    margin-top: 0.5rem;
  }
  
  .filters {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
  }
  
  .filters select {
    padding: 0.5rem;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
  }
  
  .review-card {
    background: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin-bottom: 1rem;
  }
  
  .review-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .product-image {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 4px;
  }
  
  .rating .fa-star {
    color: #d1d5db;
  }
  
  .rating .fa-star.active {
    color: #fbbf24;
  }
  
  .review-status span {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    background: #f3f4f6;
  }
  
  .review-status span.verified {
    background: #dcfce7;
    color: #166534;
  }
  
  .review-content {
    margin: 1rem 0;
  }
  
  .review-meta {
    display: flex;
    justify-content: space-between;
    color: #6b7280;
    font-size: 0.875rem;
  }
  
  .review-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }
  
  .btn {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .btn.verified {
    background: #dcfce7;
    color: #166534;
  }
  
  .btn-danger {
    background: #fee2e2;
    color: #991b1b;
  }
  
  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1rem;
    margin-top: 2rem;
  }
  
  .header-actions {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 1rem;
  }
  
  .btn-refresh {
    background: #3b82f6;
    color: white;
    transition: all 0.3s ease;
  }
  
  .btn-refresh:hover {
    background: #2563eb;
    transform: scale(1.05);
  }
  
  .btn-refresh i {
    margin-right: 0.5rem;
  }
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  .customer-info {
    display: flex;
    flex-direction: column;
  }
  
  .customer-info small {
    color: #6b7280;
    font-size: 0.875rem;
  }
  
  .stat-icon {
    font-size: 2rem;
    color: #3b82f6;
    margin-right: 1rem;
  }
  
  .admin-reply-section {
    border-top: 1px solid #e5e7eb;
    margin-top: 1rem;
    padding-top: 1rem;
  }
  
  .admin-avatar {
    width: 32px;
    height: 32px;
    object-fit: cover;
  }
  
  .existing-reply {
    background-color: #f8f9fa;
    border-left: 3px solid #0d6efd;
  }
  
  .reply-form .input-group {
    gap: 0.5rem;
  }
  
  .reply-form textarea {
    border-radius: 0.5rem;
    resize: none;
  }
  
  .reply-form button {
    align-self: flex-start;
  }
  
  @media (max-width: 768px) {
    .reply-form .input-group {
      flex-direction: column;
    }
    
    .reply-form button {
      width: 100%;
      margin-top: 0.5rem;
    }
  }
  </style>
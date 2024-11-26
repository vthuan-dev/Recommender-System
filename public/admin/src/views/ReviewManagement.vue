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
  
          <!-- Phần đối thoại -->
          <div class="conversation-section mt-3">
            <h6 class="conversation-title">
              <i class="fas fa-comments me-2"></i>
              Đối thoại
            </h6>

            <!-- Danh sách replies -->
            <div class="replies-list">
              <div v-for="reply in review.replies" 
                   :key="reply.id" 
                   :class="['reply-item', reply.user.is_admin ? 'admin-reply' : 'customer-reply']">
                <div class="reply-header d-flex align-items-center mb-2">
                  <img :src="reply.user.avatar_url || '/default-avatar.png'" 
                       class="reply-avatar rounded-circle me-2" 
                       :alt="reply.user.name">
                  <div>
                    <strong :class="reply.user.is_admin ? 'text-primary' : ''">
                      {{ reply.user.name }}
                      <i v-if="reply.user.is_admin" class="fas fa-shield-alt ms-1"></i>
                    </strong>
                    <small class="text-muted d-block">
                      {{ formatDate(reply.created_at) }}
                    </small>
                  </div>
                </div>
                <div class="reply-content">
                  {{ reply.content }}
                </div>
              </div>
            </div>

            <!-- Form thêm reply mới -->
            <div class="reply-form mt-3">
              <div class="input-group">
                <textarea 
                  v-model="review.newReplyContent" 
                  class="form-control"
                  placeholder="Thêm phản hồi của bạn..."
                  rows="2">
                </textarea>
                <button 
                  class="btn btn-primary"
                  @click="submitReply(review)"
                  :disabled="!review.newReplyContent?.trim()">
                  <i class="fas fa-paper-plane me-1"></i>
                  Gửi
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
  import { formatDate } from '../utils/formatDate';
  
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
          limit: 10,
          status: filters.value.status,
          rating: filters.value.rating || undefined
        }
      });
      
      if (response.data) {
        reviews.value = response.data.reviews.map(review => ({
          ...review,
          replies: [],
          newReplyContent: ''
        }));
        totalPages.value = response.data.pagination.totalPages;
      }
    } catch (error) {
      console.error('Load reviews error:', error);
      const errorMessage = error.response?.data?.message || error.message;
      toast.error('Lỗi khi tải danh sách đánh giá: ' + errorMessage);
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
  
  // Load replies
  const loadReplies = async (review) => {
    try {
      const response = await api.get(`/admin/reviews/${review.id}/replies`);
      review.replies = response.data.replies;
    } catch (error) {
      console.error('Error loading replies:', error);
      toast.error('Lỗi khi tải phản hồi');
    }
  };
  
  // Submit reply
  const submitReply = async (review) => {
    try {
      const response = await api.post(`/admin/reviews/${review.id}/replies`, {
        content: review.newReplyContent
      });
      
      review.replies.push(response.data.reply);
      review.newReplyContent = '';
      
      toast.success('Đã gửi phản hồi thành công');
    } catch (error) {
      console.error('Error submitting reply:', error);
      toast.error('Lỗi khi gửi phản hồi: ' + (error.response?.data?.message || error.message));
    }
  };
  
  // Đổi trang
  const changePage = (page) => {
    currentPage.value = page;
    loadReviews();
  };
  
  // Refresh data
  const refreshData = async () => {
    await Promise.all([loadReviews(), loadStats()]);
    reviews.value.forEach(review => {
      loadReplies(review);
    });
    toast.success('Đã cập nhật dữ liệu');
  };
  
  onMounted(() => {
    refreshData();
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
  
  .conversation-section {
    margin-top: 1.5rem;
    border-top: 1px solid #e5e7eb;
    padding-top: 1rem;
  }
  
  .conversation-title {
    color: #4b5563;
    margin-bottom: 1rem;
  }
  
  .replies-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .reply-item {
    padding: 1rem;
    border-radius: 0.5rem;
    background-color: #f9fafb;
  }
  
  .admin-reply {
    margin-left: 2rem;
    border-left: 3px solid #3b82f6;
  }
  
  .customer-reply {
    margin-right: 2rem;
    border-left: 3px solid #10b981;
  }
  
  .reply-avatar {
    width: 32px;
    height: 32px;
    object-fit: cover;
  }
  
  .reply-content {
    white-space: pre-line;
    margin-left: 40px;
  }
  
  .reply-form {
    margin-top: 1rem;
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
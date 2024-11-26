<template>
  <div class="profile-container">
    <div class="container">
      <div class="row g-4">
        <!-- Profile Card -->
        <div class="col-md-4">
          <div class="profile-card">
            <div class="avatar-section">
              <div class="avatar-container">
                <img 
                  v-if="user?.avatarUrl" 
                  :src="user.avatarUrl" 
                  class="avatar-image"
                  alt="Avatar"
                />
                <i v-else class="fas fa-user-circle default-avatar"></i>
              </div>
              <h4 class="profile-name">{{ user?.fullname || 'Người dùng' }}</h4>
              <p class="profile-email">{{ user?.email }}</p>
            </div>
          </div>
        </div>

        <!-- Form Sections -->
        <div class="col-md-8">
          <!-- Personal Info -->
          <div class="form-section">
            <h5 class="section-title">
              <i class="fas fa-user"></i>
              Thông tin cá nhân
            </h5>
            <form @submit.prevent="updateProfile">
              <div class="mb-3">
                <label class="form-label">Họ tên</label>
                <input type="text" class="form-control" v-model="profile.fullname">
              </div>
              <div class="mb-3">
                <label class="form-label">Email</label>
                <input type="email" class="form-control" v-model="profile.email" disabled>
              </div>
              <div class="mb-3">
                <label class="form-label">Số điện thoại</label>
                <input type="tel" class="form-control" v-model="profile.phonenumber">
              </div>
              <button type="submit" class="update-btn" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                Cập nhật thông tin
              </button>
            </form>
          </div>

          <!-- Addresses -->
          <div class="address-section">
            <div class="address-header">
              <h5 class="section-title mb-0">
                <i class="fas fa-map-marker-alt"></i>
                Địa chỉ của tôi
              </h5>
              <button class="add-address-btn" @click="showAddAddressModal">
                <i class="fas fa-plus"></i>
                Thêm địa chỉ
              </button>
            </div>
            
            <div v-if="addresses.length === 0" class="text-center py-4">
              <i class="fas fa-map-marked-alt fa-3x text-muted mb-3"></i>
              <p class="text-muted">Bạn chưa có địa chỉ nào</p>
            </div>
            
            <div v-else class="address-list">
              <div v-for="address in addresses" :key="address.id" class="address-item">
                <div class="d-flex justify-content-between">
                  <div class="address-content">
                    <p class="fw-500">{{ address.address_line1 }}</p>
                    <p v-if="address.address_line2">{{ address.address_line2 }}</p>
                    <p>{{ address.city }}, {{ address.state }}</p>
                    <p>{{ address.postal_code }}, {{ address.country }}</p>
                    <span v-if="address.is_default" class="default-badge">Mặc định</span>
                  </div>
                  <div class="address-actions">
                    <button class="action-btn edit-btn" @click="editAddress(address)">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" @click="deleteAddress(address.id)">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import CustomSweetAlert from '@/components/Common/CustomSweetAlert'

export default {
  name: 'ProfileView',
  setup() {
    const store = useStore()
    const loading = ref(false)
    const addresses = ref([])
    
    const user = computed(() => store.state.auth.user)
    
    const profile = ref({
      fullname: user.value?.fullname || '',
      email: user.value?.email || '',
      phonenumber: user.value?.phonenumber || ''
    })

    const fetchAddresses = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/addresses`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        const data = await response.json()
        addresses.value = data
      } catch (error) {
        console.error('Error fetching addresses:', error)
      }
    }

    const updateProfile = async () => {
      try {
        loading.value = true
        const response = await fetch(`http://localhost:3000/api/users/${user.value.userId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(profile.value)
        })

        if (!response.ok) throw new Error('Cập nhật thất bại')

        const updatedUser = await response.json()
        store.commit('setUser', {
          ...user.value,
          ...updatedUser
        })

        await CustomSweetAlert.success('Thành công', 'Cập nhật thông tin thành công')
      } catch (error) {
        CustomSweetAlert.error('Lỗi', error.message)
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      fetchAddresses()
    })

    return {
      user,
      profile,
      loading,
      addresses,
      updateProfile
    }
  }
}
</script>

<style scoped>
/* Container styling */
.profile-container {
  padding: 40px 0;
  background: linear-gradient(to bottom, #f8fafc, #f1f5f9);
  min-height: calc(100vh - 64px);
}

/* Profile Card */
.profile-card {
  background: white;
  border-radius: 20px;
  border: none;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: transform 0.3s ease;
}

.profile-card:hover {
  transform: translateY(-5px);
}

/* Avatar Section */
.avatar-section {
  position: relative;
  padding: 40px 20px;
  background: linear-gradient(135deg, #1a73e8, #289fff);
  text-align: center;
}

.avatar-container {
  position: relative;
  width: 150px;
  height: 150px;
  margin: 0 auto 20px;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 4px solid white;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  object-fit: cover;
  background: white;
}

.default-avatar {
  font-size: 80px;
  color: white;
}

.profile-name {
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 10px 0 5px;
}

.profile-email {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.95rem;
}

/* Form Section */
.form-section {
  background: white;
  border-radius: 20px;
  padding: 30px;
  margin-bottom: 30px;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 25px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title i {
  color: #1a73e8;
}

/* Form Controls */
.form-control {
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 0.95rem;
  transition: all 0.3s ease;
}

.form-control:focus {
  border-color: #1a73e8;
  box-shadow: 0 0 0 4px rgba(26, 115, 232, 0.1);
}

.form-label {
  font-weight: 500;
  color: #64748b;
  margin-bottom: 8px;
}

/* Update Button */
.update-btn {
  background: linear-gradient(135deg, #1a73e8, #289fff);
  border: none;
  padding: 12px 30px;
  border-radius: 12px;
  color: white;
  font-weight: 600;
  transition: all 0.3s ease;
}

.update-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 115, 232, 0.2);
}

.update-btn:disabled {
  background: linear-gradient(135deg, #94a3b8, #64748b);
}

/* Address Section */
.address-section {
  background: white;
  border-radius: 20px;
  padding: 30px;
}

.address-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.add-address-btn {
  background: linear-gradient(135deg, #1a73e8, #289fff);
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.add-address-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 115, 232, 0.2);
}

/* Address Items */
.address-item {
  background: #f8fafc;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 15px;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.address-item:hover {
  border-color: #1a73e8;
  transform: translateX(5px);
}

.address-content p {
  margin-bottom: 5px;
  color: #1e293b;
}

.default-badge {
  background: linear-gradient(135deg, #1a73e8, #289fff);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
}

.address-actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid;
  transition: all 0.3s ease;
}

.edit-btn {
  border-color: #1a73e8;
  color: #1a73e8;
}

.edit-btn:hover {
  background: #1a73e8;
  color: white;
}

.delete-btn {
  border-color: #ef4444;
  color: #ef4444;
}

.delete-btn:hover {
  background: #ef4444;
  color: white;
}

/* Responsive Design */
@media (max-width: 768px) {
  .profile-container {
    padding: 20px;
  }
  
  .avatar-section {
    padding: 30px 15px;
  }
  
  .avatar-container {
    width: 120px;
    height: 120px;
  }
  
  .form-section,
  .address-section {
    padding: 20px;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .profile-container {
    background: linear-gradient(to bottom, #0f172a, #1e293b);
  }
  
  .profile-card,
  .form-section,
  .address-section {
    background: #1e293b;
  }
  
  .section-title {
    color: #f1f5f9;
  }
  
  .form-control {
    background: #0f172a;
    border-color: #334155;
    color: #f1f5f9;
  }
  
  .form-label {
    color: #94a3b8;
  }
  
  .address-item {
    background: #0f172a;
    border-color: #334155;
  }
  
  .address-content p {
    color: #e2e8f0;
  }
}
</style>
<template>
  <div class="container py-5">
    <div class="row">
      <div class="col-md-4">
        <div class="card">
          <div class="card-body text-center">
            <img 
              v-if="user?.avatarUrl" 
              :src="user.avatarUrl" 
              class="rounded-circle mb-3"
              alt="Avatar"
              style="width: 150px; height: 150px; object-fit: cover;"
            />
            <i v-else class="fas fa-user-circle fa-5x mb-3 text-primary"></i>
            <h5 class="card-title">{{ user?.fullname || 'Người dùng' }}</h5>
            <p class="card-text">{{ user?.email }}</p>
          </div>
        </div>
      </div>

      <div class="col-md-8">
        <div class="card mb-4">
          <div class="card-body">
            <h5 class="card-title">Thông tin cá nhân</h5>
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
              <button type="submit" class="btn btn-primary" :disabled="loading">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                Cập nhật
              </button>
            </form>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="card-title mb-0">Địa chỉ của tôi</h5>
              <button class="btn btn-sm btn-primary" @click="showAddAddressModal">
                <i class="fas fa-plus me-2"></i>Thêm địa chỉ
              </button>
            </div>
            
            <div v-if="addresses.length === 0" class="text-center py-3">
              <p class="text-muted">Bạn chưa có địa chỉ nào</p>
            </div>
            
            <div v-else class="address-list">
              <div v-for="address in addresses" :key="address.id" class="address-item p-3 border rounded mb-3">
                <div class="d-flex justify-content-between">
                  <div>
                    <p class="mb-1">
                      {{ address.address_line1 }}
                      {{ address.address_line2 ? `, ${address.address_line2}` : '' }}
                    </p>
                    <p class="mb-1">{{ address.city }}, {{ address.state }}</p>
                    <p class="mb-1">{{ address.postal_code }}, {{ address.country }}</p>
                    <span v-if="address.is_default" class="badge bg-primary">Mặc định</span>
                  </div>
                  <div>
                    <button class="btn btn-sm btn-outline-primary me-2" @click="editAddress(address)">
                      <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" @click="deleteAddress(address.id)">
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
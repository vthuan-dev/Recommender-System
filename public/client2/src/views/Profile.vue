<template>
    <div class="container py-5">
      <div class="row">
        <div class="col-md-4">
          <div class="card">
            <div class="card-body text-center">
              <i class="fas fa-user-circle fa-5x mb-3 text-primary"></i>
              <h5 class="card-title">{{ user?.name || 'Người dùng' }}</h5>
              <p class="card-text">{{ user?.email }}</p>
            </div>
          </div>
        </div>
        <div class="col-md-8">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">Thông tin cá nhân</h5>
              <form @submit.prevent="updateProfile">
                <div class="mb-3">
                  <label class="form-label">Họ tên</label>
                  <input type="text" class="form-control" v-model="profile.name">
                </div>
                <div class="mb-3">
                  <label class="form-label">Số điện thoại</label>
                  <input type="tel" class="form-control" v-model="profile.phone">
                </div>
                <div class="mb-3">
                  <label class="form-label">Địa chỉ</label>
                  <textarea class="form-control" v-model="profile.address"></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Cập nhật</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { ref, computed } from 'vue'
  import { useStore } from 'vuex'
  
  export default {
    name: 'ProfileView',
    setup() {
      const store = useStore()
      const user = computed(() => store.state.user)
      const profile = ref({
        name: user.value?.name || '',
        phone: user.value?.phone || '',
        address: user.value?.address || ''
      })
  
      const updateProfile = () => {
        // Implement update profile logic
        console.log('Update profile:', profile.value)
      }
  
      return {
        user,
        profile,
        updateProfile
      }
    }
  }
  </script>
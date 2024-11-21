<template>
    <div class="users-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Quản lý người dùng</h1>
          <p>Quản lý tài khoản và phân quyền người dùng</p>
        </div>
        <div class="header-actions">
          <button class="btn-primary" @click="openRoleModal">
            <i class="fas fa-user-shield"></i>
            Quản lý vai trò
          </button>
        </div>
      </div>
  
      <!-- Filter Bar -->
      <div class="filter-bar">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input 
            v-model="searchQuery"
            placeholder="Tìm kiếm người dùng..."
            @input="handleSearch"
          >
        </div>
        
        <div class="filter-actions">
          <div class="filter-group">
            <label>Vai trò</label>
            <select v-model="roleFilter">
              <option value="">Tất cả</option>
              <option v-for="role in roles" :key="role.id" :value="role.id">
                {{ role.name }}
              </option>
            </select>
          </div>
        </div>
      </div>
  
      <!-- Users Table -->
      <div class="table-container">
        <table class="users-table">
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>
                <div class="user-info">
                  <img :src="user.avatar || '/default-avatar.png'" class="avatar">
                  <span>{{ user.fullname }}</span>
                </div>
              </td>
              <td>{{ user.email }}</td>
              <td>
                <select 
                  v-model="user.role_id"
                  @change="updateUserRole(user)"
                >
                  <option v-for="role in roles" :key="role.id" :value="role.id">
                    {{ role.name }}
                  </option>
                </select>
              </td>
              <td>
                <span :class="['status-badge', user.status]">
                  {{ user.status === 'active' ? 'Hoạt động' : 'Đã khóa' }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn-icon" @click="toggleUserStatus(user)">
                    <i :class="user.status === 'active' ? 'fas fa-ban' : 'fas fa-check'"></i>
                  </button>
                  <button class="btn-icon" @click="deleteUser(user)">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
  
      <!-- Role Management Modal -->
      <modal v-if="showRoleModal" @close="closeRoleModal">
        <template #header>
          <h3>Quản lý vai trò</h3>
        </template>
        <template #body>
          <!-- Role management content -->
        </template>
      </modal>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from 'vue'
  import Modal from '../common/Modal.vue'
  
  export default {
    components: {
      Modal
    },
    setup() {
      const users = ref([])
      const roles = ref([])
      const searchQuery = ref('')
      const roleFilter = ref('')
      const showRoleModal = ref(false)
  
      const loadData = async () => {
        try {
          const response = await fetch('/api/admin/users', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          })
          if (!response.ok) {
            throw new Error('Network response was not ok')
          }
          const data = await response.json()
          users.value = data.users
          roles.value = data.roles
        } catch (error) {
          console.error('Error:', error)
        }
      }
  
      const handleSearch = () => {
        loadData()
      }
  
      const updateUserRole = async (user) => {
        try {
          await fetch(`/api/admin/users/${user.id}/role`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ roleId: user.role_id })
          })
        } catch (error) {
          console.error('Error updating role:', error)
        }
      }
  
      const toggleUserStatus = async (user) => {
        try {
          await fetch(`/api/admin/users/${user.id}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ 
              status: user.status === 'active' ? 'inactive' : 'active' 
            })
          })
          loadData()
        } catch (error) {
          console.error('Error toggling status:', error)
        }
      }
  
      const openRoleModal = () => {
        showRoleModal.value = true
      }
  
      const closeRoleModal = () => {
        showRoleModal.value = false
      }
  
      onMounted(loadData)
  
      return {
        users,
        roles,
        searchQuery,
        roleFilter,
        showRoleModal,
        loadData,
        handleSearch,
        updateUserRole,
        toggleUserStatus,
        openRoleModal,
        closeRoleModal
      }
    }
  }
  </script>
  
  <style scoped>
  .users-page {
    padding: 2rem;
    background: #f9fafb;
    min-height: 100vh;
  }
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  .header-content h1 {
    font-size: 1.875rem;
    font-weight: 600;
    color: #111827;
    margin-bottom: 0.5rem;
  }
  
  .header-content p {
    color: #6b7280;
  }
  
  .filter-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    gap: 1rem;
  }
  
  .search-box {
    position: relative;
    flex: 1;
  }
  
  .search-box input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2.5rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
  }
  
  .search-box i {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #9ca3af;
  }
  
  .table-container {
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    overflow: hidden;
  }
  
  .users-table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .users-table th,
  .users-table td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .status-badge {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
  }
  
  .status-badge.active {
    background: #dcfce7;
    color: #166534;
  }
  
  .status-badge.inactive {
    background: #fee2e2;
    color: #991b1b;
  }
  
  .action-buttons {
    display: flex;
    gap: 0.5rem;
  }
  
  .btn-icon {
    padding: 0.5rem;
    border: none;
    border-radius: 0.375rem;
    background: #f3f4f6;
    cursor: pointer;
  }
  
  .btn-icon:hover {
    background: #e5e7eb;
  }
  
  .btn-icon.delete:hover {
    background: #fee2e2;
    color: #dc2626;
  }
  </style>
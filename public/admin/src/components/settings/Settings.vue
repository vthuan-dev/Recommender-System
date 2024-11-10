<template>
  <div class="settings-page">
    <div class="settings-header">
      <h2>Cài đặt hệ thống</h2>
      <p>Tùy chỉnh giao diện và ngôn ngữ</p>
    </div>

    <div class="settings-grid">
      <!-- Theme Settings -->
      <div class="settings-card">
        <div class="card-header">
          <i class="fas fa-palette"></i>
          <h3>{{ $t('settings.theme.title') }}</h3>
        </div>
        
        <div class="theme-options">
          <div 
            v-for="theme in themes" 
            :key="theme.id"
            :class="['theme-option', { active: currentTheme === theme.id }]"
            @click="changeTheme(theme.id)"
          >
            <div class="theme-preview" :style="{ background: theme.gradient }">
              <div class="theme-sidebar"></div>
              <div class="theme-content"></div>
            </div>
            <span>{{ $t(theme.name) }}</span>
          </div>
        </div>
      </div>

      <!-- Language Settings -->
      <div class="settings-card">
        <div class="card-header">
          <i class="fas fa-language"></i>
          <h3>{{ $t('settings.language.title') }}</h3>
        </div>

        <div class="language-options">
          <button 
            v-for="lang in languages" 
            :key="lang.code"
            :class="['lang-btn', { active: currentLang === lang.code }]"
            @click="changeLanguage(lang.code)"
          >
            <img :src="lang.flag" :alt="lang.name">
            <span>{{ lang.name }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useI18n } from 'vue-i18n'
import Swal from 'sweetalert2'

export default {
  name: 'Settings',
  setup() {
    const { currentTheme, setTheme } = useTheme()
    const { locale } = useI18n()
    
    // Định nghĩa themes
    const themes = ref([
      {
        id: 'default',
        name: 'settings.theme.default',
        gradient: 'linear-gradient(180deg, #2C3E50 0%, #3498DB 100%)'
      },
      {
        id: 'dark',
        name: 'settings.theme.dark',
        gradient: 'linear-gradient(180deg, #1a202c 0%, #2d3748 100%)'
      },
      {
        id: 'light',
        name: 'settings.theme.light',
        gradient: 'linear-gradient(180deg, #718096 0%, #3498DB 100%)'
      },
      {
        id: 'purple',
        name: 'settings.theme.purple',
        gradient: 'linear-gradient(180deg, #553C9A 0%, #B794F4 100%)'
      }
    ])

    // Định nghĩa languages
    const languages = ref([
      {
        code: 'vi',
        name: 'Tiếng Việt',
        flag: 'https://cdn.jsdelivr.net/npm/country-flag-emoji-json@2.0.0/dist/images/VN.svg'
      },
      {
        code: 'en',
        name: 'English',
        flag: 'https://cdn.jsdelivr.net/npm/country-flag-emoji-json@2.0.0/dist/images/US.svg'
      }
    ])

    const currentLang = ref(localStorage.getItem('lang') || 'vi')

    const changeTheme = async (themeId) => {
      try {
        await setTheme(themeId)
        // Cập nhật CSS variables
        document.documentElement.setAttribute('data-theme', themeId)
        localStorage.setItem('theme', themeId)

        await Swal.fire({
          icon: 'success',
          title: 'Thành công!',
          text: 'Đã thay đổi giao diện',
          timer: 1500,
          showConfirmButton: false,
          customClass: {
            popup: 'custom-swal-popup',
            title: 'custom-swal-title',
            icon: 'custom-swal-icon',
            content: 'custom-swal-content'
          }
        })
      } catch (error) {
        console.error('Change theme error:', error)
        await Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: 'Không thể thay đổi giao diện',
          customClass: {
            popup: 'custom-swal-popup',
            title: 'custom-swal-title',
            icon: 'custom-swal-icon',
            content: 'custom-swal-content',
            confirmButton: 'custom-swal-confirm-button'
          }
        })
      }
    }

    return {
      currentTheme,
      themes,
      languages,
      currentLang,
      changeTheme,
      changeLanguage: locale
    }
  }
}
</script>

<style scoped>
.settings-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.settings-header {
  margin-bottom: 2rem;
}

.settings-header h2 {
  font-size: 1.875rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.settings-header p {
  color: #718096;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.settings-card {
  background: white;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.card-header i {
  font-size: 1.5rem;
  color: #4299e1;
}

.card-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

/* Theme Options */
.theme-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.theme-option {
  cursor: pointer;
  text-align: center;
  transition: all 0.3s ease;
}

.theme-preview {
  height: 100px;
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
  display: flex;
  overflow: hidden;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.theme-option.active .theme-preview {
  border-color: #4299e1;
  box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.2);
}

.theme-sidebar {
  width: 30%;
  background: rgba(0, 0, 0, 0.1);
}

.theme-content {
  flex: 1;
  background: rgba(255, 255, 255, 0.9);
}

/* Language Options */
.language-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.lang-btn {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.lang-btn img {
  width: 24px;
  height: 24px;
  border-radius: 50%;
}

.lang-btn.active {
  border-color: #4299e1;
  background: #ebf8ff;
}

.lang-btn:hover {
  border-color: #4299e1;
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .settings-page {
    padding: 1rem;
  }
  
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>

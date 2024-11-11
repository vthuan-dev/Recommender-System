import { createI18n } from 'vue-i18n'
import vi from './locate/vi.json'
import en from './locate/en.json'

const i18n = createI18n({
  legacy: false, // Sử dụng Composition API
  locale: localStorage.getItem('lang') || 'vi', // Ngôn ngữ mặc định
  fallbackLocale: 'vi', // Ngôn ngữ dự phòng
  messages: {
    vi,
    en
  }
})

export default i18n
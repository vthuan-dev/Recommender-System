import { createI18n } from 'vue-i18n'

const messages = {
  en: {
    menu: {
      dashboard: 'Dashboard',
      products: 'Products',
      orders: 'Orders',
      customers: 'Customers',
      settings: 'Settings'
    },
    settings: {
      theme: {
        title: 'Theme',
        default: 'Default',
        dark: 'Dark',
        light: 'Light',
        purple: 'Purple',
        changed: 'Theme changed successfully',
        error: 'Failed to change theme'
      },
      language: {
        title: 'Language',
        vietnamese: 'Vietnamese',
        english: 'English',
        changed: 'Language changed successfully',
        error: 'Failed to change language'
      }
    }
  },
  vi: {
    menu: {
      dashboard: 'Tổng quan',
      products: 'Sản phẩm',
      orders: 'Đơn hàng',
      customers: 'Khách hàng',
      settings: 'Cài đặt'
    },
    settings: {
      theme: {
        title: 'Giao diện',
        default: 'Mặc định',
        dark: 'Tối',
        light: 'Sáng',
        purple: 'Tím',
        changed: 'Đã thay đổi giao diện',
        error: 'Lỗi khi thay đổi giao diện'
      },
      language: {
        title: 'Ngôn ngữ',
        vietnamese: 'Tiếng Việt',
        english: 'Tiếng Anh',
        changed: 'Đã thay đổi ngôn ngữ',
        error: 'Lỗi khi thay đổi ngôn ngữ'
      }
    }
  }
}

export default createI18n({
  legacy: false,
  locale: localStorage.getItem('lang') || 'vi',
  fallbackLocale: 'vi',
  messages
})
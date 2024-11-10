import { ref } from 'vue'

export function useTheme() {
  const currentTheme = ref(localStorage.getItem('theme') || 'default')

  const setTheme = (theme) => {
    currentTheme.value = theme
    localStorage.setItem('theme', theme)
    document.documentElement.setAttribute('data-theme', theme)
  }

  return {
    currentTheme,
    setTheme
  }
}
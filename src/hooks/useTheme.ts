import { useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { ThemeId } from '@/lib/themes'

export function useTheme() {
  const [themeId, setThemeId] =
    useLocalStorage<ThemeId>('lmls_theme', 'midnight')

  useEffect(() => {
    const html = document.documentElement
    html.className = html.className
      .replace(/theme-\w+/g, '')
      .trim()
    html.classList.add(`theme-${themeId}`)
  }, [themeId])

  return { themeId, setThemeId }
}
export default useTheme;

import {useCallback, useEffect, useState} from "react"

type UseThemeReturnType = {
  toggleTheme: () => void
  theme: string
}

export const THEME_KEY = "theme_mode"

const DARK_MODE = "dark"
const LIGHT_MODE = "light"
const savedTheme = localStorage.getItem(THEME_KEY)

const useTheme = (): UseThemeReturnType => {

  const [theme, setTheme] = useState(savedTheme ?? LIGHT_MODE)

  useEffect(() => {
    document.documentElement.className = theme
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme(theme === DARK_MODE ? LIGHT_MODE : DARK_MODE)
  }, [theme])

  return {toggleTheme, theme}
}

export default useTheme

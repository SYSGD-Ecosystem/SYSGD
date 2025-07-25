"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "classic" | "red" | "green" | "fire" | "ocean" | "purple" | "pink"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  isDark: boolean
  setIsDark: (isDark: boolean) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const themes = {
  classic: {
    light: {
      primary: "221.2 83.2% 53.3%",
      primaryForeground: "210 40% 98%",
      secondary: "210 40% 96%",
      secondaryForeground: "222.2 84% 4.9%",
      accent: "210 40% 96%",
      accentForeground: "222.2 84% 4.9%",
      background: "0 0% 100%",
      foreground: "222.2 84% 4.9%",
      card: "0 0% 100%",
      cardForeground: "222.2 84% 4.9%",
      popover: "0 0% 100%",
      popoverForeground: "222.2 84% 4.9%",
      muted: "210 40% 96%",
      mutedForeground: "215.4 16.3% 46.9%",
      destructive: "0 84.2% 60.2%",
      destructiveForeground: "210 40% 98%",
      border: "214.3 31.8% 91.4%",
      input: "214.3 31.8% 91.4%",
      ring: "221.2 83.2% 53.3%",
    },
    dark: {
      primary: "217.2 91.2% 59.8%",
      primaryForeground: "222.2 84% 4.9%",
      secondary: "217.2 32.6% 17.5%",
      secondaryForeground: "210 40% 98%",
      accent: "217.2 32.6% 17.5%",
      accentForeground: "210 40% 98%",
      background: "222.2 84% 4.9%",
      foreground: "210 40% 98%",
      card: "222.2 84% 4.9%",
      cardForeground: "210 40% 98%",
      popover: "222.2 84% 4.9%",
      popoverForeground: "210 40% 98%",
      muted: "217.2 32.6% 17.5%",
      mutedForeground: "215 20.2% 65.1%",
      destructive: "0 62.8% 30.6%",
      destructiveForeground: "210 40% 98%",
      border: "217.2 32.6% 17.5%",
      input: "217.2 32.6% 17.5%",
      ring: "224.3 76.3% 94.1%",
    },
  },
  red: {
    light: {
      primary: "0 72% 51%",
      primaryForeground: "0 0% 98%",
      secondary: "0 40% 96%",
      secondaryForeground: "0 84% 4.9%",
      accent: "0 40% 96%",
      accentForeground: "0 84% 4.9%",
      background: "0 0% 100%",
      foreground: "0 84% 4.9%",
      card: "0 0% 100%",
      cardForeground: "0 84% 4.9%",
      popover: "0 0% 100%",
      popoverForeground: "0 84% 4.9%",
      muted: "0 40% 96%",
      mutedForeground: "0 16.3% 46.9%",
      destructive: "0 84.2% 60.2%",
      destructiveForeground: "0 40% 98%",
      border: "0 31.8% 91.4%",
      input: "0 31.8% 91.4%",
      ring: "0 72% 51%",
    },
    dark: {
      primary: "0 91.2% 59.8%",
      primaryForeground: "0 84% 4.9%",
      secondary: "0 32.6% 17.5%",
      secondaryForeground: "0 40% 98%",
      accent: "0 32.6% 17.5%",
      accentForeground: "0 40% 98%",
      background: "0 84% 4.9%",
      foreground: "0 40% 98%",
      card: "0 84% 4.9%",
      cardForeground: "0 40% 98%",
      popover: "0 84% 4.9%",
      popoverForeground: "0 40% 98%",
      muted: "0 32.6% 17.5%",
      mutedForeground: "0 20.2% 65.1%",
      destructive: "0 62.8% 30.6%",
      destructiveForeground: "0 40% 98%",
      border: "0 32.6% 17.5%",
      input: "0 32.6% 17.5%",
      ring: "0 76.3% 94.1%",
    },
  },
  green: {
    light: {
      primary: "142 72% 29%",
      primaryForeground: "0 0% 98%",
      secondary: "142 40% 96%",
      secondaryForeground: "142 84% 4.9%",
      accent: "142 40% 96%",
      accentForeground: "142 84% 4.9%",
      background: "0 0% 100%",
      foreground: "142 84% 4.9%",
      card: "0 0% 100%",
      cardForeground: "142 84% 4.9%",
      popover: "0 0% 100%",
      popoverForeground: "142 84% 4.9%",
      muted: "142 40% 96%",
      mutedForeground: "142 16.3% 46.9%",
      destructive: "0 84.2% 60.2%",
      destructiveForeground: "0 40% 98%",
      border: "142 31.8% 91.4%",
      input: "142 31.8% 91.4%",
      ring: "142 72% 29%",
    },
    dark: {
      primary: "142 91.2% 59.8%",
      primaryForeground: "142 84% 4.9%",
      secondary: "142 32.6% 17.5%",
      secondaryForeground: "142 40% 98%",
      accent: "142 32.6% 17.5%",
      accentForeground: "142 40% 98%",
      background: "142 84% 4.9%",
      foreground: "142 40% 98%",
      card: "142 84% 4.9%",
      cardForeground: "142 40% 98%",
      popover: "142 84% 4.9%",
      popoverForeground: "142 40% 98%",
      muted: "142 32.6% 17.5%",
      mutedForeground: "142 20.2% 65.1%",
      destructive: "0 62.8% 30.6%",
      destructiveForeground: "142 40% 98%",
      border: "142 32.6% 17.5%",
      input: "142 32.6% 17.5%",
      ring: "142 76.3% 94.1%",
    },
  },
  fire: {
    light: {
      primary: "24 95% 53%",
      primaryForeground: "0 0% 98%",
      secondary: "24 40% 96%",
      secondaryForeground: "24 84% 4.9%",
      accent: "24 40% 96%",
      accentForeground: "24 84% 4.9%",
      background: "0 0% 100%",
      foreground: "24 84% 4.9%",
      card: "0 0% 100%",
      cardForeground: "24 84% 4.9%",
      popover: "0 0% 100%",
      popoverForeground: "24 84% 4.9%",
      muted: "24 40% 96%",
      mutedForeground: "24 16.3% 46.9%",
      destructive: "0 84.2% 60.2%",
      destructiveForeground: "0 40% 98%",
      border: "24 31.8% 91.4%",
      input: "24 31.8% 91.4%",
      ring: "24 95% 53%",
    },
    dark: {
      primary: "24 91.2% 59.8%",
      primaryForeground: "24 84% 4.9%",
      secondary: "24 32.6% 17.5%",
      secondaryForeground: "24 40% 98%",
      accent: "24 32.6% 17.5%",
      accentForeground: "24 40% 98%",
      background: "24 84% 4.9%",
      foreground: "24 40% 98%",
      card: "24 84% 4.9%",
      cardForeground: "24 40% 98%",
      popover: "24 84% 4.9%",
      popoverForeground: "24 40% 98%",
      muted: "24 32.6% 17.5%",
      mutedForeground: "24 20.2% 65.1%",
      destructive: "0 62.8% 30.6%",
      destructiveForeground: "24 40% 98%",
      border: "24 32.6% 17.5%",
      input: "24 32.6% 17.5%",
      ring: "24 76.3% 94.1%",
    },
  },
  ocean: {
    light: {
      primary: "199 89% 48%",
      primaryForeground: "0 0% 98%",
      secondary: "199 40% 96%",
      secondaryForeground: "199 84% 4.9%",
      accent: "199 40% 96%",
      accentForeground: "199 84% 4.9%",
      background: "0 0% 100%",
      foreground: "199 84% 4.9%",
      card: "0 0% 100%",
      cardForeground: "199 84% 4.9%",
      popover: "0 0% 100%",
      popoverForeground: "199 84% 4.9%",
      muted: "199 40% 96%",
      mutedForeground: "199 16.3% 46.9%",
      destructive: "0 84.2% 60.2%",
      destructiveForeground: "0 40% 98%",
      border: "199 31.8% 91.4%",
      input: "199 31.8% 91.4%",
      ring: "199 89% 48%",
    },
    dark: {
      primary: "199 91.2% 59.8%",
      primaryForeground: "199 84% 4.9%",
      secondary: "199 32.6% 17.5%",
      secondaryForeground: "199 40% 98%",
      accent: "199 32.6% 17.5%",
      accentForeground: "199 40% 98%",
      background: "199 84% 4.9%",
      foreground: "199 40% 98%",
      card: "199 84% 4.9%",
      cardForeground: "199 40% 98%",
      popover: "199 84% 4.9%",
      popoverForeground: "199 40% 98%",
      muted: "199 32.6% 17.5%",
      mutedForeground: "199 20.2% 65.1%",
      destructive: "0 62.8% 30.6%",
      destructiveForeground: "199 40% 98%",
      border: "199 32.6% 17.5%",
      input: "199 32.6% 17.5%",
      ring: "199 76.3% 94.1%",
    },
  },
  purple: {
    light: {
      primary: "262 83% 58%",
      primaryForeground: "0 0% 98%",
      secondary: "262 40% 96%",
      secondaryForeground: "262 84% 4.9%",
      accent: "262 40% 96%",
      accentForeground: "262 84% 4.9%",
      background: "0 0% 100%",
      foreground: "262 84% 4.9%",
      card: "0 0% 100%",
      cardForeground: "262 84% 4.9%",
      popover: "0 0% 100%",
      popoverForeground: "262 84% 4.9%",
      muted: "262 40% 96%",
      mutedForeground: "262 16.3% 46.9%",
      destructive: "0 84.2% 60.2%",
      destructiveForeground: "0 40% 98%",
      border: "262 31.8% 91.4%",
      input: "262 31.8% 91.4%",
      ring: "262 83% 58%",
    },
    dark: {
      primary: "262 91.2% 59.8%",
      primaryForeground: "262 84% 4.9%",
      secondary: "262 32.6% 17.5%",
      secondaryForeground: "262 40% 98%",
      accent: "262 32.6% 17.5%",
      accentForeground: "262 40% 98%",
      background: "262 84% 4.9%",
      foreground: "262 40% 98%",
      card: "262 84% 4.9%",
      cardForeground: "262 40% 98%",
      popover: "262 84% 4.9%",
      popoverForeground: "262 40% 98%",
      muted: "262 32.6% 17.5%",
      mutedForeground: "262 20.2% 65.1%",
      destructive: "0 62.8% 30.6%",
      destructiveForeground: "262 40% 98%",
      border: "262 32.6% 17.5%",
      input: "262 32.6% 17.5%",
      ring: "262 76.3% 94.1%",
    },
  },
  pink: {
    light: {
      primary: "329 72% 51%",
      primaryForeground: "0 0% 98%",
      secondary: "329 40% 96%",
      secondaryForeground: "329 84% 4.9%",
      accent: "329 40% 96%",
      accentForeground: "329 84% 4.9%",
      background: "0 0% 100%",
      foreground: "329 84% 4.9%",
      card: "0 0% 100%",
      cardForeground: "329 84% 4.9%",
      popover: "0 0% 100%",
      popoverForeground: "329 84% 4.9%",
      muted: "329 40% 96%",
      mutedForeground: "329 16.3% 46.9%",
      destructive: "0 84.2% 60.2%",
      destructiveForeground: "329 40% 98%",
      border: "329 31.8% 91.4%",
      input: "329 31.8% 91.4%",
      ring: "329 72% 51%",
    },
    dark: {
      primary: "329 91.2% 59.8%",
      primaryForeground: "329 84% 4.9%",
      secondary: "329 32.6% 17.5%",
      secondaryForeground: "329 40% 98%",
      accent: "329 32.6% 17.5%",
      accentForeground: "329 40% 98%",
      background: "329 84% 4.9%",
      foreground: "329 40% 98%",
      card: "329 84% 4.9%",
      cardForeground: "329 40% 98%",
      popover: "329 84% 4.9%",
      popoverForeground: "329 40% 98%",
      muted: "329 32.6% 17.5%",
      mutedForeground: "329 20.2% 65.1%",
      destructive: "0 62.8% 30.6%",
      destructiveForeground: "329 40% 98%",
      border: "329 32.6% 17.5%",
      input: "329 32.6% 17.5%",
      ring: "329 76.3% 94.1%",
    },
  },
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("classic")
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem("sysgd-theme") as Theme
    const savedMode = localStorage.getItem("sysgd-dark-mode")

    if (savedTheme) setTheme(savedTheme)
    if (savedMode) setIsDark(savedMode === "true")
  }, [])

  useEffect(() => {
    localStorage.setItem("sysgd-theme", theme)
    localStorage.setItem("sysgd-dark-mode", isDark.toString())

    // Apply theme to document
    document.documentElement.setAttribute("data-theme", theme)
    document.documentElement.classList.toggle("dark", isDark)
  }, [theme, isDark])

  return <ThemeContext.Provider value={{ theme, setTheme, isDark, setIsDark }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

export { themes }

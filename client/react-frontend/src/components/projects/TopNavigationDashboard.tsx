import { Button } from "@/components/ui/button"
import useTheme from "@/hooks/useTheme"
import { Home, Moon, Sun, User, Settings, Bell } from "lucide-react"

interface TopNavigationProps {
  onHomeClick: () => void
}

export function TopNavigation({
  onHomeClick,
}: TopNavigationProps) {
  const { theme, toggleTheme } = useTheme()


  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onHomeClick}
              className={"flex items-center gap-2 text-blue-600 dark:text-blue-400"}
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Inicio</span>
            </Button>

          </div>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">S</span>
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-white hidden sm:inline">SYSGD</span>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <Button variant="ghost" size="sm" className="hidden sm:flex">
            <Bell className="w-4 h-4" />
          </Button>

          <Button variant="ghost" size="sm" onClick={toggleTheme}>
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </Button>

          <Button variant="ghost" size="sm" className="hidden sm:flex">
            <Settings className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-300 dark:border-gray-600">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-medium text-gray-900 dark:text-white">Lazaro Yunier</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Administrador</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

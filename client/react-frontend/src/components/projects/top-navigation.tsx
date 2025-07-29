"use client"

import { useState } from "react"
import { ChevronDown, Home, Menu, Settings, User, LogOut, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { SettingsModal } from "./settings-modal"

interface TopNavigationProps {
  selectedProject: string
  onProjectChange: (projectId: string) => void
  onHomeClick: () => void
  onMobileSidebarToggle: () => void
  isHomePage: boolean
}

export function TopNavigation({
  selectedProject,
  onProjectChange,
  onHomeClick,
  onMobileSidebarToggle,
  isHomePage,
}: TopNavigationProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const projects = [
    { id: "sysgd", name: "SYSGD - Sistema Principal", color: "bg-blue-500" },
    { id: "marketing", name: "Proyecto Marketing", color: "bg-green-500" },
    { id: "desarrollo", name: "Desarrollo Web", color: "bg-purple-500" },
    { id: "investigacion", name: "I+D Innovación", color: "bg-orange-500" },
  ]

  const currentProject = projects.find((p) => p.id === selectedProject)

  return (
    <>
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
            {!isHomePage && (
              <Button variant="ghost" size="sm" className="md:hidden" onClick={onMobileSidebarToggle}>
                <Menu className="w-5 h-5" />
              </Button>
            )}

            {/* Home Button */}
            <Button variant="ghost" size="sm" onClick={onHomeClick} className="flex items-center space-x-2">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Inicio</span>
            </Button>

            {/* Project Selector */}
            {!isHomePage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2 bg-transparent">
                    <div className={`w-3 h-3 rounded-full ${currentProject?.color}`} />
                    <span className="hidden sm:inline max-w-[200px] truncate">{currentProject?.name}</span>
                    <span className="sm:hidden">Proyecto</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  {projects.map((project) => (
                    <DropdownMenuItem
                      key={project.id}
                      onClick={() => onProjectChange(project.id)}
                      className="flex items-center space-x-3"
                    >
                      <div className={`w-3 h-3 rounded-full ${project.color}`} />
                      <span>{project.name}</span>
                      {project.id === selectedProject && (
                        <Badge variant="secondary" className="ml-auto">
                          Activo
                        </Badge>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-4 h-4" />
              <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-red-500">
                3
              </Badge>
            </Button>

            {/* Settings Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Ajustes</span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    LY
                  </div>
                  <span className="hidden md:inline">Lazaro Yunier</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Mi Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center space-x-2 text-red-600">
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  )
}

"use client"

import { useState } from "react"
import { TopNavigation } from "./top-navigation"
import { Sidebar } from "./sidebar"
import { TaskManagement } from "./task-management"
import { KanbanBoard } from "./kanban-board"
import { CalendarSection } from "./calendar-section"
import { TeamManagement } from "./team-management"
import { NotesSection } from "./notes-section"
import { IdeasBank } from "./ideas-bank"
import { ThemeProvider } from "@/context/theme-context"
import { HomeDashboard } from "./home-dashboard"


function MainPage() {
  const [activeSection, setActiveSection] = useState("tasks")
  const [selectedProject, setSelectedProject] = useState("sysgd")
  const [showHome, setShowHome] = useState(true) // Cambiar a true por defecto
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const handleHomeClick = () => {
    setShowHome(true)
  }

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId)
    setShowHome(false)
    setActiveSection("tasks") // Ir a tareas por defecto al abrir un proyecto
  }

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    setIsMobileSidebarOpen(false) // Cerrar sidebar en móvil al cambiar sección
  }

  if (showHome) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <TopNavigation
          selectedProject={selectedProject}
          onProjectChange={setSelectedProject}
          onHomeClick={handleHomeClick}
          onMobileSidebarToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          isHomePage={true}
        />
        <HomeDashboard onProjectSelect={handleProjectSelect} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <TopNavigation
        selectedProject={selectedProject}
        onProjectChange={setSelectedProject}
        onHomeClick={handleHomeClick}
        onMobileSidebarToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isHomePage={false}
      />
      <div className="flex flex-1 relative">
        <Sidebar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
          isMobileOpen={isMobileSidebarOpen}
          onMobileClose={() => setIsMobileSidebarOpen(false)}
        />
        <main className="flex-1 p-2 md:p-4 overflow-auto">
          {activeSection === "tasks" && <TaskManagement />}
          {activeSection === "kanban" && <KanbanBoard />}
          {activeSection === "calendar" && <CalendarSection />}
          {activeSection === "team" && <TeamManagement />}
          {activeSection === "notes" && <NotesSection />}
          {activeSection === "ideas" && <IdeasBank />}
        </main>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <ThemeProvider>
      <MainPage />
    </ThemeProvider>
  )
}

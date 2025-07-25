"use client"

import { useState } from "react"
import { Sidebar } from "@/components/projects/sidebar"
import { TopNavigation } from "@/components/projects/top-navigation"
import { KanbanBoard } from "@/components/projects/kanban-board"
import { TeamManagement } from "@/components/projects/team-management"
import { NotesSection } from "@/components/projects/notes-section"
import { IdeasBank } from "@/components/projects/ideas-bank"
import { TaskManagement } from "@/components/projects/task-management"
import { CalendarSection } from "@/components/projects/calendar-section"
import { HomeDashboard } from "@/components/projects/home-dashboard"
import { ThemeProvider } from "@/contexts/theme-context";
import { TimeTracking } from "@/components/projects/time-tracking"
import { DocumentFormExample } from "./document-form-example"

function MainAppProjectDemo() {
  const [activeSection, setActiveSection] = useState("tasks")
  const [selectedProject, setSelectedProject] = useState("sysgd")
  const [showHome, setShowHome] = useState(true)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const handleHomeClick = () => {
    setShowHome(true)
  }

  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId)
    setShowHome(false)
    setActiveSection("tasks")
  }

  const handleSectionChange = (section: string) => {
    setActiveSection(section)
    setIsMobileSidebarOpen(false)
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
          {activeSection === "time-tracking" && <TimeTracking />}
          {activeSection === "document-form" && <DocumentFormExample />}
        </main>
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <ThemeProvider>
      <MainAppProjectDemo />
    </ThemeProvider>
  )
}

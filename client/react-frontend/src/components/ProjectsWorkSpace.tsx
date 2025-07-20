import { useState, type FC } from "react";
import { TopNavigation } from "./top-navigation";
import { useNavigate } from "react-router-dom";
import { useSelectionStore } from "@/store/selection";
import TaskManagement from "./TaskManagement";
import useCurrentUser from "@/hooks/connection/useCurrentUser";
import Loading from "./Loading";
import { ProjectSidebar } from "./ProjectSidebar";
import TeamManagement from "./TeamManagement";
import IdeasBank from "./IdeasBank";

const ProjectWorkSpace: FC = () => {
	const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
	const [activeSection, setActiveSection] = useState("tasks");
	const navigate = useNavigate();
	const selectedProjectId = useSelectionStore(
		(state) => state.selectedProjectId,
	);
	const [selectedProject, setSelectedProject] = useState(selectedProjectId);
	const { loading, user } = useCurrentUser();

	if (loading)
		return (
			<div className="flex flex-col h-screen bg-slate-950 items-center justify-center">
				<Loading textLoading="Verificando sesión..." />
			</div>
		);

	if (!user) {
		navigate("/login");
		return null;
	}

	if (!selectedProject) {
		return <>No hay proyecto seleccionado</>;
	}

	const handleHomeClick = () => {
		navigate("/dashboard");
	};
	/*
  const handleProjectSelect = (projectId: string) => {
    setSelectedProject(projectId)
    setActiveSection("tasks") // Ir a tareas por defecto al abrir un proyecto
  }
*/
	const handleSectionChange = (section: string) => {
		setActiveSection(section);
		setIsMobileSidebarOpen(false);
	};
// TODO: Realizar comprobacion de proyecto seleccionado por aqui antes de mostrar cualquier cosa


	return (
		<div className="h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
			<TopNavigation
				selectedProject={selectedProject}
				onProjectChange={setSelectedProject}
				onHomeClick={handleHomeClick}
				onMobileSidebarToggle={() =>
					setIsMobileSidebarOpen(!isMobileSidebarOpen)
				}
				isHomePage={false}
			/>
			<div className="flex flex-1 relative overflow-hidden">
				<ProjectSidebar
					activeSection={activeSection}
					onSectionChange={handleSectionChange}
					isMobileOpen={isMobileSidebarOpen}
					onMobileClose={() => setIsMobileSidebarOpen(false)}
				/>
				<main className="flex-1 p-2 md:p-4 overflow-auto">
					{activeSection === "tasks" && (
						<TaskManagement project_id={selectedProject} />
					)}

					{activeSection === "team" && (
						<TeamManagement projectId={selectedProject} />
					)}

					{activeSection === "ideas" && (
						<IdeasBank projectId={selectedProject} />
					)}
				</main>
			</div>
		</div>
	);
};

export default ProjectWorkSpace;

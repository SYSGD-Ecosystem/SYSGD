import { useCallback, useRef, useState, type FC } from "react";
import { TopNavigation } from "./top-navigation";
import { useNavigate } from "react-router-dom";
import { useSelectionStore } from "@/store/selection";
import TaskManagement from "./task-management/TaskManagement.tsx";
import useCurrentUser from "@/hooks/connection/useCurrentUser";
import Loading from "../Loading";
import { ProjectSidebar } from "./ProjectSidebar";
import TeamManagement from "./TeamManagement";
import IdeasBank from "./IdeasBank";
import NotesSection from "./NotesSection";
import GitHubIntegration from "./GitHubIntegration.tsx";
import ProjectSettings from "./ProjectSettings";
import type { GitHubCacheEntry } from "./GitHubIntegration";


// type GitHubCacheEntry = {
// 	cacheTime: number;
// 	repository: unknown | null;
// 	pullRequests: unknown[] | null;
// 	metrics: unknown | null;
// 	pullRequestsKey?: string;
// 	pullRequestsPage?: number;
// 	pagination?: { currentPage: number; totalPages: number; totalCount: number };
// };



const ProjectWorkSpace: FC = () => {
	const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
	const [activeSection, setActiveSection] = useState("tasks");
	const navigate = useNavigate();
	const selectedProjectId = useSelectionStore(
		(state) => state.selectedProjectId,
	);
	const [selectedProject, setSelectedProject] = useState(selectedProjectId);
	const { loading, user } = useCurrentUser();

	// GitHub cache at parent level so it survives GitHubIntegration mount/unmount.
	// TTL: 5 minutes
	const githubCacheRef = useRef<Map<string, GitHubCacheEntry>>(new Map());
	// const githubCacheTtlMs = 5 * 60 * 1000;


	const getGitHubCache = useCallback(
		(projectId: string): GitHubCacheEntry | null => {
			return githubCacheRef.current.get(projectId) ?? null;
		},
		[],
	);

	const setGitHubCache = useCallback(
		(projectId: string, patch: Partial<Omit<GitHubCacheEntry, "cacheTime">>) => {
			const prev = githubCacheRef.current.get(projectId);
			githubCacheRef.current.set(projectId, {
				repository: prev?.repository ?? null,
				pullRequests: prev?.pullRequests ?? null,
				metrics: prev?.metrics ?? null,
				pullRequestsKey: prev?.pullRequestsKey,
				//pullRequestsPage: prev?.pullRequestsPage,
				pagination: prev?.pagination,
				...patch,
			});
		},
		[],
	);

	const clearGitHubCache = useCallback((projectId: string) => {
		githubCacheRef.current.delete(projectId);
	}, []);

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
		return <div>No hay proyecto seleccionado</div>;
	}

	const handleHomeClick = () => {
		navigate("/dashboard");
	};

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

					{activeSection === "notes" && selectedProject && (
						<NotesSection projectId={selectedProject} />
					)}

					{activeSection === "github" && selectedProject && (
						<GitHubIntegration
							projectId={selectedProject}
							getGitHubCache={getGitHubCache}
							setGitHubCache={setGitHubCache}
							clearGitHubCache={clearGitHubCache}
						/>
					)}

					{activeSection === "settings" && selectedProject && (
						<ProjectSettings projectId={selectedProject} />
					)}
				</main>
			</div>
		</div>
	);
};

export default ProjectWorkSpace;

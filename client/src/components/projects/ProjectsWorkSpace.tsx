import { type FC, useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useCurrentUser from "@/hooks/connection/useCurrentUser";
import { useSelectionStore } from "@/store/selection";
import { useTimeTrackingStore } from "@/store/time-tracking";
import Loading from "../Loading.tsx";
import type { GitHubCacheEntry } from "./github-integration/GitHubIntegration.tsx";
import GitHubIntegration from "./github-integration/GitHubIntegration.tsx";
import IdeasBank from "./IdeasBank.tsx";
import NotesSection from "./NotesSection.tsx";
import ProjectSettings from "./ProjectSettings.tsx";
import { ProjectSidebar } from "./ProjectSidebar.tsx";
import TeamManagement from "./TeamManagement.tsx";
import TaskManagement from "./task-management/TaskManagement.tsx";
import TimeTrackingSection from "./time-tracking/TimeTrackingSection.tsx";
import TimeTrackingTicker from "./time-tracking/TimeTrackingTicker.tsx";
import { TopNavigation } from "./top-navigation.tsx";
import { ProjectProvider } from "./ProjectProvider.tsx";

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
	const fetchActiveEntry = useTimeTrackingStore(
		(state) => state.fetchActiveEntry,
	);

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
		(
			projectId: string,
			patch: Partial<Omit<GitHubCacheEntry, "cacheTime">>,
		) => {
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

	useEffect(() => {
		void fetchActiveEntry();
	}, [fetchActiveEntry]);

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
				onTimeTrackingClick={() => setActiveSection("time-tracking")}
			/>
			<ProjectProvider projectId={selectedProject}>
				<TimeTrackingTicker />
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

						{activeSection === "time-tracking" && (
							<TimeTrackingSection projectId={selectedProject} />
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
			</ProjectProvider>
		</div>
	);
};

export default ProjectWorkSpace;

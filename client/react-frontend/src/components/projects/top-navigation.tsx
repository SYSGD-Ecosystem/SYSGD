"use client";
//import useTheme from "@/hooks/useTheme";
import { ChevronRight, Home, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import useProjects from "@/hooks/connection/useProjects";
import UserProfileTrigger from "../UserProfileTrigger";
import TimeTrackingIndicator from "./time-tracking/TimeTrackingIndicator";

interface TopNavigationProps {
	selectedProject: string;
	onProjectChange: (project: string) => void;
	onHomeClick: () => void;
	onMobileSidebarToggle: () => void;
	isHomePage?: boolean;
	onTimeTrackingClick?: () => void;
	onProjectChatToggle?: () => void;
	isProjectChatOpen?: boolean;
}

export function TopNavigation({
	selectedProject,
	onProjectChange,
	onHomeClick,
	onMobileSidebarToggle,
	onTimeTrackingClick,
	onProjectChatToggle,
	isProjectChatOpen = false,
}: TopNavigationProps) {
	const { projects } = useProjects();

	const currentProject = projects.find((p) => p.id === selectedProject);

	return (
		<header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 sticky top-0 z-50">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2 md:gap-4">
					<Button
						variant="ghost"
						size="sm"
						className="md:hidden"
						onClick={onMobileSidebarToggle}
					>
						{/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
						<svg
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M4 6h16M4 12h16M4 18h16"
							/>
						</svg>
					</Button>

					{/* Breadcrumb */}
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={onHomeClick}
							className={"flex items-center gap-2"}
						>
							<Home className="w-4 h-4" />
							<span className="hidden sm:inline">Inicio</span>
						</Button>

						<ChevronRight className="w-4 h-4 text-gray-400" />
						<span className="text-sm font-medium text-gray-900 dark:text-white">
							{currentProject?.name || "Proyecto"}
						</span>
					</div>

					<div className="h-6 w-px bg-gray-300 dark:bg-gray-600 hidden sm:block" />

					<div className="flex items-center gap-2">
						<div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
							<span className="text-white text-xs font-bold">S</span>
						</div>
						<span className="font-bold text-lg text-gray-900 dark:text-white hidden sm:inline">
							SYSGD
						</span>
					</div>

					<div className="hidden lg:block">
						<Select value={selectedProject} onValueChange={onProjectChange}>
							<SelectTrigger className="w-64">
								<SelectValue placeholder="Seleccionar proyecto" />
							</SelectTrigger>
							<SelectContent>
								{projects.map((project) => (
									<SelectItem key={project.id} value={project.id}>
										{project.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				<div className="flex items-center gap-1 md:gap-2">
					{onProjectChatToggle && (
						<Button
							variant="ghost"
							size="sm"
							onClick={onProjectChatToggle}
							className="hidden lg:inline-flex"
							title={
								isProjectChatOpen
									? "Ocultar chat del proyecto"
									: "Mostrar chat del proyecto"
							}
						>
							<MessageCircle className="w-4 h-4" />
							<span className="ml-2 hidden xl:inline">
								{isProjectChatOpen ? "Ocultar chat" : "Abrir chat"}
							</span>
						</Button>
					)}
					<TimeTrackingIndicator onOpen={onTimeTrackingClick} />
					{/* <Button variant="ghost" size="sm" className="hidden sm:flex">
						<Bell className="w-4 h-4" />
					</Button>

					<Button variant="ghost" size="sm" className="hidden sm:flex">
						<Settings className="w-4 h-4" />
					</Button> */}
					<div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-300 dark:border-gray-600">
						<UserProfileTrigger />
					</div>
				</div>
			</div>

			<div className="lg:hidden mt-3">
				<Select value={selectedProject} onValueChange={onProjectChange}>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="Seleccionar proyecto" />
					</SelectTrigger>
					<SelectContent>
						{projects.map((project) => (
							<SelectItem key={project.id} value={project.id}>
								{project.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</header>
	);
}

"use client";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import useTheme from "@/hooks/useTheme";
import {
	Home,
	Moon,
	Sun,
	User,
	Settings,
	Bell,
	ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { NotificationsPopup } from "@/components/projects/notifications-popup";

interface TopNavigationProps {
	selectedProject: string;
	onProjectChange: (project: string) => void;
	onHomeClick: () => void;
	onMobileSidebarToggle: () => void;
	isHomePage?: boolean;
}

export function TopNavigation({
	selectedProject,
	onProjectChange,
	onHomeClick,
	onMobileSidebarToggle,
	isHomePage = false,
}: TopNavigationProps) {
	const { theme, toggleTheme } = useTheme();
	const [showNotifications, setShowNotifications] = useState(false);

	const projects = [
		{ id: "sysgd", name: "Sistema de Gestión Documental" },
		{ id: "ecommerce", name: "Plataforma E-commerce" },
		{ id: "mobile-app", name: "Aplicación Móvil" },
		{ id: "dashboard", name: "Dashboard Analytics" },
	];

	const currentProject = projects.find((p) => p.id === selectedProject);

	return (
		<header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 sticky top-0 z-50">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2 md:gap-4">
					{/* Botón menú móvil - solo mostrar si no estamos en home */}
					{!isHomePage && (
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
					)}

					{/* Breadcrumb */}
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={onHomeClick}
							className={`flex items-center gap-2 ${isHomePage ? "text-blue-600 dark:text-blue-400" : ""}`}
						>
							<Home className="w-4 h-4" />
							<span className="hidden sm:inline">Inicio</span>
						</Button>

						{!isHomePage && (
							<>
								<ChevronRight className="w-4 h-4 text-gray-400" />
								<span className="text-sm font-medium text-gray-900 dark:text-white">
									{currentProject?.name || "Proyecto"}
								</span>
							</>
						)}
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

					{/* Selector de proyecto - solo mostrar si no estamos en home */}
					{!isHomePage && (
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
					)}
				</div>

				<div className="flex items-center gap-1 md:gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setShowNotifications(!showNotifications)}
						className="relative"
					>
						<Bell className="w-4 h-4" />
						{/* biome-ignore lint/style/useSelfClosingElements: <explanation> */}
						<div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
					</Button>

					<Button variant="ghost" size="sm" onClick={toggleTheme}>
						{theme === "light" ? (
							<Moon className="w-4 h-4" />
						) : (
							<Sun className="w-4 h-4" />
						)}
					</Button>

					<Button variant="ghost" size="sm" className="hidden sm:flex">
						<Settings className="w-4 h-4" />
					</Button>

					<div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-300 dark:border-gray-600">
						<div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
							<User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
						</div>
						<div className="hidden md:block">
							<div className="text-sm font-medium text-gray-900 dark:text-white">
								Lazaro Yunier
							</div>
							<div className="text-xs text-gray-500 dark:text-gray-400">
								Administrador
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Selector de proyecto móvil - solo mostrar si no estamos en home */}
			{!isHomePage && (
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
			)}
			<NotificationsPopup
				isOpen={showNotifications}
				onClose={() => setShowNotifications(false)}
			/>
		</header>
	);
}

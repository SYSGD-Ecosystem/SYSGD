import { CheckSquare, Lightbulb, Users, FileText, Github, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SidebarProps {
	activeSection: string;
	onSectionChange: (section: string) => void;
	isMobileOpen: boolean;
	onMobileClose: () => void;
}

export function ProjectSidebar({
	activeSection,
	onSectionChange,
	isMobileOpen,
	onMobileClose,
}: SidebarProps) {
	const projectItems = [
		{ id: "tasks", label: "GESTIÓN DE TAREAS", icon: CheckSquare },
		{ id: "ideas", label: "BANCO DE IDEAS", icon: Lightbulb },
		{ id: "notes", label: "NOTAS Y APUNTES", icon: FileText },
		{ id: "github", label: "GITHUB", icon: Github },
		{ id: "team", label: "EQUIPO DE TRABAJO", icon: Users },
		{ id: "settings", label: "CONFIGURACIÓN", icon: Settings },
	];

	return (
		<>
			{/* Overlay para móvil */}
			{isMobileOpen && (
				// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
				<div
					className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
					onClick={onMobileClose}
				/>
			)}

			{/* Sidebar */}
			<aside
				className={`
        fixed md:relative top-0 left-0 h-full w-64
        bg-gray-50 dark:bg-gray-800
        border-r border-gray-200 dark:border-gray-700
        p-4 z-50 transition-transform duration-300 ease-in-out
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        md:h-auto md:min-h-full
      `}
			>
				{/* Botón cerrar en móvil */}
				<div className="flex justify-between items-center mb-4 md:hidden">
					<h2 className="text-lg font-semibold text-gray-900 dark:text-white">
						Menú
					</h2>
					<Button variant="ghost" size="sm" onClick={onMobileClose}>
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
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</Button>
				</div>

				<div className="space-y-2">
					<h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
						GESTIÓN DE PROYECTOS
					</h3>
					<div className="space-y-1">
						{projectItems.map((item) => {
							const Icon = item.icon;
							return (
								<Button
									key={item.id}
									variant={activeSection === item.id ? "secondary" : "ghost"}
									className="w-full justify-start text-xs h-8 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
									onClick={() => onSectionChange(item.id)}
								>
									<Icon className="w-3 h-3 mr-2" />
									{item.label}
								</Button>
							);
						})}
					</div>
				</div>
			</aside>
		</>
	);
}

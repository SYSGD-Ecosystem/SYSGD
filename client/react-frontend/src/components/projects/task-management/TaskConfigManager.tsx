import { ChevronDown, Plus, X, GripVertical } from "lucide-react";
import { type FC, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useTaskConfig } from "./hooks/useTaskConfig";

const TaskConfigManager: FC<{ projectId: string }> = ({ projectId }) => {
	const { config, loading, updateConfig } = useTaskConfig(projectId);
	const [newType, setNewType] = useState("");
	const [newPriority, setNewPriority] = useState("");
	const [newState, setNewState] = useState("");
	const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

	const toggleSection = (section: string) => {
		setOpenSections((prev) => ({
			...prev,
			[section]: !prev[section],
		}));
	};

	const handleAddType = () => {
		if (!newType.trim()) return;
		const colors = [
			"#3B82F6",
			"#10B981",
			"#F59E0B",
			"#EF4444",
			"#8B5CF6",
			"#EC4899",
		];
		const randomColor = colors[Math.floor(Math.random() * colors.length)];

		const updatedTypes = [
			...(config?.types || []),
			{
				name: newType.trim(),
				color: randomColor,
			},
		];
		updateConfig({ ...config!, types: updatedTypes });
		setNewType("");
	};

	const handleAddPriority = () => {
		if (!newPriority.trim()) return;
		const maxLevel = Math.max(
			...(config?.priorities?.map((p) => p.level) || [0]),
		);
		const colors = ["#10B981", "#F59E0B", "#EF4444"];
		const colorIndex = Math.min(maxLevel, colors.length - 1);

		const updatedPriorities = [
			...(config?.priorities || []),
			{
				name: newPriority.trim(),
				level: maxLevel + 1,
				color: colors[colorIndex],
			},
		];
		updateConfig({ ...config!, priorities: updatedPriorities });
		setNewPriority("");
	};

	const handleAddState = () => {
		if (!newState.trim()) return;
		const colors = ["#6B7280", "#3B82F6", "#10B981", "#F59E0B"];
		const randomColor = colors[Math.floor(Math.random() * colors.length)];

		const updatedStates = [
			...(config?.states || []),
			{
				name: newState.trim(),
				color: randomColor,
				requires_context: false,
			},
		];
		updateConfig({ ...config!, states: updatedStates });
		setNewState("");
	};

	const handleDeleteType = (typeName: string) => {
		const updatedTypes =
			config?.types?.filter((t) => t.name !== typeName) || [];
		updateConfig({ ...config!, types: updatedTypes });
	};

	const handleDeletePriority = (priorityName: string) => {
		const updatedPriorities =
			config?.priorities?.filter((p) => p.name !== priorityName) || [];
		updateConfig({ ...config!, priorities: updatedPriorities });
	};

	const handleDeleteState = (stateName: string) => {
		const updatedStates =
			config?.states?.filter((s) => s.name !== stateName) || [];
		updateConfig({ ...config!, states: updatedStates });
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base sm:text-lg">
						Configuración de Tareas
					</CardTitle>
					<CardDescription className="text-sm">
						Personaliza tipos, prioridades y estados para tu proyecto
					</CardDescription>
				</CardHeader>
			</Card>

			{/* Tipos de Tarea */}
			<Card>
				<Collapsible
					open={openSections.types}
					onOpenChange={() => toggleSection("types")}
				>
					<CollapsibleTrigger className="w-full">
						<CardHeader className="pb-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<ChevronDown
										className={`h-4 w-4 transition-transform ${
											openSections.types ? "transform rotate-180" : ""
										}`}
									/>
									<CardTitle className="text-sm sm:text-base">
										Tipos de Tarea
									</CardTitle>
									<Badge variant="secondary" className="text-xs">
										{config?.types?.length || 0}
									</Badge>
								</div>
							</div>
						</CardHeader>
					</CollapsibleTrigger>
					<CollapsibleContent>
						<CardContent className="pt-0 space-y-3">
							{/* Lista de tipos existentes */}
							<div className="space-y-2">
								{config?.types?.map((type) => (
									<div
										key={type.name}
										className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
									>
										<GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
										<div
											className="w-3 h-3 rounded-full flex-shrink-0"
											style={{ backgroundColor: type.color }}
										/>
										<span className="flex-1 text-sm">{type.name}</span>
										<Button
											variant="ghost"
											size="sm"
											className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
											onClick={() => handleDeleteType(type.name)}
										>
											<X className="w-3.5 h-3.5" />
										</Button>
									</div>
								))}
							</div>

							{/* Input para agregar nuevo */}
							<div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
								<Input
									placeholder="Nuevo tipo (ej: Bug, Feature...)"
									value={newType}
									onChange={(e) => setNewType(e.target.value)}
									onKeyPress={(e) => e.key === "Enter" && handleAddType()}
									className="text-sm"
								/>
								<Button
									onClick={handleAddType}
									size="sm"
									disabled={!newType.trim()}
									className="flex-shrink-0"
								>
									<Plus className="w-4 h-4 sm:mr-1" />
									<span className="hidden sm:inline">Agregar</span>
								</Button>
							</div>
						</CardContent>
					</CollapsibleContent>
				</Collapsible>
			</Card>

			{/* Prioridades */}
			<Card>
				<Collapsible
					open={openSections.priorities}
					onOpenChange={() => toggleSection("priorities")}
				>
					<CollapsibleTrigger className="w-full">
						<CardHeader className="pb-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<ChevronDown
										className={`h-4 w-4 transition-transform ${
											openSections.priorities ? "transform rotate-180" : ""
										}`}
									/>
									<CardTitle className="text-sm sm:text-base">
										Prioridades
									</CardTitle>
									<Badge variant="secondary" className="text-xs">
										{config?.priorities?.length || 0}
									</Badge>
								</div>
							</div>
						</CardHeader>
					</CollapsibleTrigger>
					<CollapsibleContent>
						<CardContent className="pt-0 space-y-3">
							{/* Lista de prioridades */}
							<div className="space-y-2">
								{config?.priorities
									?.sort((a, b) => a.level - b.level)
									.map((priority) => (
										<div
											key={priority.name}
											className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
										>
											<GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
											<Badge
												variant="outline"
												className="flex-shrink-0 text-xs"
												style={{
													backgroundColor: priority.color + "20",
													borderColor: priority.color,
													color: priority.color,
												}}
											>
												Nivel {priority.level}
											</Badge>
											<div
												className="w-3 h-3 rounded-full flex-shrink-0"
												style={{ backgroundColor: priority.color }}
											/>
											<span className="flex-1 text-sm font-medium">
												{priority.name}
											</span>
											<Button
												variant="ghost"
												size="sm"
												className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
												onClick={() => handleDeletePriority(priority.name)}
											>
												<X className="w-3.5 h-3.5" />
											</Button>
										</div>
									))}
							</div>

							{/* Input para agregar nuevo */}
							<div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
								<Input
									placeholder="Nueva prioridad (ej: Crítica...)"
									value={newPriority}
									onChange={(e) => setNewPriority(e.target.value)}
									onKeyPress={(e) => e.key === "Enter" && handleAddPriority()}
									className="text-sm"
								/>
								<Button
									onClick={handleAddPriority}
									size="sm"
									disabled={!newPriority.trim()}
									className="flex-shrink-0"
								>
									<Plus className="w-4 h-4 sm:mr-1" />
									<span className="hidden sm:inline">Agregar</span>
								</Button>
							</div>
						</CardContent>
					</CollapsibleContent>
				</Collapsible>
			</Card>

			{/* Estados */}
			<Card>
				<Collapsible
					open={openSections.states}
					onOpenChange={() => toggleSection("states")}
				>
					<CollapsibleTrigger className="w-full">
						<CardHeader className="pb-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-2">
									<ChevronDown
										className={`h-4 w-4 transition-transform ${
											openSections.states ? "transform rotate-180" : ""
										}`}
									/>
									<CardTitle className="text-sm sm:text-base">
										Estados de Tarea
									</CardTitle>
									<Badge variant="secondary" className="text-xs">
										{config?.states?.length || 0}
									</Badge>
								</div>
							</div>
						</CardHeader>
					</CollapsibleTrigger>
					<CollapsibleContent>
						<CardContent className="pt-0 space-y-3">
							{/* Lista de estados */}
							<div className="space-y-2">
								{config?.states?.map((state) => (
									<div
										key={state.name}
										className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
									>
										<GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
										<div
											className="w-3 h-3 rounded-full flex-shrink-0"
											style={{ backgroundColor: state.color }}
										/>
										<span className="flex-1 text-sm">{state.name}</span>
										{state.requires_context && (
											<Badge variant="secondary" className="text-xs">
												Requiere contexto
											</Badge>
										)}
										<Button
											variant="ghost"
											size="sm"
											className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
											onClick={() => handleDeleteState(state.name)}
										>
											<X className="w-3.5 h-3.5" />
										</Button>
									</div>
								))}
							</div>

							{/* Input para agregar nuevo */}
							<div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
								<Input
									placeholder="Nuevo estado (ej: En revisión...)"
									value={newState}
									onChange={(e) => setNewState(e.target.value)}
									onKeyPress={(e) => e.key === "Enter" && handleAddState()}
									className="text-sm"
								/>
								<Button
									onClick={handleAddState}
									size="sm"
									disabled={!newState.trim()}
									className="flex-shrink-0"
								>
									<Plus className="w-4 h-4 sm:mr-1" />
									<span className="hidden sm:inline">Agregar</span>
								</Button>
							</div>
						</CardContent>
					</CollapsibleContent>
				</Collapsible>
			</Card>

			{/* Info card */}
			<Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
				<CardContent className="pt-4 pb-4">
					<div className="flex gap-3">
						<div className="flex-shrink-0 mt-0.5">
							<div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
								<span className="text-blue-600 dark:text-blue-400 text-sm">
									💡
								</span>
							</div>
						</div>
						<div className="flex-1">
							<h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
								Consejos de configuración
							</h4>
							<ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
								<li>
									• Los colores se asignan automáticamente al crear elementos
								</li>
								<li>
									• Arrastra los elementos para reordenarlos (próximamente)
								</li>
								<li>• Las prioridades se ordenan automáticamente por nivel</li>
							</ul>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default TaskConfigManager;

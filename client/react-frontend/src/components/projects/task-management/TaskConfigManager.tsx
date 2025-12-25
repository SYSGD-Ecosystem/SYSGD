import { type FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, X } from "lucide-react";
import { useTaskConfig } from "./hooks/useTaskConfig";

const TaskConfigManager: FC<{ projectId: string }> = ({ projectId }) => {
	const { config, loading, updateConfig } = useTaskConfig(projectId);
	const [newType, setNewType] = useState("");
	const [newPriority, setNewPriority] = useState("");
	const [newState, setNewState] = useState("");

	const handleAddType = () => {
		if (!newType.trim()) return;
		const updatedTypes = [...(config?.types || []), { 
			name: newType.trim(),
			color: "#3B82F6" // Color por defecto
		}];
		updateConfig({ ...config!, types: updatedTypes });
		setNewType("");
	};

	const handleAddPriority = () => {
		if (!newPriority.trim()) return;
		const maxLevel = Math.max(...(config?.priorities?.map(p => p.level) || [0]));
		const updatedPriorities = [...(config?.priorities || []), { 
			name: newPriority.trim(), 
			level: maxLevel + 1,
			color: "#F59E0B" // Color por defecto
		}];
		updateConfig({...config!, priorities: updatedPriorities });
		setNewPriority("");
	};

	const handleAddState = () => {
		if (!newState.trim()) return;
		const updatedStates = [...(config?.states || []), { 
			name: newState.trim(),
			color: "#6B7280", // Color por defecto
			requires_context: false // Valor por defecto
		}];
		updateConfig({...config!, states: updatedStates });
		setNewState("");
	};

	const handleDeleteType = (typeName: string) => {
		const updatedTypes = config?.types?.filter(t => t.name !== typeName) || [];
		updateConfig({...config!, types: updatedTypes });
	};

	const handleDeletePriority = (priorityName: string) => {
		const updatedPriorities = config?.priorities?.filter(p => p.name !== priorityName) || [];
		updateConfig({...config!, priorities: updatedPriorities });
	};

	const handleDeleteState = (stateName: string) => {
		const updatedStates = config?.states?.filter(s => s.name !== stateName) || [];
		updateConfig({...config!, states: updatedStates });
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	return (
		<Tabs defaultValue="types" className="w-full">
			<TabsList className="grid w-full grid-cols-3">
				<TabsTrigger value="types">Tipos</TabsTrigger>
				<TabsTrigger value="priorities">Prioridades</TabsTrigger>
				<TabsTrigger value="states">Estados</TabsTrigger>
			</TabsList>

			<TabsContent value="types" className="space-y-4">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Tipos de Tarea</CardTitle>
						<CardDescription>
							Define los tipos de tareas disponibles en el proyecto
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex gap-2">
							<Input
								placeholder="Nuevo tipo de tarea"
								value={newType}
								onChange={(e) => setNewType(e.target.value)}
								onKeyPress={(e) => e.key === "Enter" && handleAddType()}
							/>
							<Button onClick={handleAddType} size="sm">
								<Plus className="w-4 h-4" />
							</Button>
						</div>
						<div className="flex flex-wrap gap-2">
							{config?.types?.map((type) => (
								<Badge key={type.name} variant="secondary" className="flex items-center gap-1">
									{type.name}
									<Button
										variant="ghost"
										size="sm"
										className="h-4 w-4 p-0 hover:bg-red-100"
										onClick={() => handleDeleteType(type.name)}
									>
										<X className="w-3 h-3" />
									</Button>
								</Badge>
							))}
						</div>
					</CardContent>
				</Card>
			</TabsContent>

			<TabsContent value="priorities" className="space-y-4">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Prioridades</CardTitle>
						<CardDescription>
							Define los niveles de prioridad para las tareas
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex gap-2">
							<Input
								placeholder="Nueva prioridad"
								value={newPriority}
								onChange={(e) => setNewPriority(e.target.value)}
								onKeyPress={(e) => e.key === "Enter" && handleAddPriority()}
							/>
							<Button onClick={handleAddPriority} size="sm">
								<Plus className="w-4 h-4" />
							</Button>
						</div>
						<div className="space-y-2">
							{config?.priorities
								?.sort((a, b) => a.level - b.level)
								.map((priority) => (
									<div key={priority.name} className="flex items-center justify-between p-2 border rounded">
										<div className="flex items-center gap-2">
											<Badge variant="outline">Nivel {priority.level}</Badge>
											<span>{priority.name}</span>
										</div>
										<Button
											variant="ghost"
											size="sm"
											className="h-6 w-6 p-0 hover:bg-red-100"
											onClick={() => handleDeletePriority(priority.name)}
										>
											<Trash2 className="w-3 h-3" />
										</Button>
									</div>
								))}
						</div>
					</CardContent>
				</Card>
			</TabsContent>

			<TabsContent value="states" className="space-y-4">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Estados de Tarea</CardTitle>
						<CardDescription>
							Define los estados por los que puede pasar una tarea
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex gap-2">
							<Input
								placeholder="Nuevo estado"
								value={newState}
								onChange={(e) => setNewState(e.target.value)}
								onKeyPress={(e) => e.key === "Enter" && handleAddState()}
							/>
							<Button onClick={handleAddState} size="sm">
								<Plus className="w-4 h-4" />
							</Button>
						</div>
						<div className="flex flex-wrap gap-2">
							{config?.states?.map((state) => (
								<Badge key={state.name} variant="outline" className="flex items-center gap-1">
									{state.name}
									<Button
										variant="ghost"
										size="sm"
										className="h-4 w-4 p-0 hover:bg-red-100"
										onClick={() => handleDeleteState(state.name)}
									>
										<X className="w-3 h-3" />
									</Button>
								</Badge>
							))}
						</div>
					</CardContent>
				</Card>
			</TabsContent>
		</Tabs>
	);
};

export default TaskConfigManager;

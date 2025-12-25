import type { FC } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import MarkdownEditor from "@/components/ui/markdown-editor";
import { useTaskConfig } from "@/components/projects/task-management/hooks/useTaskConfig";
import type { Task } from "@/types/Task";
import { Sparkles, Loader2, Check, X } from "lucide-react";

type ProjectMember = {
	id: string;
	name: string;
  email: string;
	status?: string; // 'active' | 'invited'
	sender_name?: string; // Para invitaciones
	sender_email?: string; // Para invitaciones
	created_at?: string; // Para invitaciones
};

// const Skeleton: FC = () => {
// 	return (
// 		<div className="w-full h-4 bg-slate-300 dark:bg-slate-600 rounded-full animate-pulse" />
// 	);
// };

type Props = {
	projectId: string;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	editingTask: Partial<Task> | null;
	setEditingTask: (task: Partial<Task> | null) => void;
	tasks: Task[];
	members: ProjectMember[];
	isEditing: boolean;
	handleSaveTask: () => void;
	// IA funcional
	geminiIsLoading?: boolean;
	improvedText?: string;
	handleImprove?: (title: string, description: string) => void;
	showImprovedPreview?: boolean;
	setShowImprovedPreview?: (show: boolean) => void;
};

const DialogCreateTask: FC<Props> = ({
	projectId,
	isOpen,
	onOpenChange,
	editingTask,
	setEditingTask,
	tasks,
	members,
	isEditing,
	handleSaveTask,
	geminiIsLoading,
	improvedText,
	handleImprove,
	showImprovedPreview,
	setShowImprovedPreview,
}) => {
	const { config } = useTaskConfig(projectId);

	const typeOptions = config?.types?.map((t) => t.name) ?? ["Tarea"];
	const priorityOptions = config?.priorities?.map((p) => p.name) ?? [
		"Alta",
		"Media",
		"Baja",
	];
	const statusOptions = config?.states?.map((s) => s.name) ?? [
		"Pendiente",
		"En Progreso",
		"Completado",
	];

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{editingTask?.id && tasks.find((t) => t.id === editingTask.id)
							? "Editar Tarea"
							: "Nueva Tarea"}
					</DialogTitle>
				</DialogHeader>

				{editingTask && (
					<div className="space-y-4">
						<div>
							<Label htmlFor="titulo">Título</Label>
							{/** biome-ignore lint/correctness/useUniqueElementIds: <explanation> */}
							<Input
								id="titulo"
								value={editingTask.title ?? ""}
								onChange={(e) =>
									setEditingTask({ ...editingTask, title: e.target.value })
								}
							/>
						</div>

						<div>
							<Label htmlFor="descripcion">Descripción</Label>
							<div className="relative">
								<MarkdownEditor
									value={editingTask.description || ""}
									onChange={(value) =>
										setEditingTask({
											...editingTask,
											description: value,
										})
									}
									placeholder="Describe la tarea usando Markdown..."
									className="mt-2"
								/>
								{handleImprove && (
									<div className="absolute top-2 right-2">
										<Button
											type="button"
											size="sm"
											variant="secondary"
											disabled={geminiIsLoading || !editingTask.title?.trim()}
											onClick={() =>
												handleImprove(
													editingTask.title ?? "",
													editingTask.description ?? "",
												)
											}
											className="h-8 px-3"
										>
											{geminiIsLoading ? (
												<Loader2 className="h-4 w-4 animate-spin" />
											) : (
												<Sparkles className="h-4 w-4" />
											)}
											{!geminiIsLoading && "Mejorar"}
										</Button>
									</div>
								)}
							</div>
						</div>

						{/* Vista previa mejorada con IA */}
						{showImprovedPreview && improvedText && (
							<div className="border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50/50 dark:bg-blue-950/50 space-y-3">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2 text-sm font-medium text-blue-700 dark:text-blue-300">
										<Sparkles className="h-4 w-4" />
										Descripción mejorada con IA
									</div>
									<Button
										type="button"
										size="sm"
										variant="ghost"
										onClick={() => setShowImprovedPreview?.(false)}
									>
										<X className="h-4 w-4" />
									</Button>
								</div>
								
								<div className="bg-white dark:bg-slate-800 rounded-md p-3 max-h-48 overflow-y-auto">
									<Textarea
										value={improvedText}
										readOnly
										className="min-h-24 resize-none border-0 bg-transparent shadow-none text-sm leading-relaxed"
										placeholder="La respuesta de la IA aparecerá aquí..."
									/>
								</div>

								<div className="flex gap-2">
									<Button
										type="button"
										size="sm"
										onClick={() => {
											setEditingTask({
												...editingTask,
												description: improvedText,
											});
											setShowImprovedPreview?.(false);
										}}
										className="flex-1"
									>
										<Check className="h-4 w-4 mr-1" />
										Aceptar y aplicar
									</Button>
									<Button
										type="button"
										size="sm"
										variant="outline"
										onClick={() => setShowImprovedPreview?.(false)}
										className="flex-1"
									>
										<X className="h-4 w-4 mr-1" />
										Descartar
									</Button>
								</div>
							</div>
						)}


						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="tipo">Tipo</Label>
								<Select
									value={editingTask.type}
									onValueChange={(value) =>
										setEditingTask({ ...editingTask, type: value })
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{typeOptions.map((typeName) => (
											<SelectItem key={typeName} value={typeName}>
												{typeName}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div>
								<Label htmlFor="prioridad">Prioridad</Label>
								<Select
									value={editingTask.priority}
									onValueChange={(value) =>
										setEditingTask({ ...editingTask, priority: value })
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{priorityOptions.map((priorityName) => (
											<SelectItem key={priorityName} value={priorityName}>
												{priorityName}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div>
								<Label htmlFor="estado">Estado</Label>
								<Select
									value={editingTask.status}
									onValueChange={(value) =>
										setEditingTask({ ...editingTask, status: value })
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{statusOptions.map((statusName) => (
											<SelectItem key={statusName} value={statusName}>
												{statusName}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div>
								<Label>Asignar a</Label>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="outline"
											className="w-full justify-start text-left font-normal"
										>
											{editingTask.assignees && editingTask.assignees.length > 0
												? editingTask.assignees.map((a) => a.name).join(", ")
												: "Seleccionar miembros"}
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent className="w-full">
										<DropdownMenuLabel>Miembros del Proyecto</DropdownMenuLabel>
										<DropdownMenuSeparator />
										{members.map((member) => (
											<DropdownMenuCheckboxItem
												key={member.id}
												checked={
													editingTask?.assignees?.some(
														(a) => a.id === member.id,
													) || false
												}
												onCheckedChange={(checked) => {
													const currentAssignees = editingTask?.assignees || [];
													if (checked) {
														setEditingTask({
															...editingTask,
															assignees: [...currentAssignees, member],
														});
													} else {
														setEditingTask({
															...editingTask,
															assignees: currentAssignees.filter(
																(a) => a.id !== member.id,
															),
														});
													}
												}}
											>
												<div className="flex items-center justify-between w-full">
													<span>{member.name}</span>
													{member.status === 'invited' && (
														<Badge variant="secondary" className="text-xs ml-2">
															Invitado
														</Badge>
													)}
												</div>
											</DropdownMenuCheckboxItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>

						<div className="flex justify-end gap-2">
							<Button variant="outline" onClick={() => onOpenChange(false)}>
								Cancelar
							</Button>
							<Button disabled={isEditing} onClick={handleSaveTask}>
								Guardar
							</Button>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
};

export default DialogCreateTask;

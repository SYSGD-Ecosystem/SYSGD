import { useEffect, useState, type FC } from "react";
import { Dialog, DialogContent } from "../../../ui/dialog";
import { Button } from "../../../ui/button";
import type { Task } from "@/types/Task";
import { Badge } from "../../../ui/badge";
import { getPriorityColor } from "@/utils/util";
import { getStatusIcon } from "@/utils/util-components";
import ReactMarkdown from "react-markdown";
import { Calendar, User, Tag, AlertCircle } from "lucide-react";
import { useTaskConfig } from "@/components/projects/task-management/hooks/useTaskConfig";
import { ScrollArea } from "@/components/ui/scroll-area";

const DialogViewTask: FC<{
	selectedTask: Task;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onEditChange: () => void;
	onDeleteChange: () => void;
}> = ({ selectedTask, isOpen, onOpenChange, onEditChange, onDeleteChange }) => {
	const [isButtonDisabled, setIsButtonDisabled] = useState(false);

	const { config: taskConfig } = useTaskConfig(selectedTask.project_id);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		setIsButtonDisabled(false);
	}, [selectedTask]);

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl max-h-[85vh] p-0 flex flex-col">
				{/* Header compacto */}
				<div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-6">
					<div className="flex flex-col items-start justify-between">
						<div className="flex-1 min-w-0">
							<h1 className="text-xl md:text-2xl lg:text-2xl xl:text-3xl font-bold text-gray-900 dark:text-white mb-2 pr-4">
								{selectedTask.title}
							</h1>
						</div>
						<div className="flex items-center gap-4 justify-between w-full">
							<div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
								<div className="flex items-center gap-1">
									<Tag className="w-4 h-4" />
									<span>#{selectedTask.project_task_number}</span>
								</div>
								<div className="flex items-center gap-1">
									<Calendar className="w-4 h-4" />
									<span>{new Date(selectedTask.created_at).toLocaleDateString()}</span>
								</div>
							</div>

							<div className="flex w-full justify-end items-center gap-2">
								<Badge
									style={{
										backgroundColor: getPriorityColor(selectedTask.priority, taskConfig),
										color: 'white'
									}}
									className="shrink-0"
								>
									{selectedTask.priority}
								</Badge>
								<div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-md shrink-0">
									{getStatusIcon(selectedTask.status, taskConfig)}
									<span className="text-sm font-medium">{selectedTask.status}</span>
								</div>
							</div>

						</div>
					</div>
				</div>

				{/* Contenido principal con scroll */}
				<ScrollArea className="flex-1 p-6 overflow-y-auto">
					<div className="space-y-6">
						{/* Descripción - Sin label redundante */}
						{selectedTask.description && (
							<div>
								<div className="prose prose-lg dark:prose-invert max-w-none">
									<ReactMarkdown>
										{selectedTask.description}
									</ReactMarkdown>
								</div>
							</div>
						)}

						{/* Metadatos compactos */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							{/* Tipo */}
							<div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
								<Tag className="w-5 h-5 text-gray-500" />
								<div>
									<p className="text-xs text-gray-500 dark:text-gray-400">Tipo</p>
									<p className="font-medium text-gray-900 dark:text-white">{selectedTask.type}</p>
								</div>
							</div>

							{/* Asignados */}
							<div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
								<User className="w-5 h-5 text-gray-500" />
								<div className="flex-1 min-w-0">
									<p className="text-xs text-gray-500 dark:text-gray-400">Asignado a</p>
									<div className="flex flex-wrap gap-1 mt-1">
										{selectedTask.assignees && selectedTask.assignees.length > 0 ? (
											selectedTask.assignees.slice(0, 2).map((assignee) => (
												<Badge key={assignee.id} variant="outline" className="text-xs">
													{assignee?.name || assignee?.email || 'Usuario sin nombre'}
												</Badge>
											))
										) : (
											<span className="text-sm text-gray-500">Sin asignar</span>
										)}
										{selectedTask.assignees && selectedTask.assignees.length > 2 && (
											<Badge variant="outline" className="text-xs">
												+{selectedTask.assignees.length - 2}
											</Badge>
										)}
									</div>
								</div>
							</div>

							{/* Información adicional */}
							<div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
								<AlertCircle className="w-5 h-5 text-gray-500" />
								<div>
									<p className="text-xs text-gray-500 dark:text-gray-400">ID</p>
									<p className="font-mono text-sm text-gray-900 dark:text-white">{selectedTask.id}</p>
								</div>
							</div>
						</div>
					</div>
				</ScrollArea>

				{/* Botones fijos en la parte inferior */}
				<div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 p-6 bg-white dark:bg-gray-900">
					<div className="flex justify-end gap-3">
						<Button
							variant="outline"
							disabled={isButtonDisabled}
							onClick={onEditChange}
						>
							Editar
						</Button>
						<Button
							variant="destructive"
							disabled={isButtonDisabled}
							onClick={() => {
								setIsButtonDisabled(true);
								onDeleteChange();
							}}
						>
							Eliminar
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default DialogViewTask;

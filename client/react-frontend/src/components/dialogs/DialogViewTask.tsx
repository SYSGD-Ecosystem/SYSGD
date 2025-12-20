import { useEffect, useState, type FC } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import type { Task } from "@/types/Task";
import { Badge } from "../ui/badge";
import { formatDate, getPriorityColor } from "@/utils/util";
import { getStatusIcon } from "@/utils/util-components";
import ReactMarkdown from "react-markdown";

const DialogViewTask: FC<{
	selectedTask: Task;
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	onEditChange: () => void;
	onDeleteChange: () => void;
}> = ({ selectedTask, isOpen, onOpenChange, onEditChange, onDeleteChange }) => {
	const [isButtonDisabled, setIsButtionDisabled] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		setIsButtionDisabled(false);
	}, [selectedTask]);

	return (
		<>
			<Dialog open={isOpen} onOpenChange={onOpenChange}>
				<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
					<DialogHeader className="border-b pb-4">
						<div className="flex items-center justify-between">
							<DialogTitle className="text-xl font-semibold">Detalles de la Tarea</DialogTitle>
							<Badge variant="outline" className="text-xs">
								ID: {selectedTask.id}
							</Badge>
						</div>
					</DialogHeader>
					
					<div className="space-y-6 pt-4">
						{/* Header Info */}
						<div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
							<div>
								<Label className="text-sm font-semibold text-gray-600 dark:text-gray-400">
									Número de Tarea
								</Label>
								<p className="text-lg font-medium text-gray-900 dark:text-white">
									{selectedTask.project_task_number}
								</p>
							</div>
							<div>
								<Label className="text-sm font-semibold text-gray-600 dark:text-gray-400">
									Fecha de Creación
								</Label>
								<p className="text-lg font-medium text-gray-900 dark:text-white">
									{formatDate(selectedTask.created_at)}
								</p>
							</div>
						</div>

						{/* Title and Description */}
						<div className="space-y-4">
							<div>
								<Label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 block">
									Título
								</Label>
								<h3 className="text-xl font-semibold text-gray-900 dark:text-white">
									{selectedTask.title}
								</h3>
							</div>
							
							<div>
								<Label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 block">
									Descripción
								</Label>
								<div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 max-h-60 overflow-y-auto">
									<div className="prose prose-sm dark:prose-invert max-w-none">
										<ReactMarkdown>
											{selectedTask.description}
										</ReactMarkdown>
									</div>
								</div>
							</div>
						</div>

						{/* Task Properties */}
						<div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
							<div className="text-center">
								<Label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 block">
									Tipo
								</Label>
								<Badge variant="secondary" className="w-full justify-center">
									{selectedTask.type}
								</Badge>
							</div>
							<div className="text-center">
								<Label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 block">
									Prioridad
								</Label>
								<Badge variant={getPriorityColor(selectedTask.priority)} className="w-full justify-center">
									{selectedTask.priority}
								</Badge>
							</div>
							<div className="text-center">
								<Label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 block">
									Estado
								</Label>
								<div className="flex items-center justify-center gap-2">
									{getStatusIcon(selectedTask.status)}
									<span className="text-sm font-medium text-gray-900 dark:text-white">
										{selectedTask.status}
									</span>
								</div>
							</div>
						</div>

						{/* Assignees */}
						<div>
							<Label className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 block">
								Asignado a
							</Label>
							<div className="flex flex-wrap gap-2">
								{selectedTask.assignees && selectedTask.assignees.length > 0 ? (
									selectedTask.assignees.map((assignee) => (
										<Badge
											key={assignee.id}
											variant="outline"
											className="flex items-center gap-2 px-3 py-1"
											title={assignee.name}
										>
											<div className="w-2 h-2 bg-blue-500 rounded-full"></div>
											{assignee.name}
										</Badge>
									))
								) : (
									<Badge variant="outline" className="text-gray-500">
										Sin asignar
									</Badge>
								)}
							</div>
						</div>

						{/* Action Buttons */}
						<div className="flex justify-end gap-3 pt-4 border-t">
							<Button
								variant="outline"
								disabled={isButtonDisabled}
								onClick={onEditChange}
								className="flex items-center gap-2"
							>
								Editar
							</Button>
							<Button
								variant="destructive"
								disabled={isButtonDisabled}
								onClick={() => {
									setIsButtionDisabled(true);
									onDeleteChange();
								}}
								className="flex items-center gap-2"
							>
								Eliminar
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default DialogViewTask;

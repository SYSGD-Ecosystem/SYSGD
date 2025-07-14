import { useEffect, useState, type FC } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import type { Task } from "@/types/Task";
import { Badge } from "../ui/badge";
import { formatDate, getPriorityColor } from "@/utils/util";
import { getStatusIcon } from "@/utils/util-components";

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
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Detalles de la Tarea</DialogTitle>
					</DialogHeader>
					{
						<div className="space-y-4">
							<Label className="text-xs bg-slate-200 p-1 font-medium rounded dark:bg-gray-800 text-gray-700 dark:text-gray-300">
								ID: {selectedTask.id}
							</Label>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
										No.
									</Label>
									<p className="text-xs text-gray-600 dark:text-white">
										{selectedTask.project_task_number}
									</p>
								</div>
								<div>
									<Label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
										Fecha
									</Label>
									<p className="text-xs text-gray-600 dark:text-white">
										{formatDate(selectedTask.created_at)}
									</p>
								</div>
							</div>

							<div>
								<p className="text-lg text-gray-900 dark:text-white font-semibold">
									{selectedTask.title}
								</p>
							</div>

							{selectedTask.description && (
								<div>
									<p className="text-sm text-gray-900 dark:text-white">
										{selectedTask.description}
									</p>
								</div>
							)}

							<div className="grid grid-cols-3 gap-4">
								<div>
									<Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
										Tipo
									</Label>
									<p className="text-sm text-gray-900 dark:text-white">
										{selectedTask.type}
									</p>
								</div>
								<div>
									<Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
										Prioridad
									</Label>
									<p>
										<Badge variant={getPriorityColor(selectedTask.priority)}>
											{selectedTask.priority}
										</Badge>
									</p>
								</div>
								<div>
									<Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
										Estado
									</Label>
									<div className="flex items-center gap-2">
										{getStatusIcon(selectedTask.status)}
										<span className="text-sm text-gray-900 dark:text-white">
											{selectedTask.status}
										</span>
									</div>
								</div>
							</div>

							<div>
								<Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
									Asignado a
								</Label>
								<p className="text-sm text-gray-900 dark:text-white">
									<div className="flex -space-x-2">
										{selectedTask.assignees &&
											(selectedTask.assignees.map((assignee) => (
												<div
													key={assignee.id}
													className="text-xs bg-slate-200 p-1 font-medium rounded dark:bg-gray-800 text-gray-700 dark:text-gray-300"
													title={assignee.name}
												>
													{assignee.name}
												</div>
											)))}
									</div>
								</p>
							</div>

							<div className="flex justify-end gap-2 pt-4">
								<Button
									variant="default"
									disabled={isButtonDisabled}
									onClick={onEditChange}
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
								>
									Eliminar
								</Button>
							</div>
						</div>
					}
				</DialogContent>
			</Dialog>
		</>
	);
};

export default DialogViewTask;

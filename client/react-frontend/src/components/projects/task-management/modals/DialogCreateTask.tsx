import type { FC } from "react";
import { Button } from "@/components/ui/button";
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

type ProjectMember = {
  id: string;
  name: string;
};

const Skeleton: FC = () => {
  return (
    <div className="w-full h-4 bg-slate-300 dark:bg-slate-600 rounded-full animate-pulse" />
  );
};

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
  // IA opcional
  geminiIsLoading?: boolean;
  improvedText?: string;
  handleImprove?: (title: string, description: string) => void;
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
}) => {
  const { config } = useTaskConfig(projectId);

  const typeOptions = config?.types?.map((t) => t.name) ?? ["Tarea"];
  const priorityOptions =
    config?.priorities?.map((p) => p.name) ?? ["Alta", "Media", "Baja"];
  const statusOptions =
    config?.states?.map((s) => s.name) ?? ["Pendiente", "En Progreso", "Completado"];

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
            </div>

            {/* Bloque IA (opcional/oculto de momento) */}
            <div className="border hidden p-4 rounded-lg bg-muted space-y-4">
              <div className="text-sm text-muted-foreground">
                Mejora automática de descripción con IA
              </div>

              <div className="max-h-40 overflow-auto bg-background p-2 rounded">
                {geminiIsLoading ? (
                  <Skeleton />
                ) : (
                  <Textarea readOnly className="min-h-24 text-sm" value={improvedText ?? ""} />
                )}
              </div>

              <Button
                size="sm"
                variant="secondary"
                disabled={geminiIsLoading || !handleImprove}
                onClick={() =>
                  handleImprove?.(editingTask?.title ?? "", editingTask?.description ?? "")
                }
                className="w-full"
              >
                ✨ Mejorar con IA
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <Select
                  value={editingTask.type}
                  onValueChange={(value) => setEditingTask({ ...editingTask, type: value })}
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
                          editingTask?.assignees?.some((a) => a.id === member.id) || false
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
                              assignees: currentAssignees.filter((a) => a.id !== member.id),
                            });
                          }
                        }}
                      >
                        {member.name}
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
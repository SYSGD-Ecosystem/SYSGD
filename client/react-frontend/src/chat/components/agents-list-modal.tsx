"use client";

import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Agent, AgentSupport } from "../../types/Agent";
import { useAgents } from "../hooks/useAgents";
import { 
  Bot, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  Loader2,
  AlertCircle 
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { IoChatboxOutline } from "react-icons/io5";
import { useChat } from "../hooks/useChat";
import useCurrentUser from "@/hooks/connection/useCurrentUser";

interface AgentsListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAgentSelect?: (agent: Agent) => void;
}

export const AgentsListModal: FC<AgentsListModalProps> = ({
  open,
  onOpenChange,
  onAgentSelect,
}) => {
  const { agents, loading, deleteAgent, updateAgent } = useAgents();
  const [deleteAgentId, setDeleteAgentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { createConversation } = useChat()
  const { user } = useCurrentUser()

  const getSupportBadgeColor = (support: AgentSupport) => {
    switch (support) {
      case "text": return "bg-blue-100 text-blue-800";
      case "image": return "bg-green-100 text-green-800";
      case "audio": return "bg-purple-100 text-purple-800";
      case "video": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getSupportIcon = (support: AgentSupport) => {
    switch (support) {
      case "text": return "📝";
      case "image": return "🖼️";
      case "audio": return "🎵";
      case "video": return "🎥";
      default: return "❓";
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    setIsDeleting(true);
    const success = await deleteAgent(agentId);
    if (success) {
      setDeleteAgentId(null);
    }
    setIsDeleting(false);
  };

  const handleToggleAgent = async (agent: Agent) => {
    await updateAgent(agent.id, { is_active: !agent.is_active });
  };

  const handleAgentSelect = (agent: Agent) => {
    onAgentSelect?.(agent);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Gestionar Agentes</DialogTitle>
            <DialogDescription>
              Administra tus agentes de IA. Puedes activar, desactivar, editar o eliminar agentes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Cargando agentes...</span>
              </div>
            ) : agents.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay agentes</h3>
                <p className="text-muted-foreground">
                  Crea tu primer agente para comenzar a usar el sistema.
                </p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Soporte</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agents.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Bot className="h-4 w-4 text-primary" />
                            <div>
                              <div className="font-medium">{agent.name}</div>
                              {agent.description && (
                                <div className="text-sm text-muted-foreground">
                                  {agent.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                            {agent.url}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {agent.support.map((support) => (
                              <Badge
                                key={support}
                                variant="secondary"
                                className={`text-xs ${getSupportBadgeColor(support)}`}
                              >
                                {getSupportIcon(support)} {support}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={agent.is_active ? "default" : "secondary"}
                            className={agent.is_active ? "bg-green-100 text-green-800" : ""}
                          >
                            {agent.is_active ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAgentSelect(agent)}
                              title="Usar agente"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleAgent(agent)}
                              title={agent.is_active ? "Desactivar" : "Activar"}
                            >
                              {agent.is_active ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => createConversation({type:"bot", contactUsername: user?.username,members:[user?.username],title:agent.name})}
                              title="Nuevo chat"
                              className="text-red-600 hover:text-red-700"
                            >
                              <IoChatboxOutline className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteAgentId(agent.id)}
                              title="Eliminar"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteAgentId} onOpenChange={() => setDeleteAgentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar agente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El agente será eliminado permanentemente
              y ya no estará disponible para usar en conversaciones.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAgentId && handleDeleteAgent(deleteAgentId)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

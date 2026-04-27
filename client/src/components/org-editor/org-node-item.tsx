import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import type { OrgNode } from "@/hooks/connection/useOrganizationChart";
import { OrgNodeForm } from "./org-node-form";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface OrgNodeItemProps {
	node: OrgNode;
	onUpdate: (updatedNode: OrgNode) => void;
	onAddChild: (parentId: string, newChild: OrgNode) => void;
	onDelete: (nodeId: string) => void;
	nodeId: string;
	depth?: number;
}

const DEPT_COLORS: Record<string, string> = {
	"Dirección General":
		"bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
	Tecnología:
		"bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
	Desarrollo:
		"bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
	Infraestructura:
		"bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
	Finanzas:
		"bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
	Contabilidad:
		"bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
	Ventas: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
	"Recursos Humanos":
		"bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
	Marketing:
		"bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
	Operaciones:
		"bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
};

export function OrgNodeItem({
	node,
	onUpdate,
	onAddChild,
	onDelete,
	nodeId,
	depth = 0,
}: OrgNodeItemProps) {
	const [isExpanded, setIsExpanded] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [showAddChild, setShowAddChild] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	const hasChildren = node.children && node.children.length > 0;
	const deptColor = DEPT_COLORS[node.department || ""] || "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-300";

	const handleAddChild = (newChild: OrgNode) => {
		onAddChild(nodeId, newChild);
		setShowAddChild(false);
	};

	const handleDelete = () => {
		onDelete(nodeId);
		setShowDeleteConfirm(false);
	};

	return (
		<div className="flex flex-col items-center">
			<div className="relative group">
				<div className="border rounded-lg p-3 bg-card shadow-sm min-w-[200px] max-w-[250px] hover:shadow-md transition-shadow">
					<div className="flex items-start justify-between gap-2">
						<div className="flex-1 min-w-0">
							<p className="font-semibold text-sm truncate">{node.name}</p>
							{node.title && (
								<p className="text-xs text-muted-foreground truncate">
									{node.title}
								</p>
							)}
						</div>
						<div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
							<Button
								variant="ghost"
								size="icon"
								className="h-6 w-6"
								onClick={() => setIsEditing(true)}
								title="Editar"
							>
								<Pencil className="h-3 w-3" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="h-6 w-6"
								onClick={() => setShowAddChild(true)}
								title="Agregar subordinado"
							>
								<Plus className="h-3 w-3" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="h-6 w-6 text-destructive hover:text-destructive"
								onClick={() => setShowDeleteConfirm(true)}
								title="Eliminar"
							>
								<Trash2 className="h-3 w-3" />
							</Button>
						</div>
					</div>
					{node.department && (
						<span
							className={`inline-block mt-2 px-2 py-0.5 rounded text-xs ${deptColor}`}
						>
							{node.department}
						</span>
					)}
					{hasChildren && (
						<Button
							variant="ghost"
							size="sm"
							className="mt-2 w-full text-xs"
							onClick={() => setIsExpanded(!isExpanded)}
						>
							{isExpanded ? (
								<ChevronDown className="h-3 w-3 mr-1" />
							) : (
								<ChevronRight className="h-3 w-3 mr-1" />
							)}
							{node.children?.length} subordinado
							{node.children?.length !== 1 ? "s" : ""}
						</Button>
					)}
				</div>
			</div>

			{hasChildren && isExpanded && (
				<div className="mt-4">
					<div className="flex justify-center space-x-4">
						{node.children?.map((child, index) => (
							<div
								// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
								key={`${nodeId}-${index}`}
								className="flex flex-col items-center"
							>
								{index === 0 && <div className="w-px h-4 bg-border" />}
								<div className="w-px h-4 bg-border" />
								<OrgNodeItem
									node={child}
									onUpdate={onUpdate}
									onAddChild={onAddChild}
									onDelete={onDelete}
									nodeId={`${nodeId}-${index}`}
									depth={depth + 1}
								/>
								{index < (node.children?.length || 0) - 1 && (
									<div className="absolute top-1/2 w-full h-px bg-border -translate-y-1/2" />
								)}
							</div>
						))}
					</div>
				</div>
			)}

			<Dialog open={isEditing} onOpenChange={setIsEditing}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Editar Empleado</DialogTitle>
					</DialogHeader>
					<OrgNodeForm
						node={node}
						onSave={(updated) => {
							onUpdate(updated);
							setIsEditing(false);
						}}
						onCancel={() => setIsEditing(false)}
					/>
				</DialogContent>
			</Dialog>

			<Dialog open={showAddChild} onOpenChange={setShowAddChild}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Agregar Subordinado</DialogTitle>
					</DialogHeader>
					<OrgNodeForm
						node={{ name: "", title: "", department: "", children: [] }}
						onSave={handleAddChild}
						onCancel={() => setShowAddChild(false)}
					/>
				</DialogContent>
			</Dialog>

			<Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Confirmar Eliminación</DialogTitle>
					</DialogHeader>
					<p className="text-sm text-muted-foreground">
						¿Está seguro de eliminar a{" "}
						<strong className="text-foreground">{node.name}</strong>
						{hasChildren ? " y todos sus subordinados" : ""}? Esta acción no se
						puede deshacer.
					</p>
					<div className="flex justify-end space-x-2 pt-4">
						<Button
							variant="secondary"
							onClick={() => setShowDeleteConfirm(false)}
						>
							Cancelar
						</Button>
						<Button variant="destructive" onClick={handleDelete}>
							Eliminar
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

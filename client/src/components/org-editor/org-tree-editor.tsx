import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RotateCcw, Save } from "lucide-react";
import type { OrgNode } from "@/hooks/connection/useOrganizationChart";
import { OrgNodeItem } from "./org-node-item";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { OrgNodeForm } from "./org-node-form";

interface OrgTreeEditorProps {
	initialData: OrgNode | null;
	onSave: (tree: OrgNode) => Promise<void>;
}

export function OrgTreeEditor({ initialData, onSave }: OrgTreeEditorProps) {
	const [tree, setTree] = useState<OrgNode | null>(initialData ?? null);
	const [isSaving, setIsSaving] = useState(false);
	const [showAddRoot, setShowAddRoot] = useState(false);

	const handleAddChild = useCallback(
		(parentId: string, newChild: OrgNode) => {
			const addToParent = (node: OrgNode): OrgNode => {
				if (parentId === "root") {
					return {
						...node,
						children: [...(node.children || []), newChild],
					};
				}

				const parts = parentId.split("-").filter(Boolean);
				if (parts.length === 0) {
					return {
						...node,
						children: [...(node.children || []), newChild],
					};
				}

				return {
					...node,
					children: node.children?.map((child, idx) => {
						const childId = `root-${idx}`;
						if (parentId.startsWith(childId)) {
							return addToParent(child);
						}
						return child;
					}),
				};
			};

			if (tree) {
				setTree(addToParent(tree));
			} else {
				setTree(newChild);
			}
		},
		[tree],
	);

	const handleDeleteNode = useCallback(
		(nodeId: string) => {
			const deleteFromTree = (node: OrgNode): OrgNode => {
				if (nodeId === "root") {
					return { name: "", title: "", department: "", children: [] };
				}

				const parts = nodeId.split("-").filter(Boolean);
				if (parts.length === 1) {
					return {
						...node,
						children: node.children?.filter((_, idx) => idx !== parseInt(parts[0], 10)),
					};
				}

				return {
					...node,
					children: node.children?.map((child, idx) => {
						if (idx === parseInt(parts[0], 10)) {
							return deleteFromTree({ ...child, children: child.children });
						}
						return child;
					}),
				};
			};

			if (tree) {
				setTree(deleteFromTree(tree));
			}
		},
		[tree],
	);

	const handleSave = async () => {
		if (!tree) return;
		setIsSaving(true);
		try {
			await onSave(tree);
		} finally {
			setIsSaving(false);
		}
	};

	const handleAddRootNode = (newNode: OrgNode) => {
		if (tree) {
			setTree({ ...tree, children: [...(tree.children || []), newNode] });
		} else {
			setTree(newNode);
		}
		setShowAddRoot(false);
	};

	const handleReset = () => {
		setTree(initialData ?? null);
	};

	return (
		<div className="flex flex-col h-full">
			<div className="flex items-center justify-between pb-4 border-b">
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowAddRoot(true)}
					>
						<Plus className="h-4 w-4 mr-2" />
						Agregar Empleado
					</Button>
					<Button variant="outline" size="sm" onClick={handleReset}>
						<RotateCcw className="h-4 w-4 mr-2" />
						Restaurar
					</Button>
				</div>
				<Button size="sm" onClick={handleSave} disabled={isSaving}>
					<Save className="h-4 w-4 mr-2" />
					{isSaving ? "Guardando..." : "Guardar Cambios"}
				</Button>
			</div>

			<div className="flex-1 overflow-auto p-4">
				{tree ? (
					<div className="flex justify-center">
						<OrgNodeItem
							node={tree}
							onUpdate={(updated) => setTree(updated)}
							onAddChild={handleAddChild}
							onDelete={handleDeleteNode}
							nodeId="root"
						/>
					</div>
				) : (
					<div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
						<p>No hay organigrama configurado.</p>
						<Button
							variant="outline"
							className="mt-4"
							onClick={() => setShowAddRoot(true)}
						>
							<Plus className="h-4 w-4 mr-2" />
							Crear Primer Empleado
						</Button>
					</div>
				)}
			</div>

			<Dialog open={showAddRoot} onOpenChange={setShowAddRoot}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Agregar Empleado</DialogTitle>
					</DialogHeader>
					<OrgNodeForm
						node={{ name: "", title: "", department: "", children: [] }}
						onSave={handleAddRootNode}
						onCancel={() => setShowAddRoot(false)}
					/>
				</DialogContent>
			</Dialog>
		</div>
	);
}

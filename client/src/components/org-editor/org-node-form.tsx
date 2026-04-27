import { useState, useEffect, useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { OrgNode } from "@/hooks/connection/useOrganizationChart";

interface OrgNodeFormProps {
	node: OrgNode;
	onSave: (node: OrgNode) => void;
	onCancel: () => void;
}

const DEPARTMENTS = [
	"Dirección General",
	"Tecnología",
	"Desarrollo",
	"Infraestructura",
	"Finanzas",
	"Contabilidad",
	"Ventas",
	"Recursos Humanos",
	"Marketing",
	"Operaciones",
	"Otro",
];

export function OrgNodeForm({ node, onSave, onCancel }: OrgNodeFormProps) {
	const [formData, setFormData] = useState<OrgNode>({
		name: node.name || "",
		title: node.title || "",
		department: node.department || "",
		children: node.children || [],
	});
	const id = useId();

	useEffect(() => {
		setFormData({
			name: node.name || "",
			title: node.title || "",
			department: node.department || "",
			children: node.children || [],
		});
	}, [node]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!formData.name.trim()) return;
		onSave(formData);
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor={`${id}-name`}>Nombre *</Label>
				<Input
					id={`${id}-name`}
					value={formData.name}
					onChange={(e) => setFormData({ ...formData, name: e.target.value })}
					placeholder="Nombre del empleado"
					required
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor={`${id}-title`}>Puesto / Cargo</Label>
				<Input
					id={`${id}-title`}
					value={formData.title}
					onChange={(e) => setFormData({ ...formData, title: e.target.value })}
					placeholder="Gerente, Director, Desarrollador..."
				/>
			</div>
			<div className="space-y-2">
				<Label htmlFor={`${id}-department`}>Departamento</Label>
				<select
					id={`${id}-department`}
					value={formData.department}
					onChange={(e) =>
						setFormData({ ...formData, department: e.target.value })
					}
					className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
				>
					<option value="">Seleccionar departamento...</option>
					{DEPARTMENTS.map((dept) => (
						<option key={dept} value={dept}>
							{dept}
						</option>
					))}
				</select>
			</div>
			<div className="flex justify-end space-x-2 pt-4">
				<Button type="button" variant="secondary" onClick={onCancel}>
					Cancelar
				</Button>
				<Button type="submit">Guardar</Button>
			</div>
		</form>
	);
}

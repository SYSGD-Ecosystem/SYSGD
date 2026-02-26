import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Code } from "lucide-react";
import type { OrgNode } from "@/hooks/connection/useOrganizationChart";
import { OrgTreeEditor } from "./org-editor/org-tree-editor";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

interface Props {
	open: boolean;
	onOpenChange: (o: boolean) => void;
	initialData: OrgNode | null;
	onSave: (tree: OrgNode) => Promise<void>;
}

export function OrganizationEditorDialog({
	open,
	onOpenChange,
	initialData,
	onSave,
}: Props) {
	const [json, setJson] = useState<string>(() =>
		JSON.stringify(initialData ?? {}, null, 2),
	);
	const [error, setError] = useState<string | null>(null);

	const handleSaveJson = async () => {
		try {
			const parsed = JSON.parse(json);
			await onSave(parsed);
			onOpenChange(false);
		} catch (e: unknown) {
			setError(e instanceof Error ? e.message : "Error al parsear JSON");
		}
	};

	const handleTabChange = (value: string) => {
		if (value === "json") {
			setJson(JSON.stringify(initialData ?? {}, null, 2));
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-4xl max-h-[90vh]">
				<DialogHeader>
					<DialogTitle>Editar Organigrama</DialogTitle>
				</DialogHeader>
				<Tabs
					defaultValue="visual"
					onValueChange={handleTabChange}
					className="w-full"
				>
					<TabsList className="mb-4">
						<TabsTrigger value="visual">Editor Visual</TabsTrigger>
						<TabsTrigger value="json">
							<Code className="h-4 w-4 mr-2" />
							JSON
						</TabsTrigger>
					</TabsList>
					<TabsContent value="visual" className="max-h-[60vh] overflow-hidden">
						<OrgTreeEditor initialData={initialData} onSave={onSave} />
					</TabsContent>
					<TabsContent value="json">
						<Textarea
							value={json}
							onChange={(e) => setJson(e.target.value)}
							className="min-h-[300px] font-mono text-sm"
						/>
						{error && <p className="text-destructive text-sm mt-2">{error}</p>}
						<div className="flex justify-end space-x-2 pt-4">
							<Button variant="secondary" onClick={() => onOpenChange(false)}>
								Cancelar
							</Button>
							<Button onClick={handleSaveJson}>Guardar</Button>
						</div>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}

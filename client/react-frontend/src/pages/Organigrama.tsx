import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, Download, Maximize2, Pencil } from "lucide-react";
import { useState } from "react";
import { OrganizationEditorDialog } from "../components/organization-editor-dialog";
import { useOrganizationChart } from "../hooks/connection/useOrganizationChart";
import { OrganigramaTree } from "../components/organigrama-tree";
import type { Employee } from "@/types/organigrama";
// Remove static data, will fetch from backend

export default function OrganigramaPage() {
	const [isFullscreen, setIsFullscreen] = useState(false);
	const fileId = "1"; // TODO: obtener id real vía prop o ruta
	const {
		data: organizationData,
		loading,
		refetch,
		save,
	} = useOrganizationChart(fileId);
	const [editorOpen, setEditorOpen] = useState(false);

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const countEmployees = (employee: any): number => {
		let count = 1;
		if (employee.children) {
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			// biome-ignore lint/complexity/noForEach: <explanation>
			employee.children.forEach((child: any) => {
				count += countEmployees(child);
			});
		}
		return count;
	};

	const totalEmployees = organizationData
		? countEmployees(organizationData)
		: 0;

	const toggleFullscreen = () => {
		setIsFullscreen(!isFullscreen);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<Card className="mb-8 shadow-lg">
					<CardHeader>
						<div className="flex items-center justify-between">
							<div className="flex items-center space-x-4">
								<div className="p-3 bg-primary/10 rounded-lg">
									<Building2 className="h-8 w-8 text-primary" />
								</div>
								<div>
									<CardTitle className="text-2xl font-bold">
										Organigrama Empresarial
									</CardTitle>
									<p className="text-muted-foreground">
										Estructura organizacional de la empresa
									</p>
								</div>
							</div>
							<div className="flex items-center space-x-4">
								<div className="flex items-center space-x-2">
									<Users className="h-4 w-4 text-muted-foreground" />
									<Badge variant="secondary" className="text-sm">
										{totalEmployees} empleados
									</Badge>
								</div>
								<Button variant="outline" size="sm" onClick={toggleFullscreen}>
									<Maximize2 className="h-4 w-4 mr-2" />
									{isFullscreen ? "Vista normal" : "Pantalla completa"}
								</Button>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setEditorOpen(true)}
								>
									<Pencil className="h-4 w-4 mr-2" />
									Editar
								</Button>
								<Button variant="outline" size="sm">
									<Download className="h-4 w-4 mr-2" />
									Exportar
								</Button>
							</div>
						</div>
					</CardHeader>
				</Card>

				{/* Organigrama */}
				<Card
					className={`shadow-lg ${isFullscreen ? "fixed inset-4 z-50" : ""}`}
				>
					<CardContent
						className={`${isFullscreen ? "h-full overflow-auto" : "p-8"}`}
					>
						<div className="flex justify-center">
							<div className="overflow-x-auto w-full">
								<div className="min-w-max px-4 py-8">
									{organizationData && (
										<OrganigramaTree employee={organizationData as Employee} />
									)}
									{!loading && !organizationData && (
										<p className="text-muted-foreground">
											No hay datos de organigrama.
										</p>
									)}
									{loading && (
										<p className="text-muted-foreground">Cargando...</p>
									)}
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Leyenda */}
				<Card className="mt-8 shadow-lg">
					<CardHeader>
						<CardTitle className="text-lg">Leyenda de Departamentos</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
							{[
								{
									name: "Dirección General",
									color:
										"bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
								},
								{
									name: "Tecnología",
									color:
										"bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
								},
								{
									name: "Desarrollo",
									color:
										"bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
								},
								{
									name: "Infraestructura",
									color:
										"bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
								},
								{
									name: "Finanzas",
									color:
										"bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
								},
								{
									name: "Contabilidad",
									color:
										"bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
								},
								{
									name: "Ventas",
									color:
										"bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
								},
							].map((dept) => (
								<Badge
									key={dept.name}
									className={`${dept.color} justify-center`}
								>
									{dept.name}
								</Badge>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
			<OrganizationEditorDialog
				open={editorOpen}
				onOpenChange={(o) => setEditorOpen(o)}
				initialData={organizationData}
				onSave={async (tree) => {
					await save(tree);
					refetch();
				}}
			/>
		</div>
	);
}

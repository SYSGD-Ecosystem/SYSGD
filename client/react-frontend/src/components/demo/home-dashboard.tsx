"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Search,
	FolderPlus,
	FileText,
	Users,
	Calendar,
	Activity,
	MoreVertical,
	Edit,
	Eye,
	Folder,
	File,
} from "lucide-react";

interface Project {
	id: string;
	nombre: string;
	descripcion: string;
	progreso: number;
	miembros: number;
	ultimaActividad: string;
	fechaCreacion: string;
	estado: "Activo" | "Pausado" | "Completado";
	tipo: "project";
}

interface DocumentFile {
	id: string;
	nombre: string;
	tipo_doc:
		| "Registro de Entrada"
		| "Registro de Salida"
		| "Tabla de Retención"
		| "Cuadro de Clasificación";
	creador: string;
	fechaCreacion: string;
	ultimaModificacion: string;
	tamaño: string;
	estado: "Borrador" | "Revisión" | "Aprobado";
	tipo: "document";
}

type DashboardItem = Project | DocumentFile;

export function HomeDashboard({
	onProjectSelect,
}: { onProjectSelect: (projectId: string) => void }) {
	const [projects] = useState<Project[]>([
		{
			id: "sysgd",
			nombre: "Sistema de Gestión Documental",
			descripcion:
				"Plataforma completa para la gestión de documentos y procesos administrativos",
			progreso: 75,
			miembros: 4,
			ultimaActividad: "Hace 2 horas",
			fechaCreacion: "01/01/2024",
			estado: "Activo",
			tipo: "project",
		},
		{
			id: "ecommerce",
			nombre: "Plataforma E-commerce",
			descripcion: "Tienda online con sistema de pagos y gestión de inventario",
			progreso: 45,
			miembros: 6,
			ultimaActividad: "Hace 1 día",
			fechaCreacion: "15/02/2024",
			estado: "Activo",
			tipo: "project",
		},
		{
			id: "mobile-app",
			nombre: "Aplicación Móvil",
			descripcion:
				"App nativa para iOS y Android con sincronización en tiempo real",
			progreso: 30,
			miembros: 3,
			ultimaActividad: "Hace 3 días",
			fechaCreacion: "01/03/2024",
			estado: "Pausado",
			tipo: "project",
		},
		{
			id: "dashboard",
			nombre: "Dashboard Analytics",
			descripcion: "Panel de control con métricas y reportes avanzados",
			progreso: 90,
			miembros: 2,
			ultimaActividad: "Hace 5 horas",
			fechaCreacion: "10/04/2024",
			estado: "Completado",
			tipo: "project",
		},
	]);

	const [documents] = useState<DocumentFile[]>([
		{
			id: "doc1",
			nombre: "Registro de Entrada - Julio 2025",
			tipo_doc: "Registro de Entrada",
			creador: "Lazaro Yunier",
			fechaCreacion: "01/07/2025",
			ultimaModificacion: "05/07/2025",
			tamaño: "2.4 MB",
			estado: "Aprobado",
			tipo: "document",
		},
		{
			id: "doc2",
			nombre: "Tabla de Retención Documental",
			tipo_doc: "Tabla de Retención",
			creador: "María Elena",
			fechaCreacion: "15/06/2025",
			ultimaModificacion: "02/07/2025",
			tamaño: "1.8 MB",
			estado: "Revisión",
			tipo: "document",
		},
		{
			id: "doc3",
			nombre: "Cuadro de Clasificación General",
			tipo_doc: "Cuadro de Clasificación",
			creador: "Carlos Rodríguez",
			fechaCreacion: "20/05/2025",
			ultimaModificacion: "01/07/2025",
			tamaño: "3.2 MB",
			estado: "Aprobado",
			tipo: "document",
		},
		{
			id: "doc4",
			nombre: "Registro de Salida - Junio 2025",
			tipo_doc: "Registro de Salida",
			creador: "Yamila García",
			fechaCreacion: "30/06/2025",
			ultimaModificacion: "04/07/2025",
			tamaño: "1.5 MB",
			estado: "Borrador",
			tipo: "document",
		},
	]);

	const [searchTerm, setSearchTerm] = useState("");
	const [filterType, setFilterType] = useState<
		"all" | "projects" | "documents"
	>("all");
	const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
	const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
	const [newProject, setNewProject] = useState({
		nombre: "",
		descripcion: "",
		miembros: [] as string[],
	});
	const [newDocument, setNewDocument] = useState({
		nombre: "",
		tipo: "Registro de Entrada" as DocumentFile["tipo_doc"],
		descripcion: "",
	});

	const allItems: DashboardItem[] = [...projects, ...documents];

	const filteredItems = allItems.filter((item) => {
		const matchesSearch = item.nombre
			.toLowerCase()
			.includes(searchTerm.toLowerCase());
		const matchesFilter =
			filterType === "all" ||
			(filterType === "projects" && item.tipo === "project") ||
			(filterType === "documents" && item.tipo === "document");
		return matchesSearch && matchesFilter;
	});

	const getStatusColor = (status: string) => {
		switch (status) {
			case "Activo":
			case "Aprobado":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
			case "Pausado":
			case "Revisión":
				return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
			case "Completado":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
			case "Borrador":
				return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
		}
	};

	const handleCreateProject = () => {
		// Aquí se crearía el proyecto
		console.log("Crear proyecto:", newProject);
		setIsProjectDialogOpen(false);
		setNewProject({ nombre: "", descripcion: "", miembros: [] });
	};

	const handleCreateDocument = () => {
		// Aquí se crearía el documento
		console.log("Crear documento:", newDocument);
		setIsDocumentDialogOpen(false);
		setNewDocument({
			nombre: "",
			tipo: "Registro de Entrada",
			descripcion: "",
		});
	};

	return (
		<div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-6">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
						Bienvenido de vuelta, Lazaro
					</h1>
					<p className="text-lg text-gray-600 dark:text-gray-400">
						Gestiona tus proyectos y archivos desde un solo lugar
					</p>
				</div>

				{/* Toolbar */}
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
					<div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
						<div className="relative">
							<Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
							<Input
								placeholder="Buscar proyectos y archivos..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10 w-full sm:w-80"
							/>
						</div>
						<Select
							value={filterType}
							// biome-ignore lint/suspicious/noExplicitAny: <explanation>
							onValueChange={(value: any) => setFilterType(value)}
						>
							<SelectTrigger className="w-full sm:w-48">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Todos los elementos</SelectItem>
								<SelectItem value="projects">Solo proyectos</SelectItem>
								<SelectItem value="documents">Solo documentos</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="flex gap-2 w-full md:w-auto">
						<Button
							onClick={() => setIsProjectDialogOpen(true)}
							className="flex-1 md:flex-none"
						>
							<FolderPlus className="w-4 h-4 mr-2" />
							Nuevo Proyecto
						</Button>
						<Button
							variant="outline"
							onClick={() => setIsDocumentDialogOpen(true)}
							className="flex-1 md:flex-none"
						>
							<FileText className="w-4 h-4 mr-2" />
							Nuevo Archivo
						</Button>
					</div>
				</div>

				{/* Stats */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
					<Card className="dark:bg-gray-800 dark:border-gray-700">
						<CardContent className="p-4">
							<div className="flex items-center gap-2">
								<Folder className="w-5 h-5 text-blue-600" />
								<div>
									<p className="text-2xl font-bold text-gray-900 dark:text-white">
										{projects.length}
									</p>
									<p className="text-sm text-gray-600 dark:text-gray-400">
										Proyectos
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card className="dark:bg-gray-800 dark:border-gray-700">
						<CardContent className="p-4">
							<div className="flex items-center gap-2">
								<File className="w-5 h-5 text-green-600" />
								<div>
									<p className="text-2xl font-bold text-gray-900 dark:text-white">
										{documents.length}
									</p>
									<p className="text-sm text-gray-600 dark:text-gray-400">
										Documentos
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card className="dark:bg-gray-800 dark:border-gray-700">
						<CardContent className="p-4">
							<div className="flex items-center gap-2">
								<Activity className="w-5 h-5 text-orange-600" />
								<div>
									<p className="text-2xl font-bold text-gray-900 dark:text-white">
										{projects.filter((p) => p.estado === "Activo").length}
									</p>
									<p className="text-sm text-gray-600 dark:text-gray-400">
										Activos
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
					<Card className="dark:bg-gray-800 dark:border-gray-700">
						<CardContent className="p-4">
							<div className="flex items-center gap-2">
								<Users className="w-5 h-5 text-purple-600" />
								<div>
									<p className="text-2xl font-bold text-gray-900 dark:text-white">
										{projects.reduce((acc, p) => acc + p.miembros, 0)}
									</p>
									<p className="text-sm text-gray-600 dark:text-gray-400">
										Colaboradores
									</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Items Grid */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{filteredItems.map((item) => (
						<Card
							key={item.id}
							className="hover:shadow-lg transition-shadow cursor-pointer dark:bg-gray-800 dark:border-gray-700"
							onClick={() => {
								if (item.tipo === "project") {
									onProjectSelect(item.id);
								}
							}}
						>
							<CardHeader className="pb-3">
								<div className="flex items-start justify-between">
									<div className="flex items-center gap-2">
										{item.tipo === "project" ? (
											<Folder className="w-5 h-5 text-blue-600" />
										) : (
											<FileText className="w-5 h-5 text-green-600" />
										)}
										<CardTitle className="text-base font-medium text-gray-900 dark:text-white line-clamp-1">
											{item.nombre}
										</CardTitle>
									</div>
									<Button variant="ghost" size="sm">
										<MoreVertical className="w-4 h-4" />
									</Button>
								</div>
								<Badge
									className={`w-fit ${getStatusColor(item.tipo === "project" ? item.estado : item.estado)}`}
								>
									{item.tipo === "project" ? item.estado : item.estado}
								</Badge>
							</CardHeader>
							<CardContent className="space-y-3">
								{item.tipo === "project" ? (
									<>
										<p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
											{item.descripcion}
										</p>
										<div className="space-y-2">
											<div className="flex justify-between text-sm">
												<span className="text-gray-600 dark:text-gray-400">
													Progreso
												</span>
												<span className="font-medium text-gray-900 dark:text-white">
													{item.progreso}%
												</span>
											</div>
											<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
												<div
													className="bg-blue-600 h-2 rounded-full transition-all"
													style={{ width: `${item.progreso}%` }}
												/>
											</div>
										</div>
										<div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
											<div className="flex items-center gap-1">
												<Users className="w-3 h-3" />
												{item.miembros} miembros
											</div>
											<div className="flex items-center gap-1">
												<Activity className="w-3 h-3" />
												{item.ultimaActividad}
											</div>
										</div>
									</>
								) : (
									<>
										<div className="space-y-2 text-sm">
											<div className="flex justify-between">
												<span className="text-gray-600 dark:text-gray-400">
													Tipo:
												</span>
												<span className="font-medium text-gray-900 dark:text-white">
													{item.tipo}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-gray-600 dark:text-gray-400">
													Creador:
												</span>
												<span className="font-medium text-gray-900 dark:text-white">
													{item.creador}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-gray-600 dark:text-gray-400">
													Tamaño:
												</span>
												<span className="font-medium text-gray-900 dark:text-white">
													{item.tamaño}
												</span>
											</div>
										</div>
										<div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
											<div className="flex items-center gap-1">
												<Calendar className="w-3 h-3" />
												Creado: {item.fechaCreacion}
											</div>
										</div>
										<div className="text-xs text-gray-500 dark:text-gray-400">
											Modificado: {item.ultimaModificacion}
										</div>
									</>
								)}

								<div className="flex gap-2 pt-2">
									<Button variant="ghost" size="sm" className="flex-1">
										<Eye className="w-3 h-3 mr-1" />
										Ver
									</Button>
									<Button variant="ghost" size="sm" className="flex-1">
										<Edit className="w-3 h-3 mr-1" />
										Editar
									</Button>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{filteredItems.length === 0 && (
					<div className="text-center py-12">
						<div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
							<Search className="w-8 h-8 text-gray-400" />
						</div>
						<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
							No se encontraron elementos
						</h3>
						<p className="text-gray-600 dark:text-gray-400">
							Intenta cambiar los filtros o crear un nuevo proyecto o documento.
						</p>
					</div>
				)}
			</div>

			{/* Dialog para crear proyecto */}
			<Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
				<DialogContent className="max-w-md mx-4 dark:bg-gray-800 dark:border-gray-700">
					<DialogHeader>
						<DialogTitle className="text-gray-900 dark:text-white">
							Crear Nuevo Proyecto
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
							<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
								Nombre del proyecto
							</label>
							<Input
								value={newProject.nombre}
								onChange={(e) =>
									setNewProject({ ...newProject, nombre: e.target.value })
								}
								placeholder="Ej: Sistema de Inventario"
								className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
							/>
						</div>
						<div>
							{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
							<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
								Descripción
							</label>
							<Textarea
								value={newProject.descripcion}
								onChange={(e) =>
									setNewProject({ ...newProject, descripcion: e.target.value })
								}
								placeholder="Describe brevemente el proyecto..."
								rows={3}
								className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
							/>
						</div>
						<div className="flex justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => setIsProjectDialogOpen(false)}
							>
								Cancelar
							</Button>
							<Button onClick={handleCreateProject}>Crear Proyecto</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Dialog para crear documento */}
			<Dialog
				open={isDocumentDialogOpen}
				onOpenChange={setIsDocumentDialogOpen}
			>
				<DialogContent className="max-w-md mx-4 dark:bg-gray-800 dark:border-gray-700">
					<DialogHeader>
						<DialogTitle className="text-gray-900 dark:text-white">
							Crear Nuevo Archivo de Gestión
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
							<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
								Nombre del archivo
							</label>
							<Input
								value={newDocument.nombre}
								onChange={(e) =>
									setNewDocument({ ...newDocument, nombre: e.target.value })
								}
								placeholder="Ej: Registro de Entrada - Agosto 2025"
								className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
							/>
						</div>
						<div>
							{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
							<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
								Tipo de documento
							</label>
							<Select
								value={newDocument.tipo}
								onValueChange={(value: DocumentFile["tipo_doc"]) =>
									setNewDocument({ ...newDocument, tipo: value })
								}
							>
								<SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
									<SelectValue />
								</SelectTrigger>
								<SelectContent className="dark:bg-gray-800 dark:border-gray-600">
									<SelectItem value="Registro de Entrada">
										Registro de Entrada
									</SelectItem>
									<SelectItem value="Registro de Salida">
										Registro de Salida
									</SelectItem>
									<SelectItem value="Tabla de Retención">
										Tabla de Retención
									</SelectItem>
									<SelectItem value="Cuadro de Clasificación">
										Cuadro de Clasificación
									</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
							<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
								Descripción
							</label>
							<Textarea
								value={newDocument.descripcion}
								onChange={(e) =>
									setNewDocument({
										...newDocument,
										descripcion: e.target.value,
									})
								}
								placeholder="Describe el propósito del documento..."
								rows={3}
								className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
							/>
						</div>
						<div className="flex justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => setIsDocumentDialogOpen(false)}
							>
								Cancelar
							</Button>
							<Button onClick={handleCreateDocument}>Crear Archivo</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}

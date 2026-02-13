import {
	Activity,
	Calendar,
	Edit,
	Eye,
	File,
	FileText,
	Folder,
	FolderPlus,
	MoreVertical,
	Search,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import useArchives from "@/hooks/connection/useArchives";
import useConnection from "@/hooks/connection/useConnection";
import useCurrentUser from "@/hooks/connection/useCurrentUser";
import useProjectConnection from "@/hooks/connection/useProjectConnection";
import useProjects from "@/hooks/connection/useProjects";
import { useToast } from "@/hooks/use-toast";
import { useSelectionStore } from "@/store/selection";
import { useArchiveStore } from "@/store/useArchiveStore";
import { formatDate } from "@/utils/util";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";

interface DocumentFile {
	id: string;
	name: string;
	company: string;
	code: string;
	tipo: "document";
	creator_name: string;
	created_at: string;
}

interface Project {
	id: string;
	name: string;
	description?: string;
	created_by?: string;
	created_at?: string;
	status?: string;
	visibility?: string;
	tipo: "project";

	members_count: number;
	total_tasks: number;
	completed_tasks: number;
}

type DashboardItem = Project | DocumentFile;

export function HomeDashboard() {
	const [projects, setProjects] = useState<Project[]>([]);
	const { projects: mProjects, reloadProjects } = useProjects();
	const { handleCreateProject } = useProjectConnection();
	const navigate = useNavigate();
	const { user, loading: loadingUser } = useCurrentUser();

	const setProjectId = useSelectionStore((state) => state.setProjectId);
	const setArchive = useArchiveStore((state) => state.selectArchive);

	useEffect(() => {
		const projt: Project[] = mProjects.map(
			(item: {
				id: string;
				name: string;
				description?: string;
				created_by?: string;
				created_at?: string;
				status?: string;
				visibility?: string;
				tipo: "project";

				members_count: number;
				total_tasks: number;
				completed_tasks: number;
			}) => ({
				id: item.id,
				name: item.name,
				description: item.description,
				create_by: item.created_by,
				create_at: item.created_at,
				status: item.status,
				visibility: "private",
				tipo: "project",
				members_count: item.members_count,
				total_tasks: item.total_tasks,
				completed_tasks: item.completed_tasks,
			}),
		);

		if (projt !== null) {
			console.log(projt);
			setProjects(projt);
		}
	}, [mProjects]);

	const { archives } = useArchives();
	const [documents, setDocument] = useState<DocumentFile[]>([]);
	const { toast } = useToast();

	useEffect(() => {
		const docs: DocumentFile[] = archives.map(
			(archive: {
				id: string;
				name: string;
				company: string;
				code: string;
				creator_name: string;
				created_at: string;
			}) => ({
				id: archive.id,
				name: archive.name,
				company: archive.company,
				code: archive.code,
				creator_name: archive.creator_name,
				created_at: archive.created_at,
				tipo: "document",
			}),
		);

		if (docs !== null) {
			console.log(docs);
			setDocument(docs);
		}
	}, [archives]);

	const [searchTerm, setSearchTerm] = useState("");
	const [filterType, setFilterType] = useState<
		"all" | "projects" | "documents"
	>("all");

	const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
	const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);

	const [newProject, setNewProject] = useState({
		name: "",
		desciption: "",
	});

	const [newDocument, setNewDocument] = useState({
		name: "",
		company: "",
		code: "",
	});

	const allItems: DashboardItem[] = [...projects, ...documents];

	const filteredItems = allItems.filter((item) => {
		const matchesSearch = item.name
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
			case "activo":
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

	const createProject = () => {
		// Aquí se crearía el proyecto
		console.log("Crear proyecto:", newProject);
		setIsProjectDialogOpen(false);
		handleCreateProject(
			newProject.name,
			newProject.desciption,
			(project) => {
				if (project?.id) {
					const createdProject: Project = {
						id: project.id,
						name: project.name,
						description: project.description,
						created_by: project.created_by,
						created_at: project.created_at,
						status: project.status,
						visibility: project.visibility,
						tipo: "project",
						members_count: 0,
						total_tasks: 0,
						completed_tasks: 0,
					};

					setProjects((prev) => [
						createdProject,
						...prev,
					]);
				}

				setNewProject({ name: "", desciption: "" });
				void reloadProjects();
				toast({
					title: "Exito",
					description: "Proyecto creado correctamente",
				});
			},
			() => {
				toast({
					title: "Error",
					description:
						"No se creó el proyecto, por favor, verifique su conexión o conecte con soporte",
					variant: "destructive",
				});
			},
		);
	};

	const { handleNewArchiving } = useConnection();
	const handleCreateDocument = () => {
		// Aquí se crearía el documento
		console.log("Crear documento:", newDocument);
		handleNewArchiving(
			newDocument.code,
			newDocument.company,
			newDocument.name,
			() => {
				toast({
					title: "Exito",
					description: "Archivo creado, por favor refresque la página",
				});
			},
			() => {
				toast({
					title: "Error",
					description:
						"No se creó el archivo de gestion, por favor, verifique su conexión o conecte con soporte",
					variant: "destructive",
				});
			},
		);
		setIsDocumentDialogOpen(false);
	};

	const getProgress = (completed: number, total: number) => {
		if (total <= 0) {
			return 0; // Evita la división por cero
		}

		if (completed <= 0) {
			return 0;
		}

		return Math.round((completed / total) * 100);
	};
	return (
		<div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-6">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
						Bienvenido de vuelta, {loadingUser ? "" : user?.name}
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
										{projects.filter((p) => p.status === "Activo").length}
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
										{/*projects.reduce((acc, p) => acc + p.miembros, 0)*/}
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
							className="hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700"
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
											{item.name}
										</CardTitle>
									</div>
									<Button variant="ghost" disabled size="sm">
										<MoreVertical className="w-4 h-4" />
									</Button>
								</div>
								<Badge
									className={`w-fit ${getStatusColor(item.tipo === "project" ? (item.status ?? "") : "Completado")}`}
								>
									{item.tipo === "project" ? item.status : "EGDyA"}
								</Badge>
							</CardHeader>

							<CardContent className="space-y-3 flex flex-col">
								{item.tipo === "project" ? (
									<>
										<div className="h-full">
											<p className="text-sm h-full text-gray-600 dark:text-gray-400 line-clamp-2 ">
												{item.description}
											</p>
										</div>

										<div className="space-y-2">
											<div className="flex justify-between text-sm">
												<span className="text-gray-600 dark:text-gray-400">
													Progreso
												</span>
												<span className="font-medium text-gray-900 dark:text-white">
													{getProgress(item.completed_tasks, item.total_tasks)}%
												</span>
											</div>
											<Progress
												value={getProgress(
													item.completed_tasks,
													item.total_tasks,
												)}
												max={item.total_tasks}
											/>
											{/* <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
												<div
													className="bg-blue-600 h-2 rounded-full transition-all"
													style={{
														width: `${getProgress(item.completed_tasks, item.total_tasks)}%`,
													}}
												/>
											</div> */}
										</div>
										<div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
											<div className="flex items-center gap-1">
												<Users className="w-3 h-3" />
												{item.members_count} miembros
											</div>
											{/* <div className="flex items-center gap-1">
												<Activity className="w-3 h-3" />
												 {item.ultimaActividad}
											</div> */}
										</div>
									</>
								) : (
									<>
										<div className="space-y-2 text-sm">
											<div className="flex justify-between">
												<span className="text-gray-600 dark:text-gray-400">
													Empresa:
												</span>
												<span className="font-medium line-clamp-1 text-gray-900 dark:text-white">
													{item.company}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-gray-600 dark:text-gray-400">
													Creador
												</span>
												<span className="font-medium line-clamp-1 text-right text-gray-900 dark:text-white">
													{item.creator_name}
												</span>
											</div>
											<div className="flex justify-between">
												<span className="text-gray-600 dark:text-gray-400">
													Código:
												</span>
												<span className="font-medium text-gray-900 dark:text-white">
													{item.code}
												</span>
											</div>
										</div>
										<div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
											<div className="flex items-center gap-1">
												<Calendar className="w-3 h-3" />
												Creado el {formatDate(item.created_at)}
											</div>
										</div>
										{/* <div className="text-xs text-gray-500 dark:text-gray-400">
											Modificado: ""
										</div> */}
									</>
								)}

								<div className="flex gap-2 pt-2">
									<Button
										onClick={() => {
											if (item.tipo === "project") {
												setProjectId(item.id);
												navigate("/projects");
											} else {
												setArchive(item.id, {
													name: item.name,
													company: item.company,
													code: item.code,
												});
												navigate("/archives");
											}
										}}
										variant="ghost"
										size="sm"
										className="flex-1 cursor-pointer"
									>
										<Eye className="w-3 h-3 mr-1" />
										Ver
									</Button>
									<Button
										disabled
										variant="ghost"
										size="sm"
										className="flex-1 cursor-pointer"
									>
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
							<Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
								Nombre del proyecto
							</Label>
							<Input
								value={newProject.name}
								onChange={(e) =>
									setNewProject({ ...newProject, name: e.target.value })
								}
								placeholder="Ej: Sistema de Inventario"
								className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
							/>
						</div>
						<div>
							<Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
								Descripción
							</Label>
							<Textarea
								value={newProject.desciption}
								onChange={(e) =>
									setNewProject({ ...newProject, desciption: e.target.value })
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
							<Button onClick={createProject}>Crear Proyecto</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Dialog para crear documento */}
			<Dialog
				open={isDocumentDialogOpen}
				onOpenChange={setIsDocumentDialogOpen}
			>
				<DialogContent className="max-w-sm mx-4 dark:bg-gray-800 dark:border-gray-700">
					<DialogHeader>
						<DialogTitle className="text-gray-900 dark:text-white">
							Crear Nuevo Archivo de Gestión
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
								Nombre del archivo
							</Label>
							<Input
								value={newDocument.name}
								onChange={(e) =>
									setNewDocument({ ...newDocument, name: e.target.value })
								}
								placeholder="Ej: Registro de Entrada - Agosto 2025"
								className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
							/>
						</div>
						<div>
							<Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
								Empresa:
							</Label>
							<Input
								value={newDocument.company}
								onChange={(e) =>
									setNewDocument({ ...newDocument, company: e.target.value })
								}
								placeholder="Ej: SYSGD Inc"
								className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
							/>
						</div>
						<div>
							<Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
								código:
							</Label>
							<Input
								value={newDocument.code}
								onChange={(e) =>
									setNewDocument({ ...newDocument, code: e.target.value })
								}
								placeholder="Ej: OC37.1.1"
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

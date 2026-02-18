/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
import { type FC, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Activity,
	Bell,
	Calendar,
	CreditCard,
	Edit,
	Eye,
	File,
	FileText,
	Folder,
	FolderPlus,
	Home,
	Menu,
	MoreVertical,
	Search,
	Settings,
	Trash2,
	Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import useArchives from "@/hooks/connection/useArchives";
import useProjects from "@/hooks/connection/useProjects";
import useCurrentUser from "@/hooks/connection/useCurrentUser";
import { useSelectionStore } from "@/store/selection";
import { useArchiveStore } from "@/store/useArchiveStore";
import { IoChatboxOutline } from "react-icons/io5";
import { useGetInvitations } from "@/hooks/connection/useGetInvitations";
import UserProfileTrigger from "@/components/UserProfileTrigger";
import { NotificationsPopup } from "@/components/NotificationsPopup";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { formatDate } from "@/utils/util";
import useConnection from "@/hooks/connection/useConnection";
import useProjectConnection from "@/hooks/connection/useProjectConnection";
import useBillingData from "@/hooks/connection/useBillingData";
import useAccountingDocuments from "@/hooks/connection/useAccountingDocuments";
import { Progress } from "@/components/ui/progress";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SettingsModal from "@/components/SettingsModal";
import Loading from "@/components/Loading";
import { Separator } from "@/components/ui/separator";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ViewMode = "home" | "projects" | "documents";

interface DocumentFile {
	id: string;
	name: string;
	company: string;
	code: string;
	tipo: "document";
	creator_name: string;
	created_at: string;
	document_kind: "management" | "tcp";
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

const PROJECT_ACTIVITY_STORAGE_KEY = "dashboard:project-activity";

interface ProjectActivityRecord {
	projectId: string;
	lastOpenedAt: string;
}

const readProjectActivity = (): ProjectActivityRecord[] => {
	try {
		const raw = localStorage.getItem(PROJECT_ACTIVITY_STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter(
			(item): item is ProjectActivityRecord =>
				typeof item?.projectId === "string" &&
				typeof item?.lastOpenedAt === "string",
		);
	} catch {
		return [];
	}
};

const writeProjectActivity = (records: ProjectActivityRecord[]) => {
	localStorage.setItem(PROJECT_ACTIVITY_STORAGE_KEY, JSON.stringify(records));
};

const getRelativeActivityText = (isoDate?: string): string => {
	if (!isoDate) return "Sin actividad reciente";
	const date = new Date(isoDate);
	if (Number.isNaN(date.getTime())) return "Sin actividad reciente";

	const now = Date.now();
	const diffMs = Math.max(0, now - date.getTime());
	const minute = 60 * 1000;
	const hour = 60 * minute;
	const day = 24 * hour;

	if (diffMs < minute) return "Hace un momento";
	if (diffMs < hour) {
		const minutes = Math.floor(diffMs / minute);
		return `Hace ${minutes} min`;
	}
	if (diffMs < day) {
		const hours = Math.floor(diffMs / hour);
		return `Hace ${hours} h`;
	}
	const days = Math.floor(diffMs / day);
	return `Hace ${days} día${days === 1 ? "" : "s"}`;
};

const SystemDashboard: FC = () => {
	const [viewMode, setViewMode] = useState<ViewMode>("home");

	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [unreadCount, setUnreadCount] = useState(0);
	const [searchTerm, setSearchTerm] = useState("");
	const [showNotifications, setShowNotifications] = useState(false);
	const [documents, setDocument] = useState<DocumentFile[]>([]);
	const [projects, setProjects] = useState<Project[]>([]);
	const [projectActivity, setProjectActivity] = useState<ProjectActivityRecord[]>([]);
	const { handleCreateProject, handleUpdateProject, handleDeleteProject } =
		useProjectConnection();
	const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
	const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
	const { toast } = useToast();

	const navigate = useNavigate();
	const { user, loading: loadingUser } = useCurrentUser();
	const { billing } = useBillingData();
	const {
		documents: accountingDocuments,
		reloadDocuments: reloadAccountingDocuments,
		createDocument: createAccountingDocument,
	} = useAccountingDocuments();
	const { projects: mProjects = [], reloadProjects } = useProjects();
	const { archives = [] } = useArchives();
	const setProjectId = useSelectionStore((state) => state.setProjectId);
	const setArchive = useArchiveStore((state) => state.selectArchive);
	const { invitations } = useGetInvitations();

	const [newProject, setNewProject] = useState({
		name: "",
		desciption: "",
	});
	const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

	const [newDocument, setNewDocument] = useState({
		name: "",
		company: "",
		code: "",
		documentType: "management" as "management" | "tcp",
	});

	// const unreadCount =
	// 	invitations?.filter((inv) => inv.status === "pending").length || 0;

	const filteredProjects = projects.filter((p) =>
		p.name.toLowerCase().includes(searchTerm.toLowerCase()),
	);
	const filteredDocuments = documents.filter((d) =>
		d.name.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const sidebarItems = [
		{ id: "home", label: "Inicio", icon: Home },
		{
			id: "projects",
			label: "Proyectos",
			icon: Folder,
			count: projects.length,
		},
		{
			id: "documents",
			label: "Documentos",
			icon: FileText,
			count: archives.length,
		},
		{ id: "purchase", label: "Tienda", icon: CreditCard },
	];

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

	const saveProject = () => {
		if (editingProjectId) {
			handleUpdateProject(
				editingProjectId,
				{ name: newProject.name, description: newProject.desciption },
				() => {
					toast({
						title: "Éxito",
						description: "Proyecto actualizado correctamente",
					});
					setIsProjectDialogOpen(false);
					setEditingProjectId(null);
					setNewProject({ name: "", desciption: "" });
					void reloadProjects();
				},
				(error) => {
					toast({
						title: "Error",
						description: error || "No se pudo actualizar el proyecto",
						variant: "destructive",
					});
				},
			);
			return;
		}

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

				toast({
					title: "Exito",
					description: "Proyecto creado correctamente",
				});
				setIsProjectDialogOpen(false);
				setNewProject({ name: "", desciption: "" });
				void reloadProjects();
			},
			(error) => {
				toast({
					title: "Error",
					description:
						error ||
						"No se creó el proyecto, por favor, verifique su conexión o conecte con soporte",
					variant: "destructive",
				});
			},
		);
	};

	const openEditProjectDialog = (project: Project) => {
		setEditingProjectId(project.id);
		setNewProject({
			name: project.name,
			desciption: project.description || "",
		});
		setIsProjectDialogOpen(true);
	};

	const deleteProject = (projectId: string) => {
		if (!window.confirm("¿Deseas eliminar este proyecto? Esta acción no se puede deshacer.")) {
			return;
		}

		handleDeleteProject(
			projectId,
			() => {
				toast({
					title: "Éxito",
					description: "Proyecto eliminado correctamente",
				});
				void reloadProjects();
			},
			(error) => {
				toast({
					title: "Error",
					description: error || "No se pudo eliminar el proyecto",
					variant: "destructive",
				});
			},
		);
	};

	const { handleNewArchiving } = useConnection();
	const handleCreateDocument = () => {
		if (newDocument.documentType === "tcp") {
			const tier = billing?.tier ?? user?.user_data?.billing?.tier ?? "free";
			if (tier === "free") {
				toast({
					title: "Función premium",
					description:
						"La creación de registros de ingresos y gastos está disponible para planes Pro o VIP",
					variant: "destructive",
				});
				navigate("/billing/purchase");
				return;
			}

			createAccountingDocument(newDocument.name || "Registro TCP")
				.then((created) => {
					void reloadAccountingDocuments();
					setIsDocumentDialogOpen(false);
					navigate(`/tcp-registro/${created.id}`);
				})
				.catch((error: unknown) => {
					const message =
						error instanceof Error && error.message
							? error.message
							: "No se pudo crear el registro contable";
					toast({
						title: "Error al crear el registro",
						description: message,
						variant: "destructive",
					});
				});
			return;
		}

		handleNewArchiving(
			newDocument.code,
			newDocument.company,
			newDocument.name,
			() => {
				toast({
					title: "Exito",
					description: "Archivo creado, por favor refresque la página",
				});
				setIsDocumentDialogOpen(false);
				setNewDocument({
					name: "",
					company: "",
					code: "",
					documentType: "management",
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
	};

	const getProgress = (completed: number, total: number) => {
		if (total <= 0) return 0;
		if (completed <= 0) return 0;
		return Math.round((completed / total) * 100);
	};

	useEffect(() => {
		const projt: Project[] = mProjects.map((item) => ({
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
		}));

		if (projt !== null) {
			setProjects(projt);
		}
	}, [mProjects]);

	useEffect(() => {
		const managementDocs: DocumentFile[] = archives.map((archive) => ({
			id: archive.id,
			name: archive.name,
			company: archive.company,
			code: archive.code,
			creator_name: archive.creator_name,
			created_at: archive.created_at,
			tipo: "document",
			document_kind: "management",
		}));

		const tcpDocs: DocumentFile[] = accountingDocuments.map((document) => ({
			id: document.id,
			name: document.name,
			company: "Contabilidad",
			code: "TCP",
			creator_name: user?.name ?? "",
			created_at: document.createdAt,
			tipo: "document",
			document_kind: "tcp",
		}));

		setDocument([...tcpDocs, ...managementDocs]);
	}, [archives, accountingDocuments, user?.name]);

	useEffect(() => {
		if (typeof window === "undefined") return;
		setProjectActivity(readProjectActivity());
	}, []);

	const trackProjectOpen = (projectId: string) => {
		const nowIso = new Date().toISOString();
		setProjectActivity((prev) => {
			const next = [
				{ projectId, lastOpenedAt: nowIso },
				...prev.filter((item) => item.projectId !== projectId),
			].slice(0, 20);
			writeProjectActivity(next);
			return next;
		});
	};

	const recentProjects = useMemo(() => {
		if (projects.length === 0) return [];

		const activityMap = new Map(
			projectActivity.map((item) => [item.projectId, item.lastOpenedAt]),
		);

		const withActivity = projects
			.filter((project) => activityMap.has(project.id))
			.sort((a, b) => {
				const dateA = new Date(activityMap.get(a.id) || 0).getTime();
				const dateB = new Date(activityMap.get(b.id) || 0).getTime();
				return dateB - dateA;
			});

		if (withActivity.length >= 3) {
			return withActivity.slice(0, 3);
		}

		const missing = projects.filter(
			(project) => !withActivity.some((active) => active.id === project.id),
		);

		return [...withActivity, ...missing].slice(0, 3);
	}, [projects, projectActivity]);

	useEffect(() => {
		if (invitations) {
			// Contar invitaciones pendientes (no aceptadas ni rechazadas)
			const pendingInvitations = invitations.filter(
				(inv) => inv.status === "pending",
			);
			console.log("Invitaciones:", invitations);
			console.log("Invitaciones pendientes:", pendingInvitations);
			setUnreadCount(pendingInvitations.length);
		} else {
			setUnreadCount(0);
		}
	}, [invitations]);

	// ... (mantén tus funciones renderHome, renderProjects, renderDocuments, diálogos, etc. tal cual)

	const renderHome = () => (
		<>
			<div className="mb-8">
				<h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
					Bienvenido de vuelta, {loadingUser ? "" : user?.name}
				</h1>
				<p className="text-lg text-gray-600 dark:text-gray-400">
					Gestiona tus proyectos y archivos desde un solo lugar
				</p>
			</div>

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
									0
								</p>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									Colaboradores
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<Card className="dark:bg-gray-800 dark:border-gray-700">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Folder className="w-5 h-5 text-blue-600" />
							Proyectos Recientes
						</CardTitle>
					</CardHeader>
					<Separator />
					<CardContent>
						<div className="space-y-3">
							{recentProjects.map((project) => (
								<div
									key={project.id}
									onClick={() => {
										setProjectId(project.id);
										trackProjectOpen(project.id);
										navigate("/projects");
									}}
									className="flex w-full cursor-pointer items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
								>
									<div className="flex-1">
										<p className="font-medium text-gray-900 dark:text-white">
											{project.name}
										</p>
										<p className="text-sm text-gray-600 dark:text-gray-400">
											{project.members_count} miembros
										</p>
										<p className="text-xs text-gray-500 dark:text-gray-400">
											Actividad: {getRelativeActivityText(
												projectActivity.find((item) => item.projectId === project.id)?.lastOpenedAt,
											)}
										</p>
									</div>
									<Badge className={getStatusColor(project.status ?? "")}>
										{project.status}
									</Badge>
								</div>
							))}
							{recentProjects.length === 0 && (
								<p className="text-center text-gray-500 dark:text-gray-400 py-4">
									No hay proyectos aún
								</p>
							)}
						</div>
					</CardContent>
				</Card>

				<Card className="dark:bg-gray-800 dark:border-gray-700">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileText className="w-5 h-5 text-green-600" />
							Documentos Recientes
						</CardTitle>
					</CardHeader>
					<Separator />
					<CardContent>
						<div className="space-y-3">
							{documents.slice(0, 3).map((doc) => (
								<div
									key={doc.id}
									onClick={() => {
										setArchive(doc.id, {
											name: doc.name,
											company: doc.company,
											code: doc.code,
										});
										navigate("/archives");
									}}
									className="flex items-center cursor-pointer justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
								>
									<div className="flex-1">
										<p className="font-medium text-gray-900 dark:text-white">
											{doc.name}
										</p>
										<p className="text-sm text-gray-600 dark:text-gray-400">
											{doc.company}
										</p>
									</div>
									<p className="text-xs text-gray-500 dark:text-gray-400">
										{doc.code}
									</p>
								</div>
							))}
							{documents.length === 0 && (
								<p className="text-center text-gray-500 dark:text-gray-400 py-4">
									No hay documentos aún
								</p>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		</>
	);

	const renderProjects = () => (
		<>
			<div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<div>
					<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
						Proyectos
					</h2>
					<p className="text-gray-600 dark:text-gray-400">
						{filteredProjects.length} proyectos en total
					</p>
				</div>
				<Button
					onClick={() => {
						setEditingProjectId(null);
						setNewProject({ name: "", desciption: "" });
						setIsProjectDialogOpen(true);
					}}
				>
					<FolderPlus className="w-4 h-4 mr-2" />
					Nuevo Proyecto
				</Button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
				{filteredProjects.map((project) => (
					<Card
						key={project.id}
						className="hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700"
					>
						<CardHeader className="pb-3">
							<div className="flex items-start justify-between">
								<div className="flex items-center gap-2">
									<Folder className="w-5 h-5 text-blue-600" />
									<CardTitle className="text-base font-medium text-gray-900 dark:text-white line-clamp-1">
										{project.name}
									</CardTitle>
								</div>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="sm">
											<MoreVertical className="w-4 h-4" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end">
										<DropdownMenuItem onClick={() => openEditProjectDialog(project)}>
											<Edit className="w-4 h-4 mr-2" />
											Editar
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={() => deleteProject(project.id)}
											className="text-red-600 focus:text-red-600"
										>
											<Trash2 className="w-4 h-4 mr-2" />
											Eliminar
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
							<Badge
								className={`w-fit ${getStatusColor(project.status ?? "")}`}
							>
								{project.status}
							</Badge>
						</CardHeader>

						<CardContent className="space-y-3 flex flex-col">
							<div className="h-full">
								<p className="text-sm h-full text-gray-600 dark:text-gray-400 line-clamp-2">
									{project.description}
								</p>
							</div>

							<div className="space-y-2">
								<div className="flex justify-between text-sm">
									<span className="text-gray-600 dark:text-gray-400">
										Progreso
									</span>
									<span className="font-medium text-gray-900 dark:text-white">
										{getProgress(project.completed_tasks, project.total_tasks)}%
									</span>
								</div>
								<Progress
									value={getProgress(
										project.completed_tasks,
										project.total_tasks,
									)}
									max={project.total_tasks}
								/>
							</div>

							<div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
								<div className="flex items-center gap-1">
									<Users className="w-3 h-3" />
									{project.members_count} miembros
								</div>
							</div>

							<div className="flex gap-2 pt-2">
								<Button
									onClick={() => {
										setProjectId(project.id);
										trackProjectOpen(project.id);
										navigate("/projects");
									}}
									variant="ghost"
									size="sm"
									className="flex-1 cursor-pointer"
								>
									<Eye className="w-3 h-3 mr-1" />
									Ver
								</Button>
								<Button
									onClick={() => openEditProjectDialog(project)}
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

			{filteredProjects.length === 0 && (
				<div className="text-center py-12">
					<div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
						<Folder className="w-8 h-8 text-gray-400" />
					</div>
					<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
						No se encontraron proyectos
					</h3>
					<p className="text-gray-600 dark:text-gray-400 mb-4">
						{searchTerm
							? "Intenta cambiar el término de búsqueda"
							: "Comienza creando tu primer proyecto"}
					</p>
					{!searchTerm && (
						<Button
							onClick={() => {
								setEditingProjectId(null);
								setNewProject({ name: "", desciption: "" });
								setIsProjectDialogOpen(true);
							}}
						>
							<FolderPlus className="w-4 h-4 mr-2" />
							Crear Proyecto
						</Button>
					)}
				</div>
			)}
		</>
	);

	const renderDocuments = () => (
		<>
			<div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
				<div>
					<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
						Documentos
					</h2>
					<p className="text-gray-600 dark:text-gray-400">
						{filteredDocuments.length} documentos en total
					</p>
				</div>
				<Button variant="outline" onClick={() => setIsDocumentDialogOpen(true)}>
					<FileText className="w-4 h-4 mr-2" />
					Nuevo Documento
				</Button>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
				{filteredDocuments.map((doc) => (
					<Card
						key={doc.id}
						className="hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700"
					>
						<CardHeader className="pb-3">
							<div className="flex items-start justify-between">
								<div className="flex items-center gap-2">
									<FileText className="w-5 h-5 text-green-600" />
									<CardTitle className="text-base font-medium text-gray-900 dark:text-white line-clamp-1">
										{doc.name}
									</CardTitle>
								</div>
								<Button variant="ghost" disabled size="sm">
									<MoreVertical className="w-4 h-4" />
								</Button>
							</div>
							<Badge className="w-fit bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
								{doc.document_kind === "tcp" ? "Contabilidad" : "EGDyA"}
							</Badge>
						</CardHeader>

						<CardContent className="space-y-3 flex flex-col">
							<div className="space-y-2 text-sm">
								<div className="flex justify-between">
									<span className="text-gray-600 dark:text-gray-400">
										Empresa:
									</span>
									<span className="font-medium line-clamp-1 text-gray-900 dark:text-white">
										{doc.company}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600 dark:text-gray-400">
										Creador
									</span>
									<span className="font-medium line-clamp-1 text-right text-gray-900 dark:text-white">
										{doc.creator_name}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600 dark:text-gray-400">
										Código:
									</span>
									<span className="font-medium text-gray-900 dark:text-white">
										{doc.code}
									</span>
								</div>
							</div>

							<div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
								<div className="flex items-center gap-1">
									<Calendar className="w-3 h-3" />
									Creado el {formatDate(doc.created_at)}
								</div>
							</div>

							<div className="flex gap-2 pt-2">
								<Button
									onClick={() => {
										setArchive(doc.id, {
											name: doc.name,
											company: doc.company,
											code: doc.code,
										});
										navigate("/archives");
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

			{filteredDocuments.length === 0 && (
				<div className="text-center py-12">
					<div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
						<FileText className="w-8 h-8 text-gray-400" />
					</div>
					<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
						No se encontraron documentos
					</h3>
					<p className="text-gray-600 dark:text-gray-400 mb-4">
						{searchTerm
							? "Intenta cambiar el término de búsqueda"
							: "Comienza creando tu primer documento"}
					</p>
					{!searchTerm && (
						<Button onClick={() => setIsDocumentDialogOpen(true)}>
							<FileText className="w-4 h-4 mr-2" />
							Crear Documento
						</Button>
					)}
				</div>
			)}
		</>
	);

	if (loadingUser) {
		return (
			<div className="flex flex-col h-screen bg-slate-950 items-center justify-center">
				<Loading textLoading="Verificando sesión..." />
			</div>
		);
	}

	if (!user) {
		navigate("/login");
		return null;
	}

	return (
		<>
			<div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
				{/* Topbar */}
				<header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3 sticky top-0 z-50">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2 md:gap-4">
							{/* Breadcrumb */}
							<div className="flex items-center gap-2">
								<Sheet>
									<SheetTrigger asChild>
										<Button variant="ghost" size="icon" className="md:hidden">
											<Menu className="h-5 w-5" />
										</Button>
									</SheetTrigger>
									<SheetContent side="left" className="w-64 p-0">
										<aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
											{/* Header Sidebar */}
											<div className="p-6 border-b border-gray-200 dark:border-gray-700">
												<div className="flex items-center gap-3">
													<div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
														<span className="text-white font-bold text-xl">
															S
														</span>
													</div>
													<div>
														<h1 className="text-xl font-bold">SYSGD</h1>
														<p className="text-xs text-gray-500">Ecosystem</p>
													</div>
												</div>
											</div>

											{/* Navegación */}
											<nav className="flex-1 p-4 space-y-1 overflow-y-auto">
												{sidebarItems.map((item) => {
													const Icon = item.icon;
													const isActive =
														viewMode === item.id ||
														(item.id === "purchase" && false); // ajusta si quieres active en purchase
													return (
														<Button
															key={item.id}
															variant={isActive ? "secondary" : "ghost"}
															className="w-full justify-start"
															onClick={() => {
																if (item.id === "purchase")
																	navigate("/billing/purchase");
																else setViewMode(item.id as ViewMode);
															}}
														>
															<Icon className="w-5 h-5 mr-3" />
															<span className="flex-1 text-left">
																{item.label}
															</span>
															{item.count !== undefined && (
																<Badge variant="secondary">{item.count}</Badge>
															)}
														</Button>
													);
												})}
											</nav>

											{/* Footer Sidebar */}
											<div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
												<Button
													variant="ghost"
													className="w-full justify-start"
													onClick={() => navigate("/settings")}
												>
													<Settings className="w-5 h-5 mr-3" />
													Configuración
												</Button>
											</div>
										</aside>
									</SheetContent>
								</Sheet>
							</div>

							<div className="flex items-center gap-2">
								<div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
									<span className="text-white text-xs font-bold">S</span>
								</div>
								<span className="font-bold text-lg text-gray-900 dark:text-white hidden sm:inline">
									SYSGD
								</span>
							</div>
						</div>

						<div className="flex items-center gap-1 md:gap-2">
							<Button
								onClick={() => navigate("/chat")}
								variant="ghost"
								size="sm"
								className="flex"
							>
								<IoChatboxOutline className="w-4 h-4" />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setShowNotifications(!showNotifications)}
								className="relative"
							>
								<Bell className="w-4 h-4" />
								{unreadCount > 0 && (
									<div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse">
										{unreadCount > 9 ? "9+" : unreadCount}
									</div>
								)}
							</Button>

							<Button
								onClick={() => setIsSettingsOpen(true)}
								variant="ghost"
								size="sm"
								className="flex"
							>
								<Settings className="w-4 h-4" />
							</Button>
							<div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-300 dark:border-gray-600">
								<UserProfileTrigger />
							</div>
						</div>
					</div>
					<NotificationsPopup
						isOpen={showNotifications}
						onClose={() => setShowNotifications(false)}
					/>
					<SettingsModal
						isOpen={isSettingsOpen}
						onClose={() => setIsSettingsOpen(false)}
					/>
				</header>

				<div className="flex flex-1 overflow-hidden">
					{/* Sidebar Desktop */}
					<aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 hidden md:flex flex-col">
						{/* Header Sidebar */}
						<div className="p-6 border-b border-gray-200 dark:border-gray-700">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
									<span className="text-white font-bold text-xl">S</span>
								</div>
								<div>
									<h1 className="text-xl font-bold">SYSGD</h1>
									<p className="text-xs text-gray-500">Ecosystem</p>
								</div>
							</div>
						</div>

						{/* Navegación */}
						<nav className="flex-1 p-4 space-y-1 overflow-y-auto">
							{sidebarItems.map((item) => {
								const Icon = item.icon;
								const isActive =
									viewMode === item.id || (item.id === "purchase" && false); // ajusta si quieres active en purchase
								return (
									<Button
										key={item.id}
										variant={isActive ? "secondary" : "ghost"}
										className="w-full justify-start"
										onClick={() => {
											if (item.id === "purchase") navigate("/billing/purchase");
											else setViewMode(item.id as ViewMode);
										}}
									>
										<Icon className="w-5 h-5 mr-3" />
										<span className="flex-1 text-left">{item.label}</span>
										{item.count !== undefined && (
											<Badge variant="secondary">{item.count}</Badge>
										)}
									</Button>
								);
							})}
						</nav>

						{/* Footer Sidebar */}
						<div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
							<Button
								variant="ghost"
								className="w-full justify-start"
								onClick={() => navigate("/settings")}
							>
								<Settings className="w-5 h-5 mr-3" />
								Configuración
							</Button>
						</div>
					</aside>

					{/* Main Content (scroll independiente) */}
					<main className="flex-1 overflow-y-auto">
						<div className="p-6 md:p-8 max-w-7xl mx-auto">
							{viewMode !== "home" && (
								<div className="mb-6">
									<div className="relative max-w-md">
										<Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
										<Input
											placeholder={`Buscar ${viewMode === "projects" ? "proyectos" : "documentos"}...`}
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
											className="pl-10"
										/>
									</div>
								</div>
							)}
							{viewMode === "home" && renderHome()}
							{viewMode === "projects" && renderProjects()}
							{viewMode === "documents" && renderDocuments()}
						</div>
					</main>
				</div>

				{/* Footer Global */}
				<footer className="h-6 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400">
					<div className="flex gap-4">
						<button type="button" onClick={() => navigate("/privacy")}>
							Política de Privacidad
						</button>
						<span>•</span>
						<button type="button" onClick={() => navigate("/terms")}>
							Términos de Uso
						</button>
						<span>•</span>
						<button type="button" onClick={() => navigate("/about")}>
							Acerca de
						</button>
					</div>
				</footer>
			</div>

			{/* Dialog para crear/editar proyecto */}
			<Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
				<DialogContent className="max-w-md mx-4 dark:bg-gray-800 dark:border-gray-700">
					<DialogHeader>
						<DialogTitle className="text-gray-900 dark:text-white">
							{editingProjectId ? "Editar proyecto" : "Crear Nuevo Proyecto"}
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
								onClick={() => {
									setIsProjectDialogOpen(false);
									setEditingProjectId(null);
									setNewProject({ name: "", desciption: "" });
								}}
							>
								Cancelar
							</Button>
							<Button onClick={saveProject}>
								{editingProjectId ? "Guardar cambios" : "Crear Proyecto"}
							</Button>
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
							Crear Nuevo Documento
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div>
							<Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
								Tipo de documento
							</Label>
							<select
								value={newDocument.documentType}
								onChange={(event) =>
									setNewDocument({
										...newDocument,
										documentType: event.target.value as "management" | "tcp",
									})
								}
								className="w-full h-10 px-3 rounded-md border border-input bg-background dark:bg-gray-700 dark:border-gray-600 dark:text-white"
							>
								<option value="management">Archivo de Gestión</option>
								<option value="tcp">Registro de ingresos y gastos (TCP)</option>
							</select>
						</div>
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
						{newDocument.documentType === "management" && (
							<>
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
							</>
						)}
						<div className="flex justify-end gap-2">
							<Button
								variant="outline"
								onClick={() => setIsDocumentDialogOpen(false)}
							>
								Cancelar
							</Button>
							<Button onClick={handleCreateDocument}>{newDocument.documentType === "management" ? "Crear Archivo" : "Crear Registro TCP"}</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default SystemDashboard;

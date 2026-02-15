import {
	Calendar,
	Edit,
	Lightbulb,
	Plus,
	Star,
	ThumbsDown,
	ThumbsUp,
	Trash2,
	User,
} from "lucide-react";
import { type FC, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useIdeas } from "@/hooks/connection/useIdeas";
import type { Idea } from "@/types/ProjectTypes";
import { timeAgo } from "@/utils/util";
import { Label } from "../ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import ReactMarkdown from "react-markdown";

const IdeasBank: FC<{ projectId: string }> = ({ projectId }) => {
	const { ideas, createIdea, deleteIdea, updateIdea } = useIdeas(projectId);
	console.log(ideas);

	const [editingIdea, setEditingIdea] = useState<Partial<Idea> | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [filterStatus, setFilterStatus] = useState("Todas");
	const [viewingIdea, setViewingIdea] = useState<Idea | null>(null);

	const statuses = [
		"Todas",
		"Pendiente",
		"En Evaluación",
		"Aprobada",
		"En Desarrollo",
		"Implementada",
		"Rechazada",
	];
	const categories = [
		"Funcionalidad",
		"UX/UI",
		"Integración",
		"Analytics",
		"Seguridad",
		"Performance",
	];

	const filteredIdeas = ideas.filter(
		(idea) => filterStatus === "Todas" || idea.status === filterStatus,
	);

	const getStatusColor = (status: string) => {
		switch (status) {
			case "Pendiente":
				return "bg-gray-100 text-gray-800";
			case "En Evaluación":
				return "bg-yellow-100 text-yellow-800";
			case "Aprobada":
				return "bg-green-100 text-green-800";
			case "En Desarrollo":
				return "bg-blue-100 text-blue-800";
			case "Implementada":
				return "bg-purple-100 text-purple-800";
			case "Rechazada":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const getPriorityColor = (priority: string) => {
		switch (priority) {
			case "Alta":
				return "destructive";
			case "Media":
				return "default";
			case "Baja":
				return "secondary";
			default:
				return "default";
		}
	};

	const getImplementabilityIcon = (level: string) => {
		switch (level) {
			case "Alta":
				return <Star className="w-4 h-4 text-green-500" />;
			case "Media":
				return <Star className="w-4 h-4 text-yellow-500" />;
			case "Baja":
				return <Star className="w-4 h-4 text-red-500" />;
			default:
				return null;
		}
	};

	const handleVote = (_ideaId: string, _increment: boolean) => {
		// setIdeas(
		// 	ideas.map((idea) =>
		// 		idea.id === ideaId
		// 			? { ...idea, votos: idea.votes + (increment ? 1 : -1) }
		// 			: idea,
		// 	),
		// );
	};

	const handleEditIdea = (idea: Idea) => {
		setEditingIdea(idea);
		setIsDialogOpen(true);
	};

	const handleAddNewIdea = () => {
		const newIdea: Partial<Idea> = {
			id: "new",
			title: "",
			description: "",
			category: "Funcionalidad",
			status: "Pendiente",
			priority: "Media",
			implementability: "Media",
			impact: "Medio",
		};
		setEditingIdea(newIdea);
		setIsDialogOpen(true);
	};

	const handleSaveIdea = () => {
		if (editingIdea) {
			if (editingIdea.id === "new") {
				createIdea(editingIdea);
			} else if (editingIdea.id) {
				updateIdea(editingIdea.id, editingIdea);
			}
			setEditingIdea(null);
			setIsDialogOpen(false);
		}
	};

	const handleDeleteIdea = (ideaId: string) => {
		if (confirm("Esta seguro de eliminar esta idea?")) deleteIdea(ideaId);
	};

	return (
		<div className="bg-white rounded-lg shadow-sm dark:border dark:bg-gray-800 dark:border-gray-700">
			<div className="p-6 border-b border-gray-200">
				<div className="flex justify-between items-start mb-4">
					<div>
						<h1 className="text-xl font-bold text-gray-900 mb-2 dark:text-gray-100">
							BANCO DE IDEAS
						</h1>
						<h2 className="text-lg font-semibold text-gray-700 dark:text-gray-400 mb-4">
							GESTIÓN DE IDEAS E INNOVACIÓN
						</h2>
					</div>
					<div className="text-right">
						<div className="text-sm font-medium">BI1</div>
					</div>
				</div>

				<div className="flex justify-between items-center">
					<div className="flex gap-4 items-center">
						<Select
							value={filterStatus}
							onValueChange={(v) => setFilterStatus(v)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="todos">Todos los tipos</SelectItem>
								{statuses.map((status) => (
									<SelectItem key={status} value={status}>
										{status}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<div className="text-sm shrink-0 text-gray-600 dark:text-gray-400">
							Total: {filteredIdeas.length} ideas
						</div>
					</div>
					<Button
						className="rounded-full sm:rounded w-12 h-12 sm:w-auto sm:h-auto fixed sm:relative sm:right-auto sm:bottom-auto right-10 bottom-20"
						onClick={handleAddNewIdea}
					>
						<Plus className="w-4 h-4 sm:mr-2 mr-0" />
						<span className="hidden sm:inline-block">Nueva Idea</span>
					</Button>
				</div>
			</div>

			<div className="p-6">
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{filteredIdeas.map((idea) => (
						<Card key={idea.id} className="hover:shadow-md transition-shadow">
							<CardHeader className="pb-4">
								<div className="flex items-start justify-between">
									<div className="flex items-start gap-3">
										<Lightbulb className="w-5 h-5 text-yellow-500 mt-1" />
										<div>
											<CardTitle className="text-lg font-medium">
												{idea.title}
											</CardTitle>
											<div className="flex gap-2 mt-2">
												<Badge className={getStatusColor(idea.status)}>
													{idea.status}
												</Badge>
												<Badge variant={getPriorityColor(idea.priority)}>
													{idea.priority}
												</Badge>
											</div>
										</div>
									</div>
									<div className="flex gap-1">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleEditIdea(idea)}
										>
											<Edit className="w-3 h-3" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleDeleteIdea(idea.id)}
										>
											<Trash2 className="w-3 h-3" />
										</Button>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<div>
									<div className="prose prose-lg dark:prose-invert max-w-none">
										<div
											role="button"
											tabIndex={0}
											onClick={() => setViewingIdea(idea)}
											onKeyDown={(e) => {
												if (e.key === "Enter" || e.key === " ") {
													e.preventDefault();
													setViewingIdea(idea);
												}
											}}
											style={{
												display: "-webkit-box",
												WebkitLineClamp: 4,
												WebkitBoxOrient: "vertical",
												overflow: "hidden",
											}}
											className="cursor-pointer text-foreground/90 hover:text-foreground transition-colors"
										>
											<ReactMarkdown>{idea.description}</ReactMarkdown>
										</div>
									</div>
									<div className="mt-2">
										<Button
											variant="link"
											size="sm"
											className="px-0"
											onClick={() => setViewingIdea(idea)}
										>
											Leer más
										</Button>
									</div>
								</div>


								<div className="grid grid-cols-2 gap-4 text-sm">
									<div>
										<span className="font-medium">Implementabilidad:</span>
										<div className="flex items-center gap-1 mt-1">
											{getImplementabilityIcon(idea.implementability)}
											{idea.implementability}
										</div>
									</div>
									<div>
										<span className="font-medium">Impacto:</span>
										<div className="mt-1">{idea.impact}</div>
									</div>
								</div>

								<div className="flex items-center justify-between pt-2 border-t">
									<div className="flex items-center gap-4 text-sm text-gray-500">
										<div className="flex items-center gap-1">
											<User className="w-3 h-3" />
											{idea.user_name}
										</div>
										<div className="flex items-center gap-1">
											<Calendar className="w-3 h-3" />
											{timeAgo(idea.created_at)}
										</div>
									</div>

									<div className="flex items-center gap-2">
										<Button
											disabled
											variant="ghost"
											size="sm"
											onClick={() => handleVote(idea.id, false)}
										>
											<ThumbsDown className="w-3 h-3" />
										</Button>
										<span className="text-sm font-medium">{idea.votes}</span>
										<Button
											disabled
											variant="ghost"
											size="sm"
											onClick={() => handleVote(idea.id, true)}
										>
											<ThumbsUp className="w-3 h-3" />
										</Button>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{filteredIdeas.length === 0 && (
					<div className="text-center py-12">
						<Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-4" />
						<p className="text-gray-500">
							No hay ideas que coincidan con el filtro seleccionado.
						</p>
					</div>
				)}
			</div>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="sm:max-w-2xl w-full rounded-lg">
					<DialogHeader>
						<DialogTitle>
							{editingIdea?.id && ideas.find((i) => i.id === editingIdea.id)
								? "Editar Idea"
								: "Nueva Idea"}
						</DialogTitle>
					</DialogHeader>
					{editingIdea && (
						<div className="space-y-4">
							<div>
								<Label className="text-sm font-medium">Título</Label>
								<Input
									value={editingIdea.title}
									onChange={(e) =>
										setEditingIdea({ ...editingIdea, title: e.target.value })
									}
									placeholder="Título de la idea"
								/>
							</div>
							<div>
								<Label className="text-sm font-medium">Descripción</Label>
								<Textarea
									value={editingIdea.description}
									onChange={(e) =>
										setEditingIdea({
											...editingIdea,
											description: e.target.value,
										})
									}
									placeholder="Descripción detallada de la idea"
									rows={4}
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label className="text-sm font-medium">Categoría</Label>
									<select
										value={editingIdea.category}
										onChange={(e) =>
											setEditingIdea({
												...editingIdea,
												category: e.target.value,
											})
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
									>
										{categories.map((category) => (
											<option key={category} value={category}>
												{category}
											</option>
										))}
									</select>
								</div>
								<div>
									<Label className="text-sm font-medium">Prioridad</Label>
									<select
										value={editingIdea.priority}
										onChange={(e) =>
											setEditingIdea({
												...editingIdea,
												priority: e.target.value,
											})
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
									>
										<option value="Alta">Alta</option>
										<option value="Media">Media</option>
										<option value="Baja">Baja</option>
									</select>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label className="text-sm font-medium">
										Implementabilidad
									</Label>
									<select
										value={editingIdea.implementability}
										onChange={(e) =>
											setEditingIdea({
												...editingIdea,
												implementability: e.target.value,
											})
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
									>
										<option value="Alta">Alta</option>
										<option value="Media">Media</option>
										<option value="Baja">Baja</option>
									</select>
								</div>
								<div>
									<Label className="text-sm font-medium">Impacto</Label>
									<select
										value={editingIdea.impact}
										onChange={(e) =>
											setEditingIdea({
												...editingIdea,
												impact: e.target.value,
											})
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
									>
										<option value="Alto">Alto</option>
										<option value="Medio">Medio</option>
										<option value="Bajo">Bajo</option>
									</select>
								</div>
							</div>
							<div className="flex justify-end gap-2">
								<Button
									variant="outline"
									onClick={() => setIsDialogOpen(false)}
								>
									Cancelar
								</Button>
								<Button onClick={handleSaveIdea}>Guardar</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>

			<Dialog
				open={!!viewingIdea}
				onOpenChange={(open) => !open && setViewingIdea(null)}
			>
				<DialogContent className="sm:max-w-2xl w-full rounded-lg">
					<DialogHeader>
						<DialogTitle>{viewingIdea?.title || "Idea"}</DialogTitle>
					</DialogHeader>
					{viewingIdea && (
						<div className="space-y-4">
							<div className="flex flex-wrap gap-2">
								<Badge className={getStatusColor(viewingIdea.status)}>
									{viewingIdea.status}
								</Badge>
								<Badge variant={getPriorityColor(viewingIdea.priority)}>
									{viewingIdea.priority}
								</Badge>
							</div>
							<div className="max-h-[50vh] overflow-y-auto">
								<div className="prose prose-lg dark:prose-invert max-w-none pr-2">
									<ReactMarkdown>{viewingIdea.description}</ReactMarkdown>
								</div>
							</div>
							<div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t">
								<div>
									<span className="font-medium">Implementabilidad:</span>
									<div className="flex items-center gap-1 mt-1">
										{getImplementabilityIcon(viewingIdea.implementability)}
										{viewingIdea.implementability}
									</div>
								</div>
								<div>
									<span className="font-medium">Impacto:</span>
									<div className="mt-1">{viewingIdea.impact}</div>
								</div>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default IdeasBank;

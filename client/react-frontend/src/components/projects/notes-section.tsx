"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Search, Calendar, User, Tag } from "lucide-react";

interface Note {
	id: number;
	titulo: string;
	contenido: string;
	categoria: string;
	autor: string;
	fechaCreacion: string;
	fechaModificacion: string;
	etiquetas: string[];
}

export function NotesSection() {
	const [notes, setNotes] = useState<Note[]>([
		{
			id: 1,
			titulo: "Reunión con cliente - Requisitos",
			contenido:
				"El cliente solicita implementar un sistema de notificaciones en tiempo real. Prioridad alta para el próximo sprint. Considerar usar WebSockets o Server-Sent Events.",
			categoria: "Reuniones",
			autor: "Lazaro",
			fechaCreacion: "05/07/2025",
			fechaModificacion: "05/07/2025",
			etiquetas: ["cliente", "requisitos", "notificaciones"],
		},
		{
			id: 2,
			titulo: "Ideas para mejorar la UX",
			contenido:
				"- Implementar modo oscuro\n- Agregar shortcuts de teclado\n- Mejorar la navegación móvil\n- Añadir tooltips informativos",
			categoria: "Diseño",
			autor: "Yamila",
			fechaCreacion: "06/07/2025",
			fechaModificacion: "07/07/2025",
			etiquetas: ["ux", "diseño", "mejoras"],
		},
		{
			id: 3,
			titulo: "Configuración del servidor",
			contenido:
				"Pasos para configurar el servidor de producción:\n1. Instalar Node.js v18+\n2. Configurar PM2\n3. Configurar Nginx como proxy reverso\n4. Configurar SSL con Let's Encrypt",
			categoria: "Técnico",
			autor: "Carlos",
			fechaCreacion: "04/07/2025",
			fechaModificacion: "04/07/2025",
			etiquetas: ["servidor", "producción", "configuración"],
		},
	]);

	const [searchTerm, setSearchTerm] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("Todas");
	const [editingNote, setEditingNote] = useState<Note | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const categories = ["Todas", "Reuniones", "Diseño", "Técnico", "Personal"];

	const filteredNotes = notes.filter((note) => {
		const matchesSearch =
			note.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
			note.contenido.toLowerCase().includes(searchTerm.toLowerCase()) ||
			note.etiquetas.some((tag) =>
				tag.toLowerCase().includes(searchTerm.toLowerCase()),
			);
		const matchesCategory =
			selectedCategory === "Todas" || note.categoria === selectedCategory;
		return matchesSearch && matchesCategory;
	});

	const getCategoryColor = (category: string) => {
		switch (category) {
			case "Reuniones":
				return "bg-blue-100 text-blue-800";
			case "Diseño":
				return "bg-purple-100 text-purple-800";
			case "Técnico":
				return "bg-green-100 text-green-800";
			case "Personal":
				return "bg-yellow-100 text-yellow-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	const handleEditNote = (note: Note) => {
		setEditingNote(note);
		setIsDialogOpen(true);
	};

	const handleAddNewNote = () => {
		const newNote: Note = {
			id: Math.max(...notes.map((n) => n.id)) + 1,
			titulo: "",
			contenido: "",
			categoria: "Personal",
			autor: "Usuario",
			fechaCreacion: new Date().toLocaleDateString("es-ES"),
			fechaModificacion: new Date().toLocaleDateString("es-ES"),
			etiquetas: [],
		};
		setEditingNote(newNote);
		setIsDialogOpen(true);
	};

	const handleSaveNote = () => {
		if (editingNote) {
			if (notes.find((n) => n.id === editingNote.id)) {
				setNotes(
					notes.map((note) =>
						note.id === editingNote.id
							? {
									...editingNote,
									fechaModificacion: new Date().toLocaleDateString("es-ES"),
								}
							: note,
					),
				);
			} else {
				setNotes([...notes, editingNote]);
			}
			setEditingNote(null);
			setIsDialogOpen(false);
		}
	};

	const handleDeleteNote = (noteId: number) => {
		setNotes(notes.filter((note) => note.id !== noteId));
	};

	return (
		<div className="bg-white rounded-lg shadow-sm">
			<div className="p-6 border-b border-gray-200">
				<div className="flex justify-between items-start mb-4">
					<div>
						<h1 className="text-xl font-bold text-gray-900 mb-2">
							NOTAS Y APUNTES
						</h1>
						<h2 className="text-lg font-semibold text-gray-700 mb-4">
							GESTIÓN DE NOTAS DEL PROYECTO
						</h2>
					</div>
					<div className="text-right">
						<div className="text-sm font-medium">NA1</div>
					</div>
				</div>

				<div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
					<div className="flex gap-4 items-center">
						<div className="relative">
							<Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
							<Input
								placeholder="Buscar notas..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10 w-64"
							/>
						</div>
						<select
							value={selectedCategory}
							onChange={(e) => setSelectedCategory(e.target.value)}
							className="px-3 py-2 border border-gray-300 rounded-md text-sm"
						>
							{categories.map((category) => (
								<option key={category} value={category}>
									{category}
								</option>
							))}
						</select>
					</div>
					<Button onClick={handleAddNewNote}>
						<Plus className="w-4 h-4 mr-2" />
						Nueva Nota
					</Button>
				</div>
			</div>

			<div className="p-6">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{filteredNotes.map((note) => (
						<Card key={note.id} className="hover:shadow-md transition-shadow">
							<CardHeader className="pb-3">
								<div className="flex items-start justify-between">
									<CardTitle className="text-base font-medium line-clamp-2">
										{note.titulo}
									</CardTitle>
									<div className="flex gap-1">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleEditNote(note)}
										>
											<Edit className="w-3 h-3" />
										</Button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => handleDeleteNote(note.id)}
										>
											<Trash2 className="w-3 h-3" />
										</Button>
									</div>
								</div>
								<Badge
									className={`w-fit text-xs ${getCategoryColor(note.categoria)}`}
								>
									{note.categoria}
								</Badge>
							</CardHeader>
							<CardContent className="space-y-3">
								<p className="text-sm text-gray-600 line-clamp-4">
									{note.contenido}
								</p>

								<div className="flex flex-wrap gap-1">
									{note.etiquetas.map((tag, index) => (
										// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
										<Badge key={index} variant="outline" className="text-xs">
											<Tag className="w-2 h-2 mr-1" />
											{tag}
										</Badge>
									))}
								</div>

								<div className="space-y-1 text-xs text-gray-500">
									<div className="flex items-center gap-1">
										<User className="w-3 h-3" />
										{note.autor}
									</div>
									<div className="flex items-center gap-1">
										<Calendar className="w-3 h-3" />
										Creado: {note.fechaCreacion}
									</div>
									{note.fechaModificacion !== note.fechaCreacion && (
										<div className="flex items-center gap-1">
											<Calendar className="w-3 h-3" />
											Modificado: {note.fechaModificacion}
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{filteredNotes.length === 0 && (
					<div className="text-center py-12">
						<p className="text-gray-500">
							No se encontraron notas que coincidan con los criterios de
							búsqueda.
						</p>
					</div>
				)}
			</div>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>
							{editingNote?.id && notes.find((n) => n.id === editingNote.id)
								? "Editar Nota"
								: "Nueva Nota"}
						</DialogTitle>
					</DialogHeader>
					{editingNote && (
						<div className="space-y-4">
							<div>
								{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
								<label className="text-sm font-medium">Título</label>
								<Input
									value={editingNote.titulo}
									onChange={(e) =>
										setEditingNote({ ...editingNote, titulo: e.target.value })
									}
									placeholder="Título de la nota"
								/>
							</div>
							<div>
								{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
								<label className="text-sm font-medium">Contenido</label>
								<Textarea
									value={editingNote.contenido}
									onChange={(e) =>
										setEditingNote({
											...editingNote,
											contenido: e.target.value,
										})
									}
									placeholder="Contenido de la nota"
									rows={6}
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
									<label className="text-sm font-medium">Categoría</label>
									<select
										value={editingNote.categoria}
										onChange={(e) =>
											setEditingNote({
												...editingNote,
												categoria: e.target.value,
											})
										}
										className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
									>
										{categories
											.filter((c) => c !== "Todas")
											.map((category) => (
												<option key={category} value={category}>
													{category}
												</option>
											))}
									</select>
								</div>
								<div>
									{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
									<label className="text-sm font-medium">
										Etiquetas (separadas por comas)
									</label>
									<Input
										value={editingNote.etiquetas.join(", ")}
										onChange={(e) =>
											setEditingNote({
												...editingNote,
												etiquetas: e.target.value
													.split(",")
													.map((tag) => tag.trim())
													.filter((tag) => tag),
											})
										}
										placeholder="etiqueta1, etiqueta2"
									/>
								</div>
							</div>
							<div className="flex justify-end gap-2">
								<Button
									variant="outline"
									onClick={() => setIsDialogOpen(false)}
								>
									Cancelar
								</Button>
								<Button onClick={handleSaveNote}>Guardar</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

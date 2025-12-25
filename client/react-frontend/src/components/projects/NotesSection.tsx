"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Search, Calendar, User, AlertCircle, Loader2 } from "lucide-react";
import { useNotes } from "@/hooks/useNotes";
import type { ProjectNote } from "@/types/Note";

interface NoteSectionProps {
	projectId: number | string;
}

interface EditingNote {
	id?: string; 
	title: string;
	content: string;
}

const NotesSection: React.FC<NoteSectionProps> = ({ projectId }) => {
	const {
		notes,
		loading,
		error,
		createNote,
		updateNote,
		deleteNote,
		refreshNotes,
	} = useNotes(projectId);

	const [searchTerm, setSearchTerm] = useState("");
	const [editingNote, setEditingNote] = useState<EditingNote | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [actionLoading, setActionLoading] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [noteToDelete, setNoteToDelete] = useState<string | null>(null);

	const filteredNotes = notes.filter((note) => {
		const matchesSearch =
			note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			note.content.toLowerCase().includes(searchTerm.toLowerCase());
		return matchesSearch;
	});

	const handleEditNote = (note: ProjectNote) => {
		setEditingNote({
			id: note.id,
			title: note.title,
			content: note.content,
		});
		setIsDialogOpen(true);
	};

	const handleAddNewNote = () => {
		setEditingNote({
			title: "",
			content: "",
		});
		setIsDialogOpen(true);
	};

	const handleSaveNote = async () => {
		if (!editingNote || !editingNote.title.trim()) {
			return;
		}

		setActionLoading(true);
		
		try {
			if (editingNote.id) {
				// Actualizar nota existente
				await updateNote(editingNote.id, {
					title: editingNote.title,
					content: editingNote.content,
				});
			} else {
				// Crear nueva nota
				const result = await createNote({
					title: editingNote.title,
					content: editingNote.content,
				});
				
				if (result) {
					// Refrescar las notas para asegurar que aparezcan
					await refreshNotes();
				}
			}
			
			setEditingNote(null);
			setIsDialogOpen(false);
		} catch (err) {
			console.error("❌ Error saving note:", err);
		} finally {
			setActionLoading(false);
		}
	};

	const handleDeleteNote = (noteId: string) => {
		setNoteToDelete(noteId);
		setDeleteDialogOpen(true);
	};

	const confirmDeleteNote = async () => {
		if (!noteToDelete) return;
		setActionLoading(true);
		try {
			await deleteNote(noteToDelete);
			setDeleteDialogOpen(false);
			setNoteToDelete(null);
		} catch (err) {
			console.error("Error deleting note:", err);
		} finally {
			setActionLoading(false);
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString("es-ES", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		});
	};

	const formatDateTime = (dateString: string) => {
		return new Date(dateString).toLocaleString("es-ES", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	return (
		<>
			<div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm">
			<div className="p-6 border-b border-gray-200 dark:border-gray-700">
				<div className="flex justify-between items-start mb-4">
					<div>
						<h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
							NOTAS Y APUNTES
						</h1>
						<h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
							GESTIÓN DE NOTAS DEL PROYECTO
						</h2>
					</div>
					<div className="text-right">
						<div className="text-sm font-medium text-gray-600 dark:text-gray-400">NA1</div>
					</div>
				</div>

				<div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
					<div className="flex gap-4 items-center">
						<div className="relative">
							<Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
							<Input
								placeholder="Buscar notas..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10 w-64 dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={refreshNotes}
							disabled={loading}
						>
							{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Actualizar"}
						</Button>
					</div>
					<Button onClick={handleAddNewNote} disabled={loading || actionLoading}>
						<Plus className="w-4 h-4 mr-2" />
						Nueva Nota
					</Button>
				</div>
			</div>

			<div className="p-6">
				{error && (
					<div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-center gap-2">
						<AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400" />
						<span className="text-red-700 dark:text-red-300">{error}</span>
					</div>
				)}

				{loading && !notes.length ? (
					<div className="flex items-center justify-center py-12">
						<Loader2 className="w-6 h-6 animate-spin mr-2 text-gray-600 dark:text-gray-400" />
						<span className="text-gray-600 dark:text-gray-400">Cargando notas...</span>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{filteredNotes.map((note) => (
							<Card key={note.id} className="hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
								<CardHeader className="pb-3">
									<div className="flex items-start justify-between">
										<CardTitle className="text-base font-medium line-clamp-2 text-gray-900 dark:text-white">
											{note.title}
										</CardTitle>
										<div className="flex gap-1">
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleEditNote(note)}
												disabled={actionLoading}
											>
												<Edit className="w-3 h-3" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleDeleteNote(note.id)}
												disabled={actionLoading}
											>
												<Trash2 className="w-3 h-3" />
											</Button>
										</div>
									</div>
								</CardHeader>
								<CardContent className="space-y-3">
									<p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-4 whitespace-pre-wrap">
										{note.content}
									</p>

									<div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
										<div className="flex items-center gap-1">
											<User className="w-3 h-3" />
											Autor: {note.author_name || note.author_email || `Usuario ${note.user_id}`}
										</div>
										<div className="flex items-center gap-1">
											<Calendar className="w-3 h-3" />
											Creado: {formatDate(note.created_at)}
										</div>
										{note.updated_at !== note.created_at && (
											<div className="flex items-center gap-1">
												<Calendar className="w-3 h-3" />
												Modificado: {formatDateTime(note.updated_at)}
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				)}

				{!loading && filteredNotes.length === 0 && !error && (
					<div className="text-center py-12">
						<p className="text-gray-500 dark:text-gray-400">
							{searchTerm
								? "No se encontraron notas que coincidan con la búsqueda."
								: "No hay notas en este proyecto. ¡Crea la primera nota!"}
						</p>
					</div>
				)}
			</div>

			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>
							{editingNote?.id ? "Editar Nota" : "Nueva Nota"}
						</DialogTitle>
					</DialogHeader>
					{editingNote && (
						<div className="space-y-4">
							<div>
								<label className="text-sm font-medium block mb-2 text-gray-700 dark:text-gray-300">Título</label>
								<Input
									value={editingNote.title}
									onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
									placeholder="Título de la nota"
									disabled={actionLoading}
									className="dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
							</div>
							<div>
								<label className="text-sm font-medium block mb-2 text-gray-700 dark:text-gray-300">Contenido</label>
								<Textarea
									value={editingNote.content}
									onChange={(e) => setEditingNote({
										...editingNote,
										content: e.target.value,
									})}
									placeholder="Contenido de la nota"
									rows={8}
									disabled={actionLoading}
									className="dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
							</div>
							<div className="flex justify-end gap-2">
								<Button
									variant="outline"
									onClick={() => setIsDialogOpen(false)}
									disabled={actionLoading}
								>
									Cancelar
								</Button>
								<Button
									onClick={handleSaveNote}
									disabled={actionLoading || !editingNote.title.trim()}
								>
									{actionLoading ? (
										<>
											<Loader2 className="w-4 h-4 animate-spin mr-2" />
											Guardando...
										</>
									) : (
										"Guardar"
									)}
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div><Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Confirmar eliminación</DialogTitle>
					</DialogHeader>
					<p>¿Estás seguro de que quieres eliminar esta nota? Esta acción no se puede deshacer.</p>
					<div className="flex justify-end gap-2 mt-4">
						<Button
							variant="outline"
							onClick={() => setDeleteDialogOpen(false)}
							disabled={actionLoading}
						>
							Cancelar
						</Button>
						<Button
							variant="destructive"
							onClick={confirmDeleteNote}
							disabled={actionLoading}
						>
							{actionLoading ? (
								<>
									<Loader2 className="w-4 h-4 animate-spin mr-2" />
									Eliminando...
								</>
							) : (
								"Eliminar"
							)}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default NotesSection;

"use client";

import type React from "react";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "./rich-text-editor";
import { Badge } from "@/components/ui/badge";
import { Save, FileText } from "lucide-react";

export function DocumentFormExample() {
	const [formData, setFormData] = useState({
		titulo: "",
		tipo: "",
		categoria: "",
		autor: "",
		fechaCreacion: "",
		contenido: "",
		observaciones: "",
		etiquetas: [] as string[],
	});

	const [newTag, setNewTag] = useState("");

	const handleContentChange = (content: string) => {
		setFormData({ ...formData, contenido: content });
	};

	const handleObservationsChange = (observations: string) => {
		setFormData({ ...formData, observaciones: observations });
	};

	const addTag = () => {
		if (newTag.trim() && !formData.etiquetas.includes(newTag.trim())) {
			setFormData({
				...formData,
				etiquetas: [...formData.etiquetas, newTag.trim()],
			});
			setNewTag("");
		}
	};

	const removeTag = (tagToRemove: string) => {
		setFormData({
			...formData,
			etiquetas: formData.etiquetas.filter((tag) => tag !== tagToRemove),
		});
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		console.log("Datos del formulario:", formData);
		// Aquí iría la lógica para guardar el documento
	};

	return (
		<div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm">
			<div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
				<div className="flex items-center gap-3 mb-4">
					<div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
						<FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
					</div>
					<div>
						<h1 className="text-xl font-bold text-gray-900 dark:text-white">
							Crear Nuevo Documento
						</h1>
						<p className="text-sm text-gray-600 dark:text-gray-400">
							Utiliza el editor avanzado para crear documentos con formato
							profesional
						</p>
					</div>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-6">
				{/* Información básica */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg flex items-center gap-2">
							<FileText className="w-5 h-5" />
							Información del Documento
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<Label htmlFor="titulo">Título del documento</Label>
								<Input
									id="titulo"
									value={formData.titulo}
									onChange={(e) =>
										setFormData({ ...formData, titulo: e.target.value })
									}
									placeholder="Ej: Plan de trabajo - Julio 2025"
									className="font-medium"
								/>
							</div>
							<div>
								<Label htmlFor="tipo">Tipo de documento</Label>
								<Select
									value={formData.tipo}
									onValueChange={(value) =>
										setFormData({ ...formData, tipo: value })
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Seleccionar tipo" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="registro-entrada">
											Registro de Entrada
										</SelectItem>
										<SelectItem value="registro-salida">
											Registro de Salida
										</SelectItem>
										<SelectItem value="tabla-retencion">
											Tabla de Retención
										</SelectItem>
										<SelectItem value="cuadro-clasificacion">
											Cuadro de Clasificación
										</SelectItem>
										<SelectItem value="informe">Informe</SelectItem>
										<SelectItem value="acta">Acta</SelectItem>
										<SelectItem value="memorando">Memorando</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div>
								<Label htmlFor="categoria">Categoría</Label>
								<Select
									value={formData.categoria}
									onValueChange={(value) =>
										setFormData({ ...formData, categoria: value })
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Seleccionar categoría" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="administrativo">
											Administrativo
										</SelectItem>
										<SelectItem value="tecnico">Técnico</SelectItem>
										<SelectItem value="legal">Legal</SelectItem>
										<SelectItem value="financiero">Financiero</SelectItem>
										<SelectItem value="recursos-humanos">
											Recursos Humanos
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div>
								<Label htmlFor="autor">Autor</Label>
								<Input
									id="autor"
									value={formData.autor}
									onChange={(e) =>
										setFormData({ ...formData, autor: e.target.value })
									}
									placeholder="Nombre del autor"
								/>
							</div>
							<div>
								<Label htmlFor="fecha">Fecha de creación</Label>
								<Input
									id="fecha"
									type="date"
									value={formData.fechaCreacion}
									onChange={(e) =>
										setFormData({ ...formData, fechaCreacion: e.target.value })
									}
								/>
							</div>
						</div>

						{/* Etiquetas */}
						<div>
							<Label>Etiquetas</Label>
							<div className="flex gap-2 mb-2">
								<Input
									value={newTag}
									onChange={(e) => setNewTag(e.target.value)}
									placeholder="Agregar etiqueta"
									onKeyPress={(e) =>
										e.key === "Enter" && (e.preventDefault(), addTag())
									}
									className="flex-1"
								/>
								<Button type="button" onClick={addTag} variant="outline">
									Agregar
								</Button>
							</div>
							<div className="flex flex-wrap gap-2">
								{formData.etiquetas.map((tag) => (
									<Badge
										key={tag}
										variant="secondary"
										className="cursor-pointer"
										onClick={() => removeTag(tag)}
									>
										{tag} ×
									</Badge>
								))}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Contenido principal */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Contenido del Documento</CardTitle>
						<p className="text-sm text-gray-600 dark:text-gray-400">
							Utiliza las herramientas del editor para dar formato a tu
							documento
						</p>
					</CardHeader>
					<CardContent>
						<RichTextEditor
							value={formData.contenido}
							onChange={handleContentChange}
							placeholder="Escribe el contenido principal del documento aquí..."
							minHeight="400px"
							className="rich-text-editor"
						/>
					</CardContent>
				</Card>

				{/* Observaciones */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Observaciones y Notas</CardTitle>
					</CardHeader>
					<CardContent>
						<RichTextEditor
							value={formData.observaciones}
							onChange={handleObservationsChange}
							placeholder="Agrega observaciones, notas adicionales o comentarios..."
							minHeight="200px"
							className="rich-text-editor"
						/>
					</CardContent>
				</Card>

				{/* Botones de acción */}
				<div className="flex flex-col sm:flex-row gap-3 pt-4">
					<Button type="submit" className="flex-1 sm:flex-none">
						<Save className="w-4 h-4 mr-2" />
						Guardar Documento
					</Button>
					<Button
						type="button"
						variant="outline"
						className="flex-1 sm:flex-none bg-transparent"
					>
						Guardar como Borrador
					</Button>
					<Button type="button" variant="ghost" className="flex-1 sm:flex-none">
						Vista Previa
					</Button>
				</div>
			</form>
		</div>
	);
}

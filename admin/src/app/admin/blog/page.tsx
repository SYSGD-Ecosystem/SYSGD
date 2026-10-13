import { useState } from "react"
import { Pencil, Plus, Trash2, Upload } from "lucide-react"

import { useBlog } from "../../../hooks/connection/useBlog"
import MarkdownEditor from "../../../components/ui/markdown-editor"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../../components/ui/dialog"
import type { BlogPost } from "../../../types/blog"

const emptyForm = {
	slug: "",
	title: "",
	category: "",
	coverUrl: "",
	body: "",
	isPublished: false,
}

const formatDate = (value: string) => {
	const parsed = new Date(value)
	return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString("es-CU")
}

export default function BlogPage() {
	const { posts, loading, savePost, removePost } = useBlog()
	const [dialogOpen, setDialogOpen] = useState(false)
	const [editingId, setEditingId] = useState<string | null>(null)
	const [form, setForm] = useState(emptyForm)
	const [saving, setSaving] = useState(false)
	const [uploadingCover, setUploadingCover] = useState(false)

	const openNew = () => {
		setEditingId(null)
		setForm(emptyForm)
		setDialogOpen(true)
	}

	const openEdit = (post: BlogPost) => {
		setEditingId(post.id)
		setForm({
			slug: post.slug,
			title: post.title,
			category: post.category,
			coverUrl: post.cover_url,
			body: post.body,
			isPublished: post.is_published,
		})
		setDialogOpen(true)
	}

	const handleUploadCover = async (file: File | undefined) => {
		if (!file) return
		setUploadingCover(true)
		try {
			const formData = new FormData()
			formData.append("file", file)
			const base = import.meta.env.VITE_SERVER_URL || "http://localhost:3000"
			const token = localStorage.getItem("token")
			const res = await fetch(`${base}/api/uploads`, {
				method: "POST",
				headers: token ? { Authorization: `Bearer ${token}` } : {},
				body: formData,
			})
			if (!res.ok) throw new Error("No se pudo subir la portada")
			const data = (await res.json()) as { url?: string }
			if (!data.url) throw new Error("Sin URL en la respuesta")
			setForm((f) => ({ ...f, coverUrl: data.url ?? "" }))
		} catch (e: unknown) {
			window.alert(e instanceof Error ? e.message : "No se pudo subir")
		} finally {
			setUploadingCover(false)
		}
	}

	const handleSave = async () => {
		if (!form.title.trim()) {
			window.alert("El título es obligatorio")
			return
		}
		setSaving(true)
		try {
			await savePost(editingId, {
				slug: form.slug.trim() || undefined,
				title: form.title.trim(),
				category: form.category,
				coverUrl: form.coverUrl,
				body: form.body,
				isPublished: form.isPublished,
			})
			setDialogOpen(false)
		} catch (e: unknown) {
			window.alert(e instanceof Error ? e.message : "No se pudo guardar")
		} finally {
			setSaving(false)
		}
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-foreground">Blog</h1>
					<p className="text-muted-foreground">
						Ayudas y contenidos para la web. Usa el botón de imagen del editor para incrustar fotos.
					</p>
				</div>
				<Button onClick={openNew}>
					<Plus className="mr-2 h-4 w-4" /> Nueva publicación
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Publicaciones</CardTitle>
					<CardDescription>Solo las publicadas se ven en la web.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{loading ? (
						<p className="text-sm text-muted-foreground">Cargando...</p>
					) : posts.length === 0 ? (
						<p className="text-sm text-muted-foreground">Nada por aquí todavía.</p>
					) : (
						posts.map((post) => (
							<div key={post.id} className="flex flex-col gap-3 rounded-xl border p-4 lg:flex-row lg:items-center lg:justify-between">
								<div className="flex items-center gap-3">
									{post.cover_url ? (
										<img src={post.cover_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
									) : (
										<div className="h-12 w-12 rounded-lg bg-muted" />
									)}
									<div>
										<div className="flex items-center gap-2">
											<p className="font-semibold">{post.title}</p>
											<Badge variant={post.is_published ? "default" : "secondary"}>
												{post.is_published ? "Publicada" : "Borrador"}
											</Badge>
										</div>
										<p className="text-sm text-muted-foreground">
											/{post.slug} · {post.category || "sin categoría"} · {formatDate(post.created_at)}
										</p>
									</div>
								</div>
								<div className="flex gap-2">
									<Button variant="outline" size="sm" onClick={() => openEdit(post)}>
										<Pencil className="mr-2 h-4 w-4" /> Editar
									</Button>
									<Button
										variant="destructive"
										size="sm"
										onClick={() => {
											if (window.confirm(`¿Borrar "${post.title}"?`)) {
												void removePost(post.id)
											}
										}}
									>
										<Trash2 className="mr-2 h-4 w-4" />
									</Button>
								</div>
							</div>
						))
					)}
				</CardContent>
			</Card>

			<Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
				<DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{editingId ? "Editar publicación" : "Nueva publicación"}</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4">
						<div className="space-y-2">
							<Label>Título *</Label>
							<Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
						</div>
						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label>Slug (vacío = desde el título)</Label>
								<Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
							</div>
							<div className="space-y-2">
								<Label>Categoría (p. ej. Ayudas)</Label>
								<Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
							</div>
						</div>
						<div className="space-y-2">
							<Label>Portada</Label>
							<div className="flex items-center gap-3">
								{form.coverUrl && (
									<img src={form.coverUrl} alt="portada" className="h-12 w-12 rounded-lg object-cover" />
								)}
								<Input
									type="file"
									accept="image/*"
									disabled={uploadingCover}
									onChange={(e) => void handleUploadCover(e.target.files?.[0])}
								/>
							</div>
							<Input
								value={form.coverUrl}
								onChange={(e) => setForm({ ...form, coverUrl: e.target.value })}
								placeholder="...o pega la URL directa"
							/>
						</div>
						<div className="space-y-2">
							<Label>Contenido (Markdown, botón imagen para fotos)</Label>
							<MarkdownEditor
								value={form.body}
								onChange={(body) => setForm({ ...form, body })}
								placeholder="Escribe la ayuda aquí. Usa el botón de imagen para incrustar fotos..."
							/>
						</div>
						<div className="flex items-center gap-2">
							<input
								type="checkbox"
								id="blog-published"
								checked={form.isPublished}
								onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
							/>
							<Label htmlFor="blog-published">Publicada en la web</Label>
						</div>
					</div>
					<DialogFooter>
						<Button onClick={() => void handleSave()} disabled={saving}>
							<Upload className="mr-2 h-4 w-4" />
							{saving ? "Guardando..." : "Guardar"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}

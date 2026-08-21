import { useMemo, useState } from "react"

import { Input } from "../../../components/ui/input"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "../../../components/ui/card"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../../../components/ui/alert-dialog"
import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../../../components/ui/dialog"
import ReactMarkdown from "react-markdown"
import {
	Calendar,
	Eye,
	Inbox,
	MapPin,
	RefreshCw,
	Search,
	Trash2,
	User,
	Users,
	Wallet,
	AlertTriangle,
} from "lucide-react"
import { useDescubrePostsAdmin } from "../../../hooks/connection/useDescubrePostsAdmin"
import type { DescubrePostAdmin } from "../../../types/descubrePost"
import { toPublicSupabaseUrl } from "../../../lib/images"

function formatDate(dateString: string) {
	return new Date(dateString).toLocaleDateString("es-ES", {
		year: "numeric",
		month: "short",
		day: "numeric",
	})
}

function isPostActive(post: DescubrePostAdmin) {
	return post.status === "active" && new Date(post.expiresAt).getTime() > Date.now()
}

export default function DescubreModerationPage() {
	const { posts, loading, error, refetch, deletePost } = useDescubrePostsAdmin()
	const [searchTerm, setSearchTerm] = useState("")
	const [postToDelete, setPostToDelete] = useState<DescubrePostAdmin | null>(null)
	const [deleting, setDeleting] = useState(false)
	const [deleteError, setDeleteError] = useState<string | null>(null)
	const [previewPost, setPreviewPost] = useState<DescubrePostAdmin | null>(null)

	const filteredPosts = useMemo(() => {
		const term = searchTerm.trim().toLowerCase()
		if (!term) return posts
		return posts.filter(
			(post) =>
				post.title.toLowerCase().includes(term) ||
				post.description.toLowerCase().includes(term) ||
				post.userName.toLowerCase().includes(term) ||
				post.category.toLowerCase().includes(term),
		)
	}, [posts, searchTerm])

	const stats = useMemo(
		() => ({
			total: posts.length,
			active: posts.filter(isPostActive).length,
			expired: posts.filter((p) => !isPostActive(p)).length,
		}),
		[posts],
	)

	const handleDeleteConfirm = async () => {
		if (!postToDelete) return
		setDeleting(true)
		setDeleteError(null)
		try {
			await deletePost(postToDelete.id)
			setPostToDelete(null)
		} catch (e: unknown) {
			setDeleteError(
				e instanceof Error ? e.message : "No se pudo eliminar la publicación",
			)
		} finally {
			setDeleting(false)
		}
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-foreground">Descubre</h1>
					<p className="text-muted-foreground">
						Modera las publicaciones de la comunidad: revisa y elimina contenido inadecuado
					</p>
				</div>
				<Button variant="outline" onClick={() => refetch()} disabled={loading}>
					<RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
					<span className="hidden md:inline">Actualizar</span>
				</Button>
			</div>

			{/* Stats */}
			<div className="grid gap-4 sm:grid-cols-3">
				<Card className="border-border">
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Total publicaciones</p>
								<p className="text-2xl font-bold text-foreground">{stats.total}</p>
							</div>
							<div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
								<Inbox className="w-5 h-5 text-primary" />
							</div>
						</div>
					</CardContent>
				</Card>
				<Card className="border-border">
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Activas</p>
								<p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
							</div>
							<div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
								<Eye className="w-5 h-5 text-emerald-600" />
							</div>
						</div>
					</CardContent>
				</Card>
				<Card className="border-border">
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Expiradas / inactivas</p>
								<p className="text-2xl font-bold text-amber-600">{stats.expired}</p>
							</div>
							<div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
								<Calendar className="w-5 h-5 text-amber-600" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Lista */}
			<Card className="border-border">
				<CardHeader>
					<CardTitle>Publicaciones</CardTitle>
					<CardDescription>
						Incluye publicaciones activas y expiradas. La eliminación es permanente.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="relative mb-6 w-full sm:max-w-sm">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
						<Input
							placeholder="Buscar por título, autor o categoría..."
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="pl-9"
						/>
					</div>

					{error && (
						<div className="mb-4 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-2">
							<AlertTriangle className="w-4 h-4 shrink-0" />
							{error}
						</div>
					)}

					{loading ? (
						<div className="text-center py-12 text-muted-foreground">Cargando publicaciones...</div>
					) : filteredPosts.length === 0 ? (
						<div className="text-center py-12 text-muted-foreground">
							<Inbox className="w-12 h-12 mx-auto mb-4 opacity-50" />
							<p>No se encontraron publicaciones</p>
						</div>
					) : (
						<div className="flex flex-col gap-4">
							{filteredPosts.map((post) => {
								const active = isPostActive(post)
								const image = toPublicSupabaseUrl(post.imageUrls?.[0])
								return (
									<div
										key={post.id}
										className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
									>
										{image ? (
											<img
												src={image}
												alt={post.title}
												className="w-full sm:w-40 h-28 object-cover rounded-md border border-border shrink-0"
											/>
										) : (
											<div className="hidden sm:flex w-40 h-28 items-center justify-center rounded-md bg-muted shrink-0">
												<Inbox className="w-8 h-8 text-muted-foreground/50" />
											</div>
										)}

										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-1.5 flex-wrap">
												<Badge
													variant="outline"
													className={
														active
															? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
															: "bg-amber-500/10 text-amber-600 border-amber-500/20"
													}
												>
													{active ? "Activa" : post.status === "active" ? "Expirada" : post.status}
												</Badge>
												{post.category && <Badge variant="secondary">{post.category}</Badge>}
												{post.precio && (
													<Badge variant="outline" className="gap-1">
														<Wallet className="w-3 h-3" />
														{post.precio} {post.moneda}
													</Badge>
												)}
											</div>

											<h3 className="font-semibold text-foreground line-clamp-1">{post.title}</h3>
											<p className="text-sm text-muted-foreground line-clamp-2 mt-1">
												{post.description}
											</p>

											<div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
												{post.userName && (
													<span className="inline-flex items-center gap-1">
														<User className="w-3 h-3" />
														{post.userName}
													</span>
												)}
												{post.province && (
													<span className="inline-flex items-center gap-1">
														<MapPin className="w-3 h-3" />
														{post.province}
													</span>
												)}
												<span className="inline-flex items-center gap-1">
													<Calendar className="w-3 h-3" />
													{formatDate(post.date)}
												</span>
												<span className="inline-flex items-center gap-1">
													<Users className="w-3 h-3" />
													{post.creditsSpent} créditos
												</span>
											</div>
										</div>

										<div className="flex sm:flex-col items-center justify-end gap-1 shrink-0">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => setPreviewPost(post)}
												title="Ver detalle"
											>
												<Eye className="w-4 h-4" />
												<span className="sr-only">Ver detalle</span>
											</Button>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => {
													setDeleteError(null)
													setPostToDelete(post)
												}}
												title="Eliminar publicación"
											>
												<Trash2 className="w-4 h-4 text-destructive" />
												<span className="sr-only">Eliminar</span>
											</Button>
										</div>
									</div>
								)
							})}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Vista previa */}
			<Dialog open={!!previewPost} onOpenChange={(open) => !open && setPreviewPost(null)}>
				<DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>{previewPost?.title}</DialogTitle>
						<DialogDescription>
							{previewPost?.userName} · {previewPost && formatDate(previewPost.date)}
							{previewPost?.province ? ` · ${previewPost.province}` : ""}
						</DialogDescription>
					</DialogHeader>
					{previewPost && (
						<div className="space-y-4">
							{previewPost.imageUrls?.length > 0 && (
								<div className="grid grid-cols-2 gap-2">
									{previewPost.imageUrls.map((url) => (
										<img
											key={url}
											src={toPublicSupabaseUrl(url)}
											alt={previewPost.title}
											className="rounded-lg border border-border object-cover aspect-video w-full"
										/>
									))}
								</div>
							)}
							<div className="prose prose-sm dark:prose-invert max-w-none text-sm">
								<ReactMarkdown>{previewPost.description}</ReactMarkdown>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>

			{/* Confirmación de eliminación */}
			<AlertDialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>¿Eliminar esta publicación?</AlertDialogTitle>
						<AlertDialogDescription>
							La publicación &quot;{postToDelete?.title}&quot; será eliminada permanentemente y
							dejará de mostrarse en la web pública. Esta acción no se puede deshacer.
						</AlertDialogDescription>
					</AlertDialogHeader>
					{deleteError && (
						<p className="text-sm text-destructive">{deleteError}</p>
					)}
					<AlertDialogFooter>
						<AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
						<AlertDialogAction
							onClick={(e) => {
								e.preventDefault()
								handleDeleteConfirm()
							}}
							disabled={deleting}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{deleting ? "Eliminando..." : "Eliminar"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	)
}

import { useState, type FormEvent } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Save, X } from "lucide-react"
import type { DescubrePost, DescubrePostInput } from "@/hooks/useDescubrePosts"

interface PostEditDialogProps {
	post: DescubrePost | null
	onClose: () => void
	onSave: (postId: string, input: DescubrePostInput) => Promise<DescubrePost | null>
}

/**
 * El componente padre debe pasar `key={post.id}` para que el formulario
 * se reinicie con los valores del post seleccionado en cada apertura.
 */
export function PostEditDialog({ post, onClose, onSave }: PostEditDialogProps) {
	const [form, setForm] = useState<DescubrePostInput>(() => ({
		title: post?.title ?? "",
		description: post?.description ?? "",
		category: post?.category ?? "",
		precio: post?.precio ?? "",
		moneda: post?.moneda ?? "",
		province: post?.province ?? "",
		contactNumber: post?.contactNumber ?? "",
	}))
	const [saving, setSaving] = useState(false)
	const [error, setError] = useState<string | null>(null)

	if (!post) return null

	async function handleSubmit(e: FormEvent) {
		e.preventDefault()
		if (!post) return
		setSaving(true)
		setError(null)
		const updated = await onSave(post.id, form)
		setSaving(false)

		if (updated) {
			onClose()
		} else {
			setError("No se pudo guardar. Inténtalo de nuevo.")
		}
	}

	const set = (key: keyof DescubrePostInput) => (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

	return createPortal(
		<div
			className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
			onClick={onClose}
			role="presentation"
		>
			<div
				className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl p-6"
				onClick={(e) => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
				aria-label="Editar publicación"
			>
				<div className="flex items-start justify-between mb-4">
					<h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
						Editar publicación
					</h2>
					<Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">
						<X className="w-4 h-4" />
					</Button>
				</div>

				<form onSubmit={handleSubmit} className="flex flex-col gap-3">
					<div>
						<label htmlFor="edit-title" className="text-sm font-medium mb-1.5 block">
							Título *
						</label>
						<Input id="edit-title" required value={form.title} onChange={set("title")} />
					</div>

					<div>
						<label htmlFor="edit-description" className="text-sm font-medium mb-1.5 block">
							Descripción * (Markdown permitido)
						</label>
						<Textarea
							id="edit-description"
							required
							rows={6}
							value={form.description}
							onChange={set("description")}
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div>
							<label htmlFor="edit-category" className="text-sm font-medium mb-1.5 block">
								Categoría
							</label>
							<Input id="edit-category" value={form.category} onChange={set("category")} />
						</div>
						<div>
							<label htmlFor="edit-province" className="text-sm font-medium mb-1.5 block">
								Provincia
							</label>
							<Input id="edit-province" value={form.province} onChange={set("province")} />
						</div>
						<div>
							<label htmlFor="edit-precio" className="text-sm font-medium mb-1.5 block">
								Precio
							</label>
							<Input id="edit-precio" value={form.precio} onChange={set("precio")} />
						</div>
						<div>
							<label htmlFor="edit-moneda" className="text-sm font-medium mb-1.5 block">
								Moneda
							</label>
							<Input id="edit-moneda" value={form.moneda} onChange={set("moneda")} />
						</div>
					</div>

					<div>
						<label htmlFor="edit-contact" className="text-sm font-medium mb-1.5 block">
							Teléfono de contacto *
						</label>
						<Input
							id="edit-contact"
							required
							value={form.contactNumber}
							onChange={set("contactNumber")}
						/>
					</div>

					{error && (
						<p className="text-sm text-red-600 dark:text-red-400" role="alert">
							{error}
						</p>
					)}

					<div className="flex justify-end gap-2 mt-1">
						<Button type="button" variant="outline" onClick={onClose} disabled={saving}>
							Cancelar
						</Button>
						<Button type="submit" disabled={saving}>
							{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
							Guardar cambios
						</Button>
					</div>
				</form>
			</div>
		</div>,
		document.body,
	)
}

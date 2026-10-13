import {
	Bold,
	Code,
	Edit3,
	Eye,
	Image,
	Italic,
	Link,
	List,
	ListOrdered,
	Quote,
} from "lucide-react"
import { type FC, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Button } from "./button"
import { Textarea } from "./textarea"

interface MarkdownEditorProps {
	value: string
	onChange: (value: string) => void
	placeholder?: string
	className?: string
}

/** Editor Markdown copiado del cliente (tareas): toolbar + subida de imágenes
 *  al storage + vista previa. Aquí sube con el token Bearer del admin. */
const MarkdownEditor: FC<MarkdownEditorProps> = ({
	value,
	onChange,
	placeholder = "Escribe aquí en formato Markdown...",
	className = "",
}) => {
	const [mode, setMode] = useState<"edit" | "preview">("edit")
	const [isUploading, setIsUploading] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const insertMarkdown = (before: string, after: string = "") => {
		const textarea = document.querySelector(
			"#markdown-textarea",
		) as HTMLTextAreaElement
		if (!textarea) return

		const start = textarea.selectionStart
		const end = textarea.selectionEnd
		const selectedText = value.substring(start, end)
		const newText = before + selectedText + after

		const newValue = value.substring(0, start) + newText + value.substring(end)
		onChange(newValue)

		setTimeout(() => {
			textarea.focus()
			textarea.setSelectionRange(
				start + before.length,
				start + before.length + selectedText.length,
			)
		}, 0)
	}

	const handleImageUpload = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0]
		if (!file) return

		if (!file.type.startsWith("image/")) {
			window.alert("Por favor selecciona un archivo de imagen")
			return
		}

		if (file.size > 5 * 1024 * 1024) {
			window.alert("La imagen no debe superar los 5MB")
			return
		}

		setIsUploading(true)

		try {
			const formData = new FormData()
			formData.append("file", file)

			const base = import.meta.env.VITE_SERVER_URL || "http://localhost:3000"
			const token = localStorage.getItem("token")
			const response = await fetch(`${base}/api/uploads`, {
				method: "POST",
				headers: token ? { Authorization: `Bearer ${token}` } : {},
				body: formData,
			})

			if (!response.ok) {
				throw new Error("Error al subir la imagen")
			}

			const result = (await response.json()) as { url?: string }
			if (!result.url) throw new Error("Sin URL en la respuesta")

			const imageMarkdown = `![${file.name}](${result.url})`
			const textarea = document.querySelector(
				"#markdown-textarea",
			) as HTMLTextAreaElement

			if (textarea) {
				const start = textarea.selectionStart
				const end = textarea.selectionEnd
				const newValue =
					value.substring(0, start) + imageMarkdown + value.substring(end)
				onChange(newValue)

				setTimeout(() => {
					textarea.focus()
					textarea.setSelectionRange(
						start + imageMarkdown.length,
						start + imageMarkdown.length,
					)
				}, 0)
			}
		} catch (error) {
			console.error("Error uploading image:", error)
			window.alert("Error al subir la imagen. Por favor intenta nuevamente.")
		} finally {
			setIsUploading(false)
			if (fileInputRef.current) {
				fileInputRef.current.value = ""
			}
		}
	}

	const toolbarButtons = [
		{ icon: Bold, action: () => insertMarkdown("**", "**"), title: "Negrita" },
		{ icon: Italic, action: () => insertMarkdown("*", "*"), title: "Cursiva" },
		{
			icon: List,
			action: () => insertMarkdown("- "),
			title: "Lista desordenada",
		},
		{
			icon: ListOrdered,
			action: () => insertMarkdown("1. "),
			title: "Lista ordenada",
		},
		{ icon: Quote, action: () => insertMarkdown("> "), title: "Cita" },
		{
			icon: Code,
			action: () => insertMarkdown("`", "`"),
			title: "Código en línea",
		},
		{
			icon: Code,
			action: () => insertMarkdown("```\n", "\n```"),
			title: "Bloque de código",
		},
		{
			icon: Link,
			action: () => insertMarkdown("[", "](url)"),
			title: "Enlace",
		},
	]

	return (
		<div className={`border rounded-lg overflow-hidden ${className}`}>
			<div className="border-b bg-gray-50 dark:bg-gray-800 p-2">
				<div className="flex items-center gap-1 flex-wrap">
					{toolbarButtons.map((btn, index) => (
						<Button
							key={index}
							type="button"
							variant="ghost"
							size="sm"
							onClick={btn.action}
							title={btn.title}
							className="h-8 w-8 p-0"
						>
							<btn.icon className="w-4 h-4" />
						</Button>
					))}

					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => fileInputRef.current?.click()}
						disabled={isUploading}
						title="Subir imagen"
						className="h-8 w-8 p-0"
					>
						{isUploading ? (
							<div className="w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div>
						) : (
							<Image className="w-4 h-4" />
						)}
					</Button>

					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						onChange={handleImageUpload}
						className="hidden"
					/>

					<div className="ml-auto flex gap-1">
						<Button
							type="button"
							variant={mode === "edit" ? "secondary" : "ghost"}
							size="sm"
							onClick={() => setMode("edit")}
						>
							<Edit3 className="w-4 h-4 mr-1" /> Editar
						</Button>
						<Button
							type="button"
							variant={mode === "preview" ? "secondary" : "ghost"}
							size="sm"
							onClick={() => setMode("preview")}
						>
							<Eye className="w-4 h-4 mr-1" /> Vista previa
						</Button>
					</div>
				</div>
			</div>

			{mode === "edit" ? (
				<Textarea
					id="markdown-textarea"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder={placeholder}
					className="min-h-[200px] border-0 rounded-none resize-y focus-visible:ring-0"
				/>
			) : (
				<div className="min-h-[200px] max-h-[400px] p-4 bg-white dark:bg-gray-900 overflow-auto">
					<div className="prose prose-sm dark:prose-invert max-w-none">
						{value ? (
							<ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
						) : (
							<div className="text-gray-500 dark:text-gray-400 italic">
								Vista previa del contenido Markdown...
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	)
}

export default MarkdownEditor

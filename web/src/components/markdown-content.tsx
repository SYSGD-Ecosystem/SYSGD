import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

/** Markdown renderizado como debe ser: GFM (tablas, tachado, listas de
 *  tareas), tipografía `prose` e imágenes contenidas (nunca gigantes).
 *  Las imágenes se ajustan al ancho del contenedor manteniendo proporción. */
export function MarkdownContent({ text }: { text: string }) {
	return (
		<div className="prose dark:prose-invert max-w-none">
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				components={{
					table: ({ children }) => (
						<div className="my-3 w-full overflow-x-auto rounded-lg border border-border">
							<table className="w-max min-w-full border-collapse text-sm">
								{children}
							</table>
						</div>
					),
					th: ({ children }) => (
						<th className="border border-border px-3 py-2 bg-muted font-semibold text-left whitespace-nowrap">
							{children}
						</th>
					),
					td: ({ children }) => (
						<td className="border border-border px-3 py-2 align-top break-words">
							{children}
						</td>
					),
					img: ({ src, alt }) => (
						<img
							src={src}
							alt={alt ?? ""}
							className="max-w-full h-auto rounded-xl mx-auto"
							loading="lazy"
						/>
					),
				}}
			>
				{text}
			</ReactMarkdown>
		</div>
	)
}

// components/RichTextEditor.tsx
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Button } from "@/components/ui/button";

export default function RichTextEditor({
	content,
	onChange,
}: { content?: string; onChange?: (val: string) => void }) {
	const editor = useEditor({
		extensions: [StarterKit],
		content: content || "",
		onUpdate({ editor }) {
			onChange?.(editor.getHTML());
		},
	});

	return (
		<div className="border rounded p-2 bg-white dark:bg-gray-900 dark:border-gray-700">
			<div className="flex gap-2 mb-2">
				<Button
					onClick={() => editor?.chain().focus().toggleBold().run()}
					variant="outline"
					size="sm"
				>
					Negrita
				</Button>
				<Button
					onClick={() => editor?.chain().focus().toggleItalic().run()}
					variant="outline"
					size="sm"
				>
					Cursiva
				</Button>
				<Button
					onClick={() => editor?.chain().focus().toggleBulletList().run()}
					variant="outline"
					size="sm"
				>
					Lista
				</Button>
			</div>
			<EditorContent
				editor={editor}
				className="min-h-[150px] prose dark:prose-invert max-w-none"
			/>
		</div>
	);
}

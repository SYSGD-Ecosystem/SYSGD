"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
	Bold,
	Italic,
	Underline,
	Strikethrough,
	AlignLeft,
	AlignCenter,
	AlignRight,
	AlignJustify,
	List,
	ListOrdered,
	Quote,
	LinkIcon,
	ImageIcon,
	Code,
	Undo,
	Redo,
	Type,
	Highlighter,
	Indent,
	Outdent,
	Table,
} from "lucide-react";

interface RichTextEditorProps {
	value?: string;
	onChange?: (value: string) => void;
	placeholder?: string;
	className?: string;
	minHeight?: string;
}

export function RichTextEditor({
	value = "",
	onChange,
	placeholder = "Escribe aquí...",
	className = "",
	minHeight = "200px",
}: RichTextEditorProps) {
	const editorRef = useRef<HTMLDivElement>(null);
	const [showLinkDialog, setShowLinkDialog] = useState(false);
	const [linkUrl, setLinkUrl] = useState("");
	const [linkText, setLinkText] = useState("");

	const executeCommand = useCallback(
		(command: string, value?: string) => {
			document.execCommand(command, false, value);
			if (editorRef.current && onChange) {
				onChange(editorRef.current.innerHTML);
			}
			editorRef.current?.focus();
		},
		[onChange],
	);

	const handleInput = useCallback(() => {
		if (editorRef.current && onChange) {
			onChange(editorRef.current.innerHTML);
		}
	}, [onChange]);

	const insertLink = () => {
		if (linkUrl && linkText) {
			executeCommand(
				"insertHTML",
				`<a href="${linkUrl}" target="_blank">${linkText}</a>`,
			);
			setLinkUrl("");
			setLinkText("");
			setShowLinkDialog(false);
		}
	};

	const insertTable = () => {
		const tableHTML = `
      <table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0;">
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Celda 1</td>
          <td style="padding: 8px; border: 1px solid #ddd;">Celda 2</td>
          <td style="padding: 8px; border: 1px solid #ddd;">Celda 3</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Celda 4</td>
          <td style="padding: 8px; border: 1px solid #ddd;">Celda 5</td>
          <td style="padding: 8px; border: 1px solid #ddd;">Celda 6</td>
        </tr>
      </table>
    `;
		executeCommand("insertHTML", tableHTML);
	};

	const colors = [
		"#000000",
		"#FF0000",
		"#00FF00",
		"#0000FF",
		"#FFFF00",
		"#FF00FF",
		"#00FFFF",
		"#800000",
		"#008000",
		"#000080",
		"#808000",
		"#800080",
		"#008080",
		"#C0C0C0",
		"#808080",
		"#FF9999",
		"#99FF99",
		"#9999FF",
		"#FFFF99",
		"#FF99FF",
		"#99FFFF",
	];

	const fontSizes = [
		"8",
		"10",
		"12",
		"14",
		"16",
		"18",
		"20",
		"24",
		"28",
		"32",
		"36",
		"48",
	];
	const fontFamilies = [
		"Arial",
		"Helvetica",
		"Times New Roman",
		"Courier New",
		"Verdana",
		"Georgia",
		"Palatino",
		"Garamond",
		"Comic Sans MS",
		"Trebuchet MS",
	];

	return (
		<div
			className={`border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden ${className}`}
		>
			{/* Toolbar */}
			<div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600 p-2">
				<div className="flex flex-wrap items-center gap-1">
					{/* Undo/Redo */}
					<Button
						variant="ghost"
						size="sm"
						onClick={() => executeCommand("undo")}
						title="Deshacer"
					>
						<Undo className="w-4 h-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => executeCommand("redo")}
						title="Rehacer"
					>
						<Redo className="w-4 h-4" />
					</Button>

					<Separator orientation="vertical" className="h-6 mx-1" />

					{/* Font Family */}
					<Select onValueChange={(value) => executeCommand("fontName", value)}>
						<SelectTrigger className="w-32 h-8">
							<SelectValue placeholder="Fuente" />
						</SelectTrigger>
						<SelectContent>
							{fontFamilies.map((font) => (
								<SelectItem
									key={font}
									value={font}
									style={{ fontFamily: font }}
								>
									{font}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{/* Font Size */}
					<Select onValueChange={(value) => executeCommand("fontSize", value)}>
						<SelectTrigger className="w-16 h-8">
							<SelectValue placeholder="12" />
						</SelectTrigger>
						<SelectContent>
							{fontSizes.map((size) => (
								<SelectItem key={size} value={size}>
									{size}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					<Separator orientation="vertical" className="h-6 mx-1" />

					{/* Text Formatting */}
					<Button
						variant="ghost"
						size="sm"
						onClick={() => executeCommand("bold")}
						title="Negrita"
					>
						<Bold className="w-4 h-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => executeCommand("italic")}
						title="Cursiva"
					>
						<Italic className="w-4 h-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => executeCommand("underline")}
						title="Subrayado"
					>
						<Underline className="w-4 h-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => executeCommand("strikeThrough")}
						title="Tachado"
					>
						<Strikethrough className="w-4 h-4" />
					</Button>

					<Separator orientation="vertical" className="h-6 mx-1" />

					{/* Text Color */}
					<Popover>
						<PopoverTrigger asChild>
							<Button variant="ghost" size="sm" title="Color de texto">
								<Type className="w-4 h-4" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-64">
							<div className="grid grid-cols-7 gap-1">
								{colors.map((color) => (
									// biome-ignore lint/a11y/useButtonType: <explanation>
									<button
										key={color}
										className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
										style={{ backgroundColor: color }}
										onClick={() => executeCommand("foreColor", color)}
									/>
								))}
							</div>
						</PopoverContent>
					</Popover>

					{/* Background Color */}
					<Popover>
						<PopoverTrigger asChild>
							<Button variant="ghost" size="sm" title="Color de fondo">
								<Highlighter className="w-4 h-4" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-64">
							<div className="grid grid-cols-7 gap-1">
								{colors.map((color) => (
									// biome-ignore lint/a11y/useButtonType: <explanation>
									<button
										key={color}
										className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
										style={{ backgroundColor: color }}
										onClick={() => executeCommand("backColor", color)}
									/>
								))}
							</div>
						</PopoverContent>
					</Popover>

					<Separator orientation="vertical" className="h-6 mx-1" />

					{/* Alignment */}
					<Button
						variant="ghost"
						size="sm"
						onClick={() => executeCommand("justifyLeft")}
						title="Alinear izquierda"
					>
						<AlignLeft className="w-4 h-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => executeCommand("justifyCenter")}
						title="Centrar"
					>
						<AlignCenter className="w-4 h-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => executeCommand("justifyRight")}
						title="Alinear derecha"
					>
						<AlignRight className="w-4 h-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => executeCommand("justifyFull")}
						title="Justificar"
					>
						<AlignJustify className="w-4 h-4" />
					</Button>

					<Separator orientation="vertical" className="h-6 mx-1" />

					{/* Lists */}
					<Button
						variant="ghost"
						size="sm"
						onClick={() => executeCommand("insertUnorderedList")}
						title="Lista con viñetas"
					>
						<List className="w-4 h-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => executeCommand("insertOrderedList")}
						title="Lista numerada"
					>
						<ListOrdered className="w-4 h-4" />
					</Button>

					{/* Indent */}
					<Button
						variant="ghost"
						size="sm"
						onClick={() => executeCommand("indent")}
						title="Aumentar sangría"
					>
						<Indent className="w-4 h-4" />
					</Button>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => executeCommand("outdent")}
						title="Disminuir sangría"
					>
						<Outdent className="w-4 h-4" />
					</Button>

					<Separator orientation="vertical" className="h-6 mx-1" />

					{/* Quote */}
					<Button
						variant="ghost"
						size="sm"
						onClick={() => executeCommand("formatBlock", "blockquote")}
						title="Cita"
					>
						<Quote className="w-4 h-4" />
					</Button>

					{/* Code */}
					<Button
						variant="ghost"
						size="sm"
						onClick={() => executeCommand("formatBlock", "pre")}
						title="Código"
					>
						<Code className="w-4 h-4" />
					</Button>

					{/* Link */}
					<Popover open={showLinkDialog} onOpenChange={setShowLinkDialog}>
						<PopoverTrigger asChild>
							<Button variant="ghost" size="sm" title="Insertar enlace">
								<LinkIcon className="w-4 h-4" />
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-80">
							<div className="space-y-3">
								<div>
									{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
									<label className="text-sm font-medium">
										Texto del enlace
									</label>
									<Input
										value={linkText}
										onChange={(e) => setLinkText(e.target.value)}
										placeholder="Texto a mostrar"
									/>
								</div>
								<div>
									{/* biome-ignore lint/a11y/noLabelWithoutControl: <explanation> */}
									<label className="text-sm font-medium">URL</label>
									<Input
										value={linkUrl}
										onChange={(e) => setLinkUrl(e.target.value)}
										placeholder="https://ejemplo.com"
									/>
								</div>
								<div className="flex gap-2">
									<Button size="sm" onClick={insertLink}>
										Insertar
									</Button>
									<Button
										size="sm"
										variant="outline"
										onClick={() => setShowLinkDialog(false)}
									>
										Cancelar
									</Button>
								</div>
							</div>
						</PopoverContent>
					</Popover>

					{/* Table */}
					<Button
						variant="ghost"
						size="sm"
						onClick={insertTable}
						title="Insertar tabla"
					>
						<Table className="w-4 h-4" />
					</Button>

					{/* Image */}
					<Button
						variant="ghost"
						size="sm"
						onClick={() => {
							const url = prompt("URL de la imagen:");
							if (url) executeCommand("insertImage", url);
						}}
						title="Insertar imagen"
					>
						<ImageIcon className="w-4 h-4" />
					</Button>
				</div>
			</div>

			{/* Editor */}
			<div
				ref={editorRef}
				contentEditable
				className="p-4 focus:outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
				style={{ minHeight }}
				onInput={handleInput}
				// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
				dangerouslySetInnerHTML={{ __html: value }}
				data-placeholder={placeholder}
			/>

			<style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        
        [contenteditable] blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 16px;
          margin: 16px 0;
          font-style: italic;
          color: #6b7280;
        }
        
        [contenteditable] pre {
          background-color: #f3f4f6;
          padding: 12px;
          border-radius: 6px;
          font-family: 'Courier New', monospace;
          overflow-x: auto;
        }
        
        [contenteditable] table {
          border-collapse: collapse;
          width: 100%;
          margin: 10px 0;
        }
        
        [contenteditable] table td {
          border: 1px solid #d1d5db;
          padding: 8px;
        }
        
        [contenteditable] ul, [contenteditable] ol {
          padding-left: 20px;
          margin: 10px 0;
        }
        
        [contenteditable] li {
          margin: 5px 0;
        }
      `}</style>
		</div>
	);
}

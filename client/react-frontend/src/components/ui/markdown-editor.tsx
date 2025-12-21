import { useState, type FC, useRef } from "react";
import { Textarea } from "./textarea";
import { Button } from "./button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Eye, Edit3, Bold, Italic, List, ListOrdered, Quote, Code, Link, Image } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const MarkdownEditor: FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = "Escribe aquí en formato Markdown...",
  className = "",
}) => {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:3000";

  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = document.querySelector("#markdown-textarea") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = before + selectedText + after;
    
    const newValue = value.substring(0, start) + newText + value.substring(end);
    onChange(newValue);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar los 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${serverUrl}/api/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir la imagen');
      }

      const result = await response.json();
      
      // Insert markdown image syntax
      const imageMarkdown = `![${file.name}](${result.url})`;
      const textarea = document.querySelector("#markdown-textarea") as HTMLTextAreaElement;
      
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue = value.substring(0, start) + imageMarkdown + value.substring(end);
        onChange(newValue);
        
        // Restore cursor position after image
        setTimeout(() => {
          textarea.focus();
          textarea.setSelectionRange(start + imageMarkdown.length, start + imageMarkdown.length);
        }, 0);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen. Por favor intenta nuevamente.');
    } finally {
      setIsUploading(false);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const toolbarButtons = [
    { icon: Bold, action: () => insertMarkdown("**", "**"), title: "Negrita" },
    { icon: Italic, action: () => insertMarkdown("*", "*"), title: "Cursiva" },
    { icon: List, action: () => insertMarkdown("- "), title: "Lista desordenada" },
    { icon: ListOrdered, action: () => insertMarkdown("1. "), title: "Lista ordenada" },
    { icon: Quote, action: () => insertMarkdown("> "), title: "Cita" },
    { icon: Code, action: () => insertMarkdown("`", "`"), title: "Código en línea" },
    { icon: Code, action: () => insertMarkdown("```\n", "\n```"), title: "Bloque de código" },
    { icon: Link, action: () => insertMarkdown("[", "](url)"), title: "Enlace" },
  ];

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
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
          
          {/* Image upload button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleImageClick}
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
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "edit" | "preview")}>
        <TabsList className="grid w-full grid-cols-2 m-0 rounded-none border-b">
          <TabsTrigger value="edit" className="flex items-center gap-2">
            <Edit3 className="w-4 h-4" />
            Editar
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Vista previa
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="m-0">
          <Textarea
            id="markdown-textarea"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="min-h-[200px] border-0 rounded-none resize-none focus:ring-0"
          />
        </TabsContent>

        <TabsContent value="preview" className="m-0">
          <div className="min-h-[200px] max-h-[400px] p-4 bg-white dark:bg-gray-900 overflow-auto">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {value ? (
                <ReactMarkdown>{value}</ReactMarkdown>
              ) : (
                <div className="text-gray-500 dark:text-gray-400 italic">
                  Vista previa del contenido Markdown...
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarkdownEditor;

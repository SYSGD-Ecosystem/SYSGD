import { useState, type FC } from "react";
import { Textarea } from "./textarea";
import { Button } from "./button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";
import { Eye, Edit3, Bold, Italic, List, ListOrdered, Quote, Code, Link } from "lucide-react";
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
          <div className="min-h-[200px] p-4 bg-white dark:bg-gray-900 overflow-auto">
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

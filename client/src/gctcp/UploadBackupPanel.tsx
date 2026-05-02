import { type FC, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface WorkspaceEntry {
  id: string;
  name: string;
  registro: unknown;
  [key: string]: unknown;
}

interface LedgerStructure {
  activeWorkspaceId: string;
  workspaces: WorkspaceEntry[];
  [key: string]: unknown;
}

interface ValidationResult {
  ok: boolean;
  msg: string | null;
  parsed?: LedgerStructure;
}

interface UploadBackupPanelProps {
  /** Callback invoked after a successful upload so the parent can reload data */
  onSuccess: () => void;
}

// ─── Validation ───────────────────────────────────────────────────────────────

const REQUIRED_KEYS = ["activeWorkspaceId", "workspaces"] as const;
const WORKSPACE_KEYS = ["id", "name", "registro"] as const;

// function validateStructure(text: string): ValidationResult {
//   if (!text.trim()) return { ok: false, msg: null };

//   let parsed: unknown;
//   try {
//     parsed = JSON.parse(text);
//   } catch (e: unknown) {
//     const msg = e instanceof Error ? e.message.split(" at ")[0] : "Error de sintaxis";
//     return { ok: false, msg: `JSON inválido: ${msg}` };
//   }

//   if (typeof parsed !== "object" || Array.isArray(parsed) || parsed === null)
//     return { ok: false, msg: "Se esperaba un objeto JSON, no un array o valor primitivo" };

//   const obj = parsed as Record<string, unknown>;

//   const missing = REQUIRED_KEYS.filter((k) => !(k in obj));
//   if (missing.length)
//     return { ok: false, msg: `Faltan campos requeridos: ${missing.join(", ")}` };

//   if (!Array.isArray(obj.workspaces) || obj.workspaces.length === 0)
//     return { ok: false, msg: '"workspaces" debe ser un array con al menos un espacio de trabajo' };

//   const workspaces = obj.workspaces as unknown[];
//   const badIdx = workspaces.findIndex(
//     (ws) =>
//       typeof ws !== "object" ||
//       ws === null ||
//       WORKSPACE_KEYS.some((k) => !(k in (ws as object))),
//   );
//   if (badIdx !== -1) {
//     const ws = workspaces[badIdx] as Record<string, unknown>;
//     const missingWs = WORKSPACE_KEYS.filter((k) => !(k in ws));
//     return {
//       ok: false,
//       msg: `workspace[${badIdx}] le faltan campos: ${missingWs.join(", ")}`,
//     };
//   }

//   const typedWorkspaces = workspaces as WorkspaceEntry[];
//   const active = typedWorkspaces.find((w) => w.id === obj.activeWorkspaceId);
//   if (!active)
//     return {
//       ok: false,
//       msg: `activeWorkspaceId "${String(obj.activeWorkspaceId)}" no coincide con ningún workspace`,
//     };

//   return {
//     ok: true,
//     msg: `Estructura válida — ${typedWorkspaces.length} espacio(s) de trabajo, activo: "${active.name}"`,
//     parsed: obj as LedgerStructure,
//   };
// }

// ─── Component ────────────────────────────────────────────────────────────────

function validateStructure(text: string): ValidationResult {
  if (!text.trim()) return { ok: false, msg: null };

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message.split(" at ")[0] : "Error de sintaxis";
    return { ok: false, msg: `JSON inválido: ${msg}` };
  }

  if (typeof parsed !== "object" || Array.isArray(parsed) || parsed === null)
    return { ok: false, msg: "Se esperaba un objeto JSON" };

  const obj = parsed as Record<string, unknown>;

  // ← Detectar si el usuario pegó la respuesta completa del servidor
  // y extraer automáticamente el campo "registro"
  const inner =
    "registro" in obj &&
    typeof obj.registro === "object" &&
    obj.registro !== null &&
    !Array.isArray(obj.registro)
      ? (obj.registro as Record<string, unknown>)
      : obj;

  // Validar la estructura interna
  const missing = REQUIRED_KEYS.filter((k) => !(k in inner));
  if (missing.length)
    return { ok: false, msg: `Faltan campos requeridos: ${missing.join(", ")}` };

  // ... resto igual, pero usando `inner` en lugar de `obj`
  if (!Array.isArray(inner.workspaces) || inner.workspaces.length === 0)
    return { ok: false, msg: '"workspaces" debe ser un array con al menos un espacio de trabajo' };

  const workspaces = inner.workspaces as unknown[];
  const badIdx = workspaces.findIndex(
    (ws) =>
      typeof ws !== "object" ||
      ws === null ||
      WORKSPACE_KEYS.some((k) => !(k in (ws as object))),
  );
  if (badIdx !== -1) {
    const ws = workspaces[badIdx] as Record<string, unknown>;
    const missingWs = WORKSPACE_KEYS.filter((k) => !(k in ws));
    return { ok: false, msg: `workspace[${badIdx}] le faltan campos: ${missingWs.join(", ")}` };
  }

  const typedWorkspaces = workspaces as WorkspaceEntry[];
  const active = typedWorkspaces.find((w) => w.id === inner.activeWorkspaceId);
  if (!active)
    return { ok: false, msg: `activeWorkspaceId "${String(inner.activeWorkspaceId)}" no coincide con ningún workspace` };

  return {
    ok: true,
    msg: `Estructura válida — ${typedWorkspaces.length} espacio(s), activo: "${active.name}"`,
    parsed: inner as LedgerStructure,  // ← siempre guarda el inner, no el wrapper
  };
}

const UploadBackupPanel: FC<UploadBackupPanelProps> = ({ onSuccess }) => {
  const { toast } = useToast();

  const [text, setText] = useState("");
  const [validation, setValidation] = useState<ValidationResult>({ ok: false, msg: null });
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const applyText = (value: string, immediate = false, fromFile?: string) => {
    setText(value);
    if (fromFile !== undefined) setFileName(fromFile || null);
    clearTimeout(debounceRef.current);
    if (immediate) {
      setValidation(validateStructure(value));
    } else {
      debounceRef.current = setTimeout(() => setValidation(validateStructure(value)), 380);
    }
  };

  const loadFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".json")) {
      setValidation({ ok: false, msg: "Solo se aceptan archivos .json" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => applyText((e.target?.result as string) ?? "", true, file.name);
    reader.readAsText(file);
  };

  const clearAll = () => {
    setText("");
    setFileName(null);
    setValidation({ ok: false, msg: null });
    clearTimeout(debounceRef.current);
  };

  // ── Upload ─────────────────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!validation.ok || !validation.parsed || uploading) return;
    setUploading(true);
    try {
      await api.put("/api/cont-ledger", { registro: validation.parsed });
      toast({ title: "Éxito", description: "Backup restaurado correctamente" });
      onSuccess();
    } catch {
      toast({
        title: "Error al restaurar",
        description: "No se pudo subir el backup. Verifica tu conexión e intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // ── Drag & drop ────────────────────────────────────────────────────────────

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  };

  // ── Derived UI state ───────────────────────────────────────────────────────

  const borderColor = validation.msg === null
    ? "border-gray-300 dark:border-gray-600"
    : validation.ok
      ? "border-emerald-400 dark:border-emerald-500"
      : "border-red-400 dark:border-red-500";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 p-6 w-full max-w-lg mx-auto">

      {/* Header */}
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          Restaurar desde backup
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          Selecciona o arrastra un archivo <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">.json</code>,
          o pega el contenido directamente
        </p>
      </div>

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Zona de carga de archivo JSON"
        onClick={() => fileRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          "relative flex flex-col items-center justify-center gap-3 rounded-xl",
          "border-2 border-dashed px-6 py-8 cursor-pointer select-none",
          "transition-colors duration-150",
          isDragging
            ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800/40",
        ].join(" ")}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) loadFile(file);
            e.target.value = "";
          }}
        />

        {/* Icon */}
        <div className={[
          "w-12 h-12 rounded-lg flex items-center justify-center transition-colors",
          isDragging
            ? "bg-blue-100 dark:bg-blue-800/40"
            : "bg-gray-100 dark:bg-gray-800",
        ].join(" ")}>
          <svg
            width="22" height="22" viewBox="0 0 22 22" fill="none"
            className="text-gray-500 dark:text-gray-400"
          >
            <path
              d="M13 2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-6z"
              stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round"
            />
            <path
              d="M13 2v6h6M11 12v5M8.5 14.5 11 12l2.5 2.5"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="text-center">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isDragging ? "Suelta el archivo aquí" : "Arrastra tu archivo JSON"}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            o haz clic para seleccionar
          </p>
        </div>

        {/* File name badge */}
        {fileName && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white dark:bg-gray-800
              border border-gray-200 dark:border-gray-700 shadow-sm max-w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="shrink-0 text-gray-400">
              <rect x="1.5" y="1" width="10" height="11" rx="1.5" stroke="currentColor" strokeWidth="1"/>
              <path d="M3.5 5h6M3.5 7h6M3.5 9h4" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"/>
            </svg>
            <span className="text-xs text-gray-600 dark:text-gray-300 truncate max-w-[180px]">
              {fileName}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); clearAll(); }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors text-xs shrink-0"
              aria-label="Quitar archivo"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        <span className="text-xs text-gray-400 dark:text-gray-500">o pega el contenido</span>
        <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => applyText(e.target.value)}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData("text");
            // validate immediately on paste, no debounce
            setTimeout(() => applyText(pasted, true), 10);
          }}
          placeholder={'{"activeWorkspaceId": "...", "workspaces": [...]}'}
          rows={6}
          spellCheck={false}
          className={[
            "w-full font-mono text-xs rounded-lg px-3 py-2.5 resize-y",
            "border bg-gray-50 dark:bg-gray-900/60",
            "text-gray-800 dark:text-gray-200",
            "placeholder:text-gray-300 dark:placeholder:text-gray-600",
            "focus:outline-none focus:ring-2 focus:ring-offset-0",
            "transition-colors duration-150",
            borderColor,
            validation.ok
              ? "focus:ring-emerald-300 dark:focus:ring-emerald-700"
              : "focus:ring-gray-300 dark:focus:ring-gray-600",
          ].join(" ")}
        />
        {text && (
          <button
            type="button"
            onClick={clearAll}
            className="absolute top-2 right-2 text-xs text-gray-400 hover:text-gray-600
              dark:hover:text-gray-200 transition-colors"
            aria-label="Limpiar contenido"
          >
            ✕
          </button>
        )}
      </div>

      {/* Validation feedback */}
      {validation.msg && (
        <div className={[
          "flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs",
          validation.ok
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-400"
            : "bg-red-50 text-red-700 dark:bg-red-900/25 dark:text-red-400",
        ].join(" ")}>
          <span className="shrink-0 font-bold mt-px">{validation.ok ? "✓" : "✕"}</span>
          <span>{validation.msg}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-1">
        {text && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Limpiar
          </button>
        )}
        <button
          type="button"
          onClick={() => void handleUpload()}
          disabled={!validation.ok || uploading}
          className={[
            "px-4 py-2 text-sm rounded-lg font-medium transition-all duration-150",
            validation.ok && !uploading
              ? "bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white cursor-pointer"
              : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed",
          ].join(" ")}
        >
          {uploading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              Restaurando...
            </span>
          ) : (
            "Restaurar backup"
          )}
        </button>
      </div>
    </div>
  );
};

export default UploadBackupPanel;
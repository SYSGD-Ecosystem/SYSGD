import type { FC } from "react";
import { FileSpreadsheet, FileText, Printer, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

type Props = {
  pageSize: "A4" | "Carta";
  onPageSizeChange: (v: "A4" | "Carta") => void;
  documentId?: string;
  isSaving: boolean;
  onSave: () => void;
  onExportXlsx: () => void;
  onExportPdf: () => void;
  onPrint: () => void;
};

const ToolBtn: FC<{ icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }> = ({
  icon, label, onClick, disabled,
}) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClick}
          disabled={disabled}
          className="h-8 px-2.5 gap-1.5 text-xs font-normal text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          {icon}
          <span className="hidden sm:inline">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent className="sm:hidden">{label}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export const Toolbar: FC<Props> = ({
  pageSize, onPageSizeChange,
  documentId, isSaving, onSave,
  onExportXlsx, onExportPdf, onPrint,
}) => (
  <div className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
    {/* App title */}
    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 mr-2 pl-1 whitespace-nowrap">
      Registro TCP
    </span>

    <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

    {documentId && (
      <ToolBtn
        icon={<Save className="w-3.5 h-3.5" />}
        label={isSaving ? "Guardando…" : "Guardar"}
        onClick={onSave}
        disabled={isSaving}
      />
    )}

    <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

    <ToolBtn
      icon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
      label="Excel"
      onClick={onExportXlsx}
    />
    <ToolBtn
      icon={<FileText className="w-3.5 h-3.5 text-red-500" />}
      label="PDF"
      onClick={onExportPdf}
    />
    <ToolBtn
      icon={<Printer className="w-3.5 h-3.5" />}
      label="Imprimir"
      onClick={onPrint}
    />

    <div className="w-px h-5 bg-slate-200 dark:bg-slate-700 mx-1" />

    <div className="flex items-center gap-1.5">
      <span className="text-xs text-slate-500">Tamaño:</span>
      <Select value={pageSize} onValueChange={(v) => onPageSizeChange(v as "A4" | "Carta")}>
        <SelectTrigger className="h-7 w-20 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="A4">A4</SelectItem>
          <SelectItem value="Carta">Carta</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);

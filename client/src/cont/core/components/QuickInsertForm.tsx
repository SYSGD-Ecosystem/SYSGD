import type { FC } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { MonthEntries } from "../types";
import { MONTH_NAMES, MONTH_NAME_TO_CODE } from "../utils/constants";
import type { Dispatch, SetStateAction } from "react";

type Props = {
  activeSheet: "INGRESOS" | "GASTOS";
  setIngresos: Dispatch<SetStateAction<MonthEntries>>;
  setGastos: Dispatch<SetStateAction<MonthEntries>>;
  onYearChange: (year: string) => void;
};

export const QuickInsertForm: FC<Props> = ({
  activeSheet, setIngresos, setGastos, onYearChange,
}) => {
  const [form, setForm] = useState({ anio: "", mes: "Enero", dia: "", importe: "" });

  const handleInsert = () => {
    const monthCode = MONTH_NAME_TO_CODE[form.mes];
    if (!monthCode || !form.importe || !form.dia) return;

    const setter = activeSheet === "INGRESOS" ? setIngresos : setGastos;
    setter((prev) => {
      const rows = [...prev[monthCode]];
      const firstEmpty = rows.findIndex((r) => !r.importe);
      const target = firstEmpty >= 0 ? firstEmpty : 0;
      rows[target] = { dia: form.dia, importe: form.importe };
      return { ...prev, [monthCode]: rows };
    });

    if (form.anio) onYearChange(form.anio);
    setForm((prev) => ({ ...prev, dia: "", importe: "" }));
  };

  return (
    <div className="flex flex-wrap items-end gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-800 border-b">
      <div>
        <Label className="text-xs">Año</Label>
        <Input
          value={form.anio}
          onChange={(e) => setForm((p) => ({ ...p, anio: e.target.value }))}
          className="h-7 w-20 text-xs"
        />
      </div>
      <div>
        <Label className="text-xs">Mes</Label>
        <Select value={form.mes} onValueChange={(v) => setForm((p) => ({ ...p, mes: v }))}>
          <SelectTrigger className="h-7 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTH_NAMES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Día</Label>
        <Input
          value={form.dia}
          onChange={(e) => setForm((p) => ({ ...p, dia: e.target.value }))}
          className="h-7 w-16 text-xs"
        />
      </div>
      <div>
        <Label className="text-xs">{activeSheet === "INGRESOS" ? "Ingreso" : "Gasto"}</Label>
        <Input
          value={form.importe}
          onChange={(e) => setForm((p) => ({ ...p, importe: e.target.value }))}
          className="h-7 w-28 text-xs"
        />
      </div>
      <Button size="sm" className="h-7 text-xs" onClick={handleInsert}>
        Insertar
      </Button>
    </div>
  );
};

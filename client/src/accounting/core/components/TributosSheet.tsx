import type { FC, KeyboardEvent } from "react";
import { useMemo, useRef } from "react";
import { Input } from "@/components/ui/input";
import type { TributosEntry } from "../types";
import { computeTributoRow, computeTributoTotals } from "../utils/helpers";
import { INSTRUCTIONS } from "../utils/constants";
import { useGridNavigation } from "../hooks/useGridNavigation";

const EDITABLE_FIELDS = ["b","c","d","e","f","h","i","j","l","m","n","o","p"] as const;
const TOTAL_ROWS = 12; // one per month
const TOTAL_COLS = EDITABLE_FIELDS.length; // 13 editable columns

type Props = {
  tributos: TributosEntry[];
  onChange: (rowIndex: number, field: keyof TributosEntry, value: string) => void;
};

export const TributosSheet: FC<Props> = ({ tributos, onChange }) => {
  const rows = useMemo(() => tributos.map(computeTributoRow), [tributos]);
  const totals = useMemo(() => computeTributoTotals(rows), [rows]);
  const containerRef = useRef<HTMLTableElement>(null);
  const { handleKeyDown } = useGridNavigation(containerRef as React.RefObject<HTMLElement>);

  return (
    <table ref={containerRef} id="myTable" className="w-full min-w-[1300px] border-collapse text-xs">
      <thead>
        <tr>
          <th colSpan={16} className="border p-2 bg-slate-200 dark:bg-slate-700">
            TRIBUTOS Y OTROS GASTOS ASOCIADOS A LA ACTIVIDAD
          </th>
        </tr>
        <tr>
          <th rowSpan={3} className="border p-2">Mes</th>
          <th colSpan={9} className="border p-2">TRIBUTOS PAGADOS DEDUCIBLES EN LA DECLARACIÓN JURADA</th>
          <th rowSpan={2} className="border p-2">Subtotal</th>
          <th colSpan={4} className="border p-2">Otros gastos deducibles</th>
          <th rowSpan={2} className="border p-2">Cuota Mensual (5%)</th>
        </tr>
        <tr>
          {["1","2","3","4","5"].map((n) => <th key={n} rowSpan={2} className="border p-2">{n}</th>)}
          <th colSpan={3} className="border p-2">6</th>
          <th rowSpan={2} className="border p-2">9</th>
          {["11","12","13","14"].map((n) => <th key={n} rowSpan={2} className="border p-2">{n}</th>)}
        </tr>
        <tr>
          <th className="border p-2">Total</th>
          <th className="border p-2">0.125</th>
          <th className="border p-2">0.015</th>
          <th className="border p-2">15</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, rowIdx) => (
          <tr key={row.mes}>
            <td className="border p-2 font-medium">{row.mes}</td>
            {EDITABLE_FIELDS.map((field, colIdx) => (
              <td key={`${row.mes}-${field}`} className="border p-0">
                <Input
                  value={row[field]}
                  data-cell={`${rowIdx}-${colIdx}`}
                  onChange={(e) => onChange(rowIdx, field, e.target.value)}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) =>
                    handleKeyDown(e, rowIdx, colIdx, TOTAL_ROWS, TOTAL_COLS)
                  }
                  className="h-8 border-0 rounded-none text-right"
                />
              </td>
            ))}
            <td className="border p-2 text-right font-semibold">{row.g.toFixed(2)}</td>
            <td className="border p-2 text-right font-semibold">{row.k.toFixed(2)}</td>
          </tr>
        ))}
        <tr className="font-bold bg-slate-100 dark:bg-slate-800">
          <td className="border p-2">Total pagado</td>
          {EDITABLE_FIELDS.map((field) => (
            <td key={field} className="border p-2 text-right">{totals[field].toFixed(2)}</td>
          ))}
          <td className="border p-2 text-right">{totals.g.toFixed(2)}</td>
          <td className="border p-2 text-right">{totals.k.toFixed(2)}</td>
        </tr>
        {INSTRUCTIONS.map((text, i) => (
          <tr key={`instr-${i}`}>
            <td colSpan={16} className="border p-2 text-left whitespace-pre-wrap">{text}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

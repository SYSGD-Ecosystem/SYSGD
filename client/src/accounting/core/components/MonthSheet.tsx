import {
  type ChangeEvent,
  type Dispatch,
  type FC,
  type KeyboardEvent,
  type SetStateAction,
  useRef,
} from "react";
import { Input } from "@/components/ui/input";
import type { MonthCode, MonthEntries, MonthEntry } from "../types";
import { MONTH_CODES, DAY_COLUMN_WIDTH_PX, MONTH_COLUMN_WIDTH_PX } from "../utils/constants";
import { useGridNavigation } from "../hooks/useGridNavigation";

type Props = {
  title: "INGRESOS" | "GASTOS";
  entries: MonthEntries;
  totals: number[];
  annual: number;
  setter: Dispatch<SetStateAction<MonthEntries>>;
};

const updateCell = (
  setter: Dispatch<SetStateAction<MonthEntries>>,
  month: MonthCode,
  rowIndex: number,
  field: keyof MonthEntry,
  value: string,
) => {
  setter((prev) => {
    const nextRows = [...prev[month]];
    nextRows[rowIndex] = { ...nextRows[rowIndex], [field]: value };
    return { ...prev, [month]: nextRows };
  });
};

const TOTAL_ROWS = 36;
const TOTAL_COLS = MONTH_CODES.length * 2; // día + importe × 12 meses = 24

export const MonthSheet: FC<Props> = ({ title, entries, totals, annual, setter }) => {
  const containerRef = useRef<HTMLTableElement>(null);
  const { handleKeyDown } = useGridNavigation(containerRef as React.RefObject<HTMLElement>);

  return (
    <table
      id="myTable"
      ref={containerRef}
      className="w-full min-w-[1104px] border-collapse table-fixed"
    >
      <colgroup>
        {MONTH_CODES.flatMap((month) => [
          <col key={`${month}-day-col`} style={{ width: `${DAY_COLUMN_WIDTH_PX}px` }} />,
          <col key={`${month}-month-col`} style={{ width: `${MONTH_COLUMN_WIDTH_PX}px` }} />,
        ])}
      </colgroup>

      <thead>
        <tr>
          <th
            colSpan={24}
            className="border py-1 px-0 text-center bg-slate-200 dark:bg-slate-700 font-bold text-[10px]"
          >
            {title}
          </th>
        </tr>
        <tr>
          {MONTH_CODES.map((month, idx) => (
            <>
              <th key={`${month}-day`} className="border py-0.5 px-0 bg-slate-100 dark:bg-slate-800 text-[10px]">D</th>
              <th key={`${month}-amount`} className="border py-0.5 px-0 bg-slate-100 dark:bg-slate-800 text-[10px]">{MONTH_CODES[idx]}</th>
            </>
          ))}
        </tr>
      </thead>

      <tbody>
        {Array.from({ length: TOTAL_ROWS }, (_, rowIndex) => (
          <tr key={`row-${rowIndex}`}>
            {MONTH_CODES.map((month, monthIdx) => {
              const dayCol     = monthIdx * 2;
              const importeCol = monthIdx * 2 + 1;
              return (
                <>
                  <td key={`${month}-day-${rowIndex}`} className="border p-0">
                    <Input
                      value={entries[month][rowIndex].dia}
                      data-cell={`${rowIndex}-${dayCol}`}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        updateCell(setter, month, rowIndex, "dia", e.target.value)
                      }
                      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) =>
                        handleKeyDown(e, rowIndex, dayCol, TOTAL_ROWS, TOTAL_COLS)
                      }
                      className="h-7 rounded-none border-0 px-0 py-0 text-center text-[12px] leading-none"
                    />
                  </td>
                  <td key={`${month}-amount-${rowIndex}`} className="border p-0">
                    <Input
                      value={entries[month][rowIndex].importe}
                      data-cell={`${rowIndex}-${importeCol}`}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        updateCell(setter, month, rowIndex, "importe", e.target.value)
                      }
                      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) =>
                        handleKeyDown(e, rowIndex, importeCol, TOTAL_ROWS, TOTAL_COLS)
                      }
                      className="h-7 rounded-none border-0 px-0 py-0 text-right text-[12px] leading-none"
                    />
                  </td>
                </>
              );
            })}
          </tr>
        ))}

        <tr>
          {MONTH_CODES.map((month, idx) => (
            <>
              {/* D column: label on first month, empty on rest */}
              <td key={`${month}-label`} className="border px-1 py-2 text-[11px] font-bold whitespace-nowrap">
                {idx === 0 ? "Total" : ""}
              </td>
              {/* Importe column: the month total */}
              <td key={`${month}-total`} className="border p-2 text-right font-semibold text-[12px]">
                {totals[idx].toFixed(2)}
              </td>
            </>
          ))}
        </tr>
        <tr>
          <td colSpan={22} className="border p-2 text-right font-semibold text-[12px]">
            Total de {title === "INGRESOS" ? "Ingresos" : "Gastos"} Anuales
          </td>
          <td colSpan={2} className="border p-2 text-right font-bold text-[12px]">
            {annual.toFixed(2)}
          </td>
        </tr>
      </tbody>
    </table>
  );
};

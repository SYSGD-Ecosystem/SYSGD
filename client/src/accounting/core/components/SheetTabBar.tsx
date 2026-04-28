import type { FC } from "react";
import type { SheetTab } from "../types";

const TABS: SheetTab[] = ["GENERALES", "INGRESOS", "GASTOS", "TRIBUTOS"];

const TAB_COLORS: Record<SheetTab, string> = {
  GENERALES: "bg-blue-600",
  INGRESOS:  "bg-emerald-600",
  GASTOS:    "bg-rose-600",
  TRIBUTOS:  "bg-amber-600",
};

type Props = {
  active: SheetTab;
  onChange: (tab: SheetTab) => void;
};

export const SheetTabBar: FC<Props> = ({ active, onChange }) => (
  <div className="flex items-end gap-0.5 px-2 bg-slate-200 dark:bg-slate-800 border-t border-slate-300 dark:border-slate-700 select-none">
    {TABS.map((tab) => {
      const isActive = active === tab;
      return (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`
            relative px-5 py-1.5 text-[11px] font-medium tracking-wide rounded-t
            transition-all cursor-pointer border border-b-0
            ${isActive
              ? "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 -mb-px z-10 shadow-sm"
              : "bg-slate-100 dark:bg-slate-700 border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600 hover:text-slate-700 dark:hover:text-slate-200"
            }
          `}
        >
          {isActive && (
            <span className={`absolute top-0 left-0 right-0 h-0.5 rounded-t ${TAB_COLORS[tab]}`} />
          )}
          {tab}
        </button>
      );
    })}
  </div>
);

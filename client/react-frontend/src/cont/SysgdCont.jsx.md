import { useState, useCallback } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const MONTHS = ["ENE","FEB","MAR","ABR","MAY","JUN","JUL","AGO","SEP","OCT","NOV","DIC"];
const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MAX_ROWS = 36; // daily entries per month
const CURRENT_YEAR = new Date().getFullYear();

const TRIBUTOS_COLS = [
  { key: "ventas",    label: "Imp. s/ Ventas/Servicios (10%) — 011402" },
  { key: "fuerza",   label: "Imp. Utilización Fuerza de Trabajo — 061032" },
  { key: "sellos",   label: "Imp. sobre Documentos y Sellos — 073012" },
  { key: "anuncios", label: "Tasa Radicación Anuncios — 090012" },
  { key: "css20",    label: "Contribución Esp. Seguridad Social (20%) — 082013" },
  { key: "css14",    label: "Contribución Seg. Social (14%) — 081013" },
  { key: "otros",    label: "Otros" },
];

const OTROS_GASTOS_COLS = [
  { key: "restauracion", label: "Contribución Restauración/Preservación Zonas" },
  { key: "arrendamiento", label: "Pago arrendamiento bienes a entidades estatales" },
  { key: "exonerado",    label: "Importes exonerados por arrendam. (gastos reparaciones)" },
  { key: "otrosMFP",    label: "Otros Gastos autorizados MFP" },
];

const TAB_IDS = ["generales","ingresos","gastos","tributos"];
const TAB_LABELS = ["Generales","Ingresos","Gastos","Tributos"];

// ─── INITIAL STATE ────────────────────────────────────────────────────────────
function makeMonthEntries() {
  return MONTHS.reduce((acc, m) => {
    acc[m] = Array.from({ length: MAX_ROWS }, () => ({ dia: "", importe: "" }));
    return acc;
  }, {});
}

function makeTributoRows() {
  return MONTH_NAMES.map(mes => ({
    mes,
    ...TRIBUTOS_COLS.reduce((a, c) => { a[c.key] = ""; return a; }, {}),
    ...OTROS_GASTOS_COLS.reduce((a, c) => { a[c.key] = ""; return a; }, {}),
    cuotaMensual: "",
  }));
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const num = (v) => parseFloat(v) || 0;

function monthTotal(entries) {
  return entries.reduce((s, r) => s + num(r.importe), 0);
}

function formatCUP(val) {
  if (val === 0) return "—";
  return new Intl.NumberFormat("es-CU", { minimumFractionDigits: 2 }).format(val);
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

// Numeric cell input — aligned right, clean
function NumInput({ value, onChange, placeholder = "", className = "" }) {
  return (
    <input
      type="number"
      min="0"
      step="0.01"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full text-right bg-transparent border-0 border-b border-slate-200 focus:border-indigo-400 focus:outline-none text-sm py-0.5 px-1 text-slate-800 placeholder-slate-300 ${className}`}
    />
  );
}

function TextInput({ value, onChange, placeholder = "", className = "" }) {
  return (
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-transparent border-0 border-b border-slate-200 focus:border-indigo-400 focus:outline-none text-sm py-1 px-1 text-slate-800 placeholder-slate-300 ${className}`}
    />
  );
}

// ─── TAB: GENERALES ───────────────────────────────────────────────────────────
function TabGenerales({ data, onChange }) {
  const set = (field) => (val) => onChange({ ...data, [field]: val });

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
        <h2 className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-4">
          Datos del Contribuyente
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs text-slate-400 font-medium">Nombre(s) y Apellidos</label>
            <TextInput value={data.nombre} onChange={set("nombre")} placeholder="Nombre completo del contribuyente" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Año Fiscal</label>
            <select
              value={data.anio}
              onChange={e => set("anio")(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:border-indigo-400 focus:outline-none"
            >
              {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">NIT</label>
            <TextInput value={data.nit} onChange={set("nit")} placeholder="Número de Identificación Tributaria" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Actividad</label>
            <TextInput value={data.actividad} onChange={set("actividad")} placeholder="Tipo de actividad económica" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Código de Actividad</label>
            <TextInput value={data.codigo} onChange={set("codigo")} placeholder="Código" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Domicilio Fiscal */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 space-y-3 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Domicilio Fiscal
          </h3>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Calle, No., Apto., entre calles</label>
            <TextInput value={data.fiscalCalle} onChange={set("fiscalCalle")} placeholder="Dirección fiscal" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Municipio</label>
              <TextInput value={data.fiscalMunicipio} onChange={set("fiscalMunicipio")} placeholder="Municipio" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Provincia</label>
              <TextInput value={data.fiscalProvincia} onChange={set("fiscalProvincia")} placeholder="Provincia" />
            </div>
          </div>
        </div>

        {/* Domicilio Legal */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 space-y-3 shadow-sm">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Domicilio Legal <span className="text-slate-300 font-normal normal-case">(según Carnet de Identidad)</span>
          </h3>
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Calle, No., Apto., entre calles</label>
            <TextInput value={data.legalCalle} onChange={set("legalCalle")} placeholder="Dirección legal" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Municipio</label>
              <TextInput value={data.legalMunicipio} onChange={set("legalMunicipio")} placeholder="Municipio" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Provincia</label>
              <TextInput value={data.legalProvincia} onChange={set("legalProvincia")} placeholder="Provincia" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TAB: INGRESOS / GASTOS (shared layout) ───────────────────────────────────
function TabMovimientos({ type, entries, onChange }) {
  const [activeMonth, setActiveMonth] = useState(0);
  const month = MONTHS[activeMonth];
  const rows = entries[month];

  const updateRow = useCallback((idx, field, val) => {
    onChange(prev => {
      const updated = { ...prev };
      updated[month] = [...updated[month]];
      updated[month][idx] = { ...updated[month][idx], [field]: val };
      return updated;
    });
  }, [month, onChange]);

  const total = monthTotal(rows);
  const annualTotal = MONTHS.reduce((s, m) => s + monthTotal(entries[m]), 0);

  const isIngresos = type === "ingresos";
  const color = isIngresos ? "emerald" : "rose";
  const colorMap = {
    emerald: {
      tab: "bg-emerald-500 text-white",
      tabInactive: "text-emerald-600 hover:bg-emerald-50",
      total: "bg-emerald-50 text-emerald-700 border-emerald-200",
      annual: "bg-emerald-600 text-white",
      header: "bg-emerald-600",
      rowAlt: "bg-emerald-50/40",
    },
    rose: {
      tab: "bg-rose-500 text-white",
      tabInactive: "text-rose-600 hover:bg-rose-50",
      total: "bg-rose-50 text-rose-700 border-rose-200",
      annual: "bg-rose-600 text-white",
      header: "bg-rose-600",
      rowAlt: "bg-rose-50/40",
    },
  }[color];

  // Month totals bar
  const maxMonthTotal = Math.max(...MONTHS.map(m => monthTotal(entries[m])), 1);

  return (
    <div className="space-y-4">
      {/* Month selector */}
      <div className="flex gap-1 flex-wrap">
        {MONTHS.map((m, i) => {
          const mTotal = monthTotal(entries[m]);
          return (
            <button
              key={m}
              onClick={() => setActiveMonth(i)}
              className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                i === activeMonth
                  ? colorMap.tab
                  : `bg-slate-50 border border-slate-200 ${colorMap.tabInactive}`
              }`}
            >
              {m}
              {mTotal > 0 && (
                <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                  i === activeMonth ? "bg-white/60" : `bg-${color}-400`
                }`} />
              )}
            </button>
          );
        })}
      </div>

      {/* Mini bar chart */}
      <div className="flex items-end gap-0.5 h-8 bg-slate-50 rounded-lg px-2 py-1 overflow-hidden">
        {MONTHS.map((m, i) => {
          const mTotal = monthTotal(entries[m]);
          const height = maxMonthTotal > 0 ? (mTotal / maxMonthTotal) * 100 : 0;
          return (
            <div key={m} className="flex-1 flex flex-col justify-end">
              <div
                className={`rounded-sm transition-all ${i === activeMonth ? `bg-${color}-500` : `bg-${color}-200`}`}
                style={{ height: `${Math.max(height, mTotal > 0 ? 8 : 0)}%` }}
              />
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className={`${colorMap.header} text-white`}>
              <th className="py-2 px-3 text-left font-semibold w-12">#</th>
              <th className="py-2 px-3 text-center font-semibold w-16">Día</th>
              <th className="py-2 px-3 text-right font-semibold">
                {isIngresos ? "Ingreso" : "Gasto"} (CUP)
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const hasData = row.dia || row.importe;
              return (
                <tr
                  key={idx}
                  className={`border-b border-slate-100 transition-colors ${
                    hasData ? (idx % 2 === 0 ? colorMap.rowAlt : "bg-white") : "bg-white hover:bg-slate-50/50"
                  }`}
                >
                  <td className="px-3 py-0.5 text-slate-300 text-xs tabular-nums">{idx + 1}</td>
                  <td className="px-2 py-0.5">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={row.dia}
                      onChange={e => updateRow(idx, "dia", e.target.value)}
                      placeholder="—"
                      className="w-full text-center bg-transparent border-0 border-b border-slate-100 focus:border-indigo-400 focus:outline-none text-sm py-0.5 text-slate-600 placeholder-slate-200"
                    />
                  </td>
                  <td className="px-2 py-0.5">
                    <NumInput
                      value={row.importe}
                      onChange={v => updateRow(idx, "importe", v)}
                      placeholder="0.00"
                    />
                  </td>
                </tr>
              );
            })}

            {/* Total row */}
            <tr className={`${colorMap.total} border-t-2 border-current font-bold`}>
              <td colSpan={2} className="px-3 py-2 text-sm">Total {MONTH_NAMES[activeMonth]}</td>
              <td className="px-3 py-2 text-right text-sm tabular-nums">{formatCUP(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Annual summary */}
      <div className={`flex items-center justify-between rounded-xl px-5 py-3 ${colorMap.annual}`}>
        <span className="text-sm font-semibold text-white/80">
          Total Anual de {isIngresos ? "Ingresos" : "Gastos"}
        </span>
        <span className="text-xl font-bold tabular-nums tracking-tight">
          {formatCUP(annualTotal)} CUP
        </span>
      </div>
    </div>
  );
}

// ─── TAB: TRIBUTOS ────────────────────────────────────────────────────────────
function TabTributos({ rows, onChange }) {
  const updateRow = (idx, field, val) => {
    onChange(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: val };
      return updated;
    });
  };

  const colTotal = (col) => rows.reduce((s, r) => s + num(r[col]), 0);

  return (
    <div className="space-y-4">
      {/* Tributos pagados */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
          Tributos Pagados Deducibles en la Declaración Jurada
        </h3>
        <div className="border border-slate-200 rounded-xl overflow-auto shadow-sm">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-violet-600 text-white">
                <th className="py-2 px-3 text-left font-semibold min-w-24">Mes</th>
                {TRIBUTOS_COLS.map(c => (
                  <th key={c.key} className="py-2 px-2 text-center font-medium min-w-28 leading-tight">
                    {c.label.split("—")[0].trim()}
                  </th>
                ))}
                <th className="py-2 px-2 text-right font-semibold min-w-24 bg-violet-700">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const subtotal = TRIBUTOS_COLS.reduce((s, c) => s + num(row[c.key]), 0);
                return (
                  <tr key={idx} className={`border-b border-slate-100 ${idx % 2 === 0 ? "bg-violet-50/30" : "bg-white"}`}>
                    <td className="px-3 py-1 font-medium text-slate-600">{row.mes}</td>
                    {TRIBUTOS_COLS.map(c => (
                      <td key={c.key} className="px-1 py-0.5">
                        <NumInput value={row[c.key]} onChange={v => updateRow(idx, c.key, v)} />
                      </td>
                    ))}
                    <td className="px-3 py-1 text-right font-semibold text-violet-700 tabular-nums bg-violet-50">
                      {formatCUP(subtotal)}
                    </td>
                  </tr>
                );
              })}
              {/* Totals */}
              <tr className="bg-violet-600 text-white font-bold">
                <td className="px-3 py-2">Total pagado</td>
                {TRIBUTOS_COLS.map(c => (
                  <td key={c.key} className="px-3 py-2 text-right tabular-nums">
                    {formatCUP(colTotal(c.key))}
                  </td>
                ))}
                <td className="px-3 py-2 text-right tabular-nums bg-violet-700">
                  {formatCUP(TRIBUTOS_COLS.reduce((s, c) => s + colTotal(c.key), 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Otros gastos deducibles */}
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
          Otros Gastos Deducibles de la Base Imponible
        </h3>
        <div className="border border-slate-200 rounded-xl overflow-auto shadow-sm">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-amber-600 text-white">
                <th className="py-2 px-3 text-left font-semibold min-w-24">Mes</th>
                {OTROS_GASTOS_COLS.map(c => (
                  <th key={c.key} className="py-2 px-2 text-center font-medium min-w-36 leading-tight">
                    {c.label}
                  </th>
                ))}
                <th className="py-2 px-2 text-center font-semibold min-w-24">Cuota Mensual (5%)</th>
                <th className="py-2 px-2 text-right font-semibold min-w-24 bg-amber-700">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const subtotal = OTROS_GASTOS_COLS.reduce((s, c) => s + num(row[c.key]), 0) + num(row.cuotaMensual);
                return (
                  <tr key={idx} className={`border-b border-slate-100 ${idx % 2 === 0 ? "bg-amber-50/30" : "bg-white"}`}>
                    <td className="px-3 py-1 font-medium text-slate-600">{row.mes}</td>
                    {OTROS_GASTOS_COLS.map(c => (
                      <td key={c.key} className="px-1 py-0.5">
                        <NumInput value={row[c.key]} onChange={v => updateRow(idx, c.key, v)} />
                      </td>
                    ))}
                    <td className="px-1 py-0.5">
                      <NumInput value={row.cuotaMensual} onChange={v => updateRow(idx, "cuotaMensual", v)} />
                    </td>
                    <td className="px-3 py-1 text-right font-semibold text-amber-700 tabular-nums bg-amber-50">
                      {formatCUP(subtotal)}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-amber-600 text-white font-bold">
                <td className="px-3 py-2">Total pagado</td>
                {OTROS_GASTOS_COLS.map(c => (
                  <td key={c.key} className="px-3 py-2 text-right tabular-nums">
                    {formatCUP(colTotal(c.key))}
                  </td>
                ))}
                <td className="px-3 py-2 text-right tabular-nums">{formatCUP(colTotal("cuotaMensual"))}</td>
                <td className="px-3 py-2 text-right tabular-nums bg-amber-700">
                  {formatCUP(
                    OTROS_GASTOS_COLS.reduce((s, c) => s + colTotal(c.key), 0) + colTotal("cuotaMensual")
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function SysgdCont() {
  const [activeTab, setActiveTab] = useState(0);

  const [generales, setGenerales] = useState({
    nombre: "", anio: CURRENT_YEAR, nit: "", actividad: "", codigo: "",
    fiscalCalle: "", fiscalMunicipio: "", fiscalProvincia: "",
    legalCalle: "", legalMunicipio: "", legalProvincia: "",
  });

  const [ingresos, setIngresos] = useState(makeMonthEntries);
  const [gastos, setGastos] = useState(makeMonthEntries);
  const [tributos, setTributos] = useState(makeTributoRows);

  // Summary stats
  const totalIngresos = MONTHS.reduce((s, m) => s + monthTotal(ingresos[m]), 0);
  const totalGastos = MONTHS.reduce((s, m) => s + monthTotal(gastos[m]), 0);
  const resultado = totalIngresos - totalGastos;

  return (
    <div className="min-h-screen bg-slate-50 font-sans" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-slate-400 leading-none">SYSGD</p>
              <p className="text-sm font-bold text-slate-800 leading-none">CONT</p>
            </div>
          </div>

          <div className="w-px h-8 bg-slate-200 mx-1" />

          <div>
            <p className="text-xs text-slate-400">Registro de Ingresos y Gastos — TCP</p>
            <p className="text-sm font-semibold text-slate-700">
              {generales.nombre || "Contribuyente"}{" "}
              <span className="text-slate-400 font-normal">{generales.anio}</span>
            </p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Quick stats */}
            <div className="hidden md:flex items-center gap-4 text-xs">
              <div className="text-center">
                <p className="text-slate-400">Ingresos</p>
                <p className="font-bold text-emerald-600 tabular-nums">{formatCUP(totalIngresos)}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-400">Gastos</p>
                <p className="font-bold text-rose-500 tabular-nums">{formatCUP(totalGastos)}</p>
              </div>
              <div className="text-center">
                <p className="text-slate-400">Resultado</p>
                <p className={`font-bold tabular-nums ${resultado >= 0 ? "text-indigo-600" : "text-red-600"}`}>
                  {resultado >= 0 ? "+" : ""}{formatCUP(resultado)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-6xl mx-auto px-4 flex gap-0">
          {TAB_IDS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                i === activeTab
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {TAB_LABELS[i]}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 0 && (
          <TabGenerales data={generales} onChange={setGenerales} />
        )}
        {activeTab === 1 && (
          <TabMovimientos
            type="ingresos"
            entries={ingresos}
            onChange={setIngresos}
          />
        )}
        {activeTab === 2 && (
          <TabMovimientos
            type="gastos"
            entries={gastos}
            onChange={setGastos}
          />
        )}
        {activeTab === 3 && (
          <TabTributos rows={tributos} onChange={setTributos} />
        )}
      </div>

      {/* Mobile summary bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 flex justify-around text-xs">
        <div className="text-center">
          <p className="text-slate-400">Ingresos</p>
          <p className="font-bold text-emerald-600 tabular-nums">{formatCUP(totalIngresos)}</p>
        </div>
        <div className="text-center">
          <p className="text-slate-400">Gastos</p>
          <p className="font-bold text-rose-500 tabular-nums">{formatCUP(totalGastos)}</p>
        </div>
        <div className="text-center">
          <p className="text-slate-400">Resultado</p>
          <p className={`font-bold tabular-nums ${resultado >= 0 ? "text-indigo-600" : "text-red-600"}`}>
            {resultado >= 0 ? "+" : ""}{formatCUP(resultado)}
          </p>
        </div>
      </div>
    </div>
  );
}

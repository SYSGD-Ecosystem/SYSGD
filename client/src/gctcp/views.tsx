import { type FC, useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  Boxes,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  CreditCard,
  FileDown,
  FileText,
  Info,
  Landmark,
  LayoutDashboard,
  Loader2,
  List,
  PackageSearch,
  Pencil,
  Plus,
  Search,
  Shield,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  UserX,
  WalletCards,
  X,
} from "lucide-react";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type {
  CloudWorkspaceEntry,
  RolTerceroType,
  Tercero,
  TerceroCuenta,
  TipoEntidadTercero,
} from "../accounting/core/types/accountingTypes";
import { MONTH_CODES } from "../accounting/core/utils/constants";
import UploadBackupPanel from "./UploadBackupPanel";
import {
  // EMPTY_GENERALES,
  activeRows,
  formatMoney,
  getRows,
  getTributoRow,
  monthTotal,
  parseAmount,
  tributoTotal,
} from "./accountingMath";
import { EmptyState, MetricCard, WorkspaceSelector } from "./components";
import { ProductCatalogPanel } from "./products/ProductCatalogPanel";
import type { ProductPriceUpdate, ProductStockUpdate } from "./products/ProductEditDialogs";
import type { GcTcpView, WorkspaceAnalysis } from "./types";

const pdfMakeWithVfs = pdfMake as unknown as { vfs?: typeof pdfFonts.vfs };
pdfMakeWithVfs.vfs = pdfFonts.vfs;

export const DashboardView: FC<{
  analyses: WorkspaceAnalysis[];
  activeAnalysis: WorkspaceAnalysis;
  activeWorkspaceId: string;
  savingWorkspace: boolean;
  totals: { ingresos: number; gastos: number; neto: number; asientos: number };
  onSelectWorkspace: (workspaceId: string) => void;
  onRequestDeleteWorkspace: (workspaceId: string) => void;
}> = ({
  analyses,
  activeAnalysis,
  activeWorkspaceId,
  savingWorkspace,
  totals,
  onSelectWorkspace,
  onRequestDeleteWorkspace,
}) => (
  <div className="space-y-4">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        title="Ingresos"
        value={formatMoney(totals.ingresos)}
        detail="Todos los espacios"
        icon={<TrendingUp />}
        accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
      />
      <MetricCard
        title="Gastos"
        value={formatMoney(totals.gastos)}
        detail="Todos los espacios"
        icon={<TrendingDown />}
        accent="bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
      />
      <MetricCard
        title="Base imponible"
        value={formatMoney(totals.neto)}
        detail="Lectura consolidada"
        icon={<Landmark />}
        accent="bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
      />
      <MetricCard
        title="Asientos"
        value={String(totals.asientos)}
        detail="Ingresos y gastos"
        icon={<Archive />}
        accent="bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
      />
    </div>
    <WorkspaceSelector
      analyses={analyses}
      activeWorkspaceId={activeWorkspaceId}
      onSelect={onSelectWorkspace}
      onRequestDelete={onRequestDeleteWorkspace}
      savingWorkspace={savingWorkspace}
    />
    <ResumenView analysis={activeAnalysis} />
  </div>
);

const MonthlyChart: FC<{ analysis: WorkspaceAnalysis }> = ({ analysis }) => {
  const maxValue = Math.max(
    1,
    ...analysis.monthly.flatMap((month) => [
      month.ingresos,
      month.gastos,
      Math.abs(month.neto),
    ]),
  );

  return (
    <Card className="rounded-lg shadow-sm">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-base">Comportamiento mensual</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-3">
          {analysis.monthly.map((month) => (
            <div
              key={month.month}
              className="grid grid-cols-[3rem_1fr_5.5rem] items-center gap-3 text-sm"
            >
              <span className="font-medium text-slate-600 dark:text-slate-300">
                {month.month}
              </span>
              <div className="space-y-1">
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{
                      width: `${Math.max(2, (month.ingresos / maxValue) * 100)}%`,
                    }}
                  />
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-2 rounded-full bg-rose-500"
                    style={{
                      width: `${Math.max(2, (month.gastos / maxValue) * 100)}%`,
                    }}
                  />
                </div>
              </div>
              <span className="text-right text-xs text-slate-500 dark:text-slate-400">
                {formatMoney(month.neto)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};


export const EntriesView: FC<{
  workspace: CloudWorkspaceEntry;
  type: "ingresos" | "gastos";
  saving?: boolean;
  onAdd?: (month: import("../accounting/core/types/accountingTypes").MonthCode) => void;
  onEdit?: (month: import("../accounting/core/types/accountingTypes").MonthCode, row: import("../accounting/core/types/accountingTypes").DayAmountRow) => void;
  onDelete?: (month: import("../accounting/core/types/accountingTypes").MonthCode, row: import("../accounting/core/types/accountingTypes").DayAmountRow) => void;
}> = ({ workspace, type, saving, onAdd, onEdit, onDelete }) => {
  const label = type === "ingresos" ? "Ingresos" : "Gastos";
  const tone =
    type === "ingresos"
      ? "text-emerald-700 dark:text-emerald-300"
      : "text-rose-700 dark:text-rose-300";
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const toggleMonth = (month: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(month)) next.delete(month);
      else next.add(month);
      return next;
    });
  };

  const cuentaPorId = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of workspace.accounting?.cuentasContables ?? []) {
      map.set(c.id, `${c.codigo} · ${c.nombre}`);
    }
    return map;
  }, [workspace.accounting?.cuentasContables]);

  const cuentaPorAsiento = useMemo(() => {
    const map = new Map<string, string>();
    for (const rel of workspace.accounting?.ingresoGastoCuentas ?? []) {
      if (rel.tipo === (type === "ingresos" ? "INGRESO" : "GASTO")) {
        map.set(rel.ingresoGastoId, rel.cuentaId);
      }
    }
    return map;
  }, [workspace.accounting?.ingresoGastoCuentas, type]);

  const notaPorAsiento = useMemo(() => {
    const map = new Map<string, string>();
    for (const n of workspace.accounting?.ingresoGastoNotas ?? []) {
      if (n.tipo === (type === "ingresos" ? "INGRESO" : "GASTO")) {
        map.set(n.ingresoGastoId, n.nota);
      }
    }
    return map;
  }, [workspace.accounting?.ingresoGastoNotas, type]);

  return (
    <Card className="rounded-lg shadow-sm">
      <CardHeader className="flex-row items-center justify-between gap-3 p-4">
        <div>
          <CardTitle className="text-base">{label} por mes</CardTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Año fiscal {workspace.registro.generales.anio}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {saving && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Loader2 className="size-3 animate-spin" /> Guardando…
            </span>
          )}
          <Badge variant="outline">{workspace.name}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-190 text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-3 pr-4">Mes</th>
                <th className="py-3 pr-4 text-right">Total</th>
                <th className="py-3 pr-4 text-right">Asientos</th>
                <th className="py-3 pr-4">Ultimos movimientos</th>
                <th className="py-3 pr-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {MONTH_CODES.map((month) => {
                const rows = activeRows(
                  getRows(workspace.registro, type, month),
                );
                const isExpanded = expandedMonths.has(month);
                return (
                  <>
                    <tr
                      key={month}
                      className="border-b border-slate-100 dark:border-slate-800/80"
                    >
                      <td className="py-3 pr-4 font-medium text-slate-950 dark:text-slate-50">
                        <button
                          type="button"
                          onClick={() => toggleMonth(month)}
                          className="flex items-center gap-1 hover:text-cyan-600 dark:hover:text-cyan-400"
                        >
                          {isExpanded ? (
                            <ChevronUp className="size-3.5" />
                          ) : (
                            <ChevronDown className="size-3.5" />
                          )}
                          {month}
                        </button>
                      </td>
                      <td
                        className={cn("py-3 pr-4 text-right font-semibold", tone)}
                      >
                        {formatMoney(monthTotal(rows))}
                      </td>
                      <td className="py-3 pr-4 text-right text-slate-600 dark:text-slate-300">
                        {rows.length}
                      </td>
                      <td className="py-3 pr-4 text-slate-500 dark:text-slate-400">
                        {rows
                          .slice(-3)
                          .map(
                            (row) =>
                              `Dia ${row.dia}: ${formatMoney(parseAmount(row.importe))}`,
                          )
                          .join(" | ") || "-"}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        {onAdd && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onAdd(month as import("../accounting/core/types/accountingTypes").MonthCode)}
                          >
                            <Plus className="size-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${month}-detail`} className="bg-slate-50 dark:bg-slate-900/50">
                        <td colSpan={5} className="px-4 py-3">
                          {rows.length === 0 ? (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Sin movimientos en {month}.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {rows.map((row) => {
                                const cuentaId = cuentaPorAsiento.get(row.id);
                                const nota = notaPorAsiento.get(row.id);
                                return (
                                  <div
                                    key={row.id}
                                    className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-800"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                        Día {row.dia} · {formatMoney(parseAmount(row.importe))} CUP
                                      </p>
                                      {cuentaId && (
                                        <p className="text-xs text-cyan-700 dark:text-cyan-300">
                                          Cuenta: {cuentaPorId.get(cuentaId) ?? cuentaId}
                                        </p>
                                      )}
                                      {nota && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                          {nota}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1">
                                      {onEdit && (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => onEdit(month as import("../accounting/core/types/accountingTypes").MonthCode, row)}
                                        >
                                          <Pencil className="size-3.5" />
                                        </Button>
                                      )}
                                      {onDelete && (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => onDelete(month as import("../accounting/core/types/accountingTypes").MonthCode, row)}
                                        >
                                          <X className="size-3.5 text-red-500" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export const TributosView: FC<{
  workspace: CloudWorkspaceEntry;
  analysis: WorkspaceAnalysis;
}> = ({ workspace, analysis }) => (
  <div className="space-y-4">
    <div className="grid gap-4 md:grid-cols-3">
      <MetricCard
        title="Tributos deducibles"
        value={formatMoney(analysis.totalTributos)}
        detail="Ventas, fuerza, sellos, CSS y cuota"
        icon={<Landmark />}
        accent="bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
      />
      <MetricCard
        title="Otros deducibles"
        value={formatMoney(analysis.totalOtrosDeducibles)}
        detail="Restauracion, arrendamiento y otros"
        icon={<WalletCards />}
        accent="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
      />
      <MetricCard
        title="Meses declarados"
        value={String(analysis.tributoRows)}
        detail="Filas con importes registrados"
        icon={<CalendarDays />}
        accent="bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
      />
    </div>
    <Card className="rounded-lg shadow-sm">
      <CardHeader className="p-4">
        <CardTitle className="text-base">Detalle de tributos</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-205 text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-3 pr-4">Mes</th>
                <th className="py-3 pr-4 text-right">Total pagado</th>
              </tr>
            </thead>
            <tbody>
              {MONTH_CODES.map((month, index) => {
                const total = tributoTotal(
                  getTributoRow(workspace.registro, index),
                );
                return (
                  <tr
                    key={month}
                    className="border-b border-slate-100 dark:border-slate-800/80"
                  >
                    <td className="py-3 pr-4 font-medium text-slate-950 dark:text-slate-50">
                      {month}
                    </td>
                    <td className="py-3 pr-4 text-right font-semibold">
                      {formatMoney(total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  </div>
);

export const ResumenView: FC<{ analysis: WorkspaceAnalysis }> = ({
  analysis,
}) => (
  <div className="grid gap-4 xl:grid-cols-[1fr_24rem]">
    <MonthlyChart analysis={analysis} />
    <div className="space-y-4">
      <MetricCard
        title="Base imponible"
        value={formatMoney(analysis.baseImponible)}
        detail="Ingresos menos gastos y deducciones"
        icon={<LayoutDashboard />}
        accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
      />
      <MetricCard
        title="Impuesto estimado"
        value={formatMoney(analysis.impuestoEstimado)}
        detail="Estimacion referencial al 15%"
        icon={<Landmark />}
        accent="bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
      />
      <MetricCard
        title="Operaciones registradas"
        value={String(analysis.incomeRows + analysis.expenseRows)}
        detail={`${analysis.incomeRows} ingresos / ${analysis.expenseRows} gastos`}
        icon={<Archive />}
        accent="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
      />
    </div>
  </div>
);

export const InventoryView: FC<{ workspace: CloudWorkspaceEntry }> = ({
  workspace,
}) => {
  const { inventario } = workspace.registro;
  const operations = inventario.operaciones.slice(-8).reverse();

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Productos"
          value={String(inventario.productos.length)}
          detail="Catalogo base"
          icon={<Boxes />}
          accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
        />
        <MetricCard
          title="Almacenes"
          value={String(inventario.almacenes.length)}
          detail="Puntos de stock"
          icon={<PackageSearch />}
          accent="bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
        />
        <MetricCard
          title="Stock"
          value={String(inventario.stock.length)}
          detail="Registros visibles"
          icon={<Archive />}
          accent="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
        />
        <MetricCard
          title="Operaciones"
          value={String(inventario.operaciones.length)}
          detail="Ventas y compras"
          icon={<ShoppingCart />}
          accent="bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
        />
      </div>
      <Card className="rounded-lg shadow-sm">
        <CardHeader className="p-4">
          <CardTitle className="text-base">
            Productos y ultimas operaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 p-4 pt-0 lg:grid-cols-2">
          <div className="space-y-2">
            {inventario.productos.slice(0, 10).map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3 dark:border-slate-800"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-950 dark:text-slate-50">
                    {product.nombre}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {product.unidad || "Sin unidad"} /{" "}
                    {product.tipo || "Sin tipo"}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold">
                  {formatMoney(product.precio)}
                </span>
              </div>
            ))}
            {inventario.productos.length === 0 && (
              <EmptyState
                title="Sin productos"
                description="Este espacio no tiene productos en inventario."
                icon={<Boxes />}
              />
            )}
          </div>
          <div className="space-y-2">
            {operations.map((operation) => (
              <div
                key={operation.id}
                className="rounded-md border border-slate-200 p-3 dark:border-slate-800"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-950 dark:text-slate-50">
                    {operation.nombreProducto}
                  </p>
                  <Badge
                    variant={
                      operation.tipo === "venta" ? "default" : "secondary"
                    }
                  >
                    {operation.tipo}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {operation.fecha} / {operation.cantidad} {operation.unidad} /{" "}
                  {formatMoney(operation.total)}
                </p>
              </div>
            ))}
            {operations.length === 0 && (
              <EmptyState
                title="Sin operaciones"
                description="No hay ventas o compras registradas todavia."
                icon={<ShoppingCart />}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export type TerceroUpsert = {
  id?: string;
  nombre: string;
  tipoEntidad: TipoEntidadTercero;
  telefono: string;
  correo: string;
  direccion: string;
  identificadorFiscal: string;
  numeroTarjeta: string;
  nota: string;
  roles: RolTerceroType[];
};

const ROLES_TERCERO: { valor: RolTerceroType; etiqueta: string }[] = [
  { valor: "CLIENTE", etiqueta: "Cliente" },
  { valor: "PROVEEDOR", etiqueta: "Proveedor" },
  { valor: "EMPLEADO", etiqueta: "Empleado" },
  { valor: "ESTADO", etiqueta: "Estado" },
];

const TIPOS_ENTIDAD: TipoEntidadTercero[] = ["PARTICULAR", "TCP", "MIPYME", "ESTATAL"];

const CUENTA_ABIERTA = (cuenta: TerceroCuenta): boolean =>
  cuenta.estado === "PENDIENTE" || cuenta.estado === "VENCIDO";

const pendienteDeTercero = (cuentas: TerceroCuenta[], terceroId: string): number =>
  cuentas
    .filter((cuenta) => cuenta.terceroId === terceroId && CUENTA_ABIERTA(cuenta))
    .reduce((total, cuenta) => total + cuenta.montoPendiente, 0);

export const TercerosView: FC<{
  workspace: CloudWorkspaceEntry;
  saving: boolean;
  onUpsertTercero: (payload: TerceroUpsert) => void;
  onSetTerceroActivo: (terceroId: string, activo: boolean) => void;
}> = ({ workspace, saving, onUpsertTercero, onSetTerceroActivo }) => {
  const terceros = workspace.registro.terceros;
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState<"TODOS" | RolTerceroType>("TODOS");
  const [filtroDeuda, setFiltroDeuda] = useState<"TODOS" | "CON_DEUDA" | "SIN_DEUDA">("TODOS");
  const [verInactivos, setVerInactivos] = useState(false);
  const [expandidoId, setExpandidoId] = useState<string | null>(null);
  const [dialogo, setDialogo] = useState<{ modo: "crear" } | { modo: "editar"; tercero: Tercero } | null>(null);
  const [secCrear, setSecCrear] = useState(0);
  const buscadorRef = useRef<HTMLInputElement>(null);

  const rolesPorTercero = useMemo(() => {
    const mapa = new Map<string, RolTerceroType[]>();
    for (const rol of terceros.roles) {
      if (!rol.activo) continue;
      const lista = mapa.get(rol.terceroId) ?? [];
      lista.push(rol.rol);
      mapa.set(rol.terceroId, lista);
    }
    return mapa;
  }, [terceros.roles]);

  const pendientes = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const tercero of terceros.terceros) {
      mapa.set(tercero.id, pendienteDeTercero(terceros.cuentas, tercero.id));
    }
    return mapa;
  }, [terceros.cuentas, terceros.terceros]);

  const cuentasAbiertas = useMemo(
    () => terceros.cuentas.filter(CUENTA_ABIERTA).length,
    [terceros.cuentas],
  );
  const pendienteTotal = useMemo(
    () => [...pendientes.values()].reduce((total, monto) => total + monto, 0),
    [pendientes],
  );
  const activos = useMemo(
    () => terceros.terceros.filter((tercero) => tercero.activo).length,
    [terceros.terceros],
  );

  const topDeudores = useMemo(
    () =>
      terceros.terceros
        .filter((tercero) => tercero.activo && (pendientes.get(tercero.id) ?? 0) > 0)
        .sort((a, b) => (pendientes.get(b.id) ?? 0) - (pendientes.get(a.id) ?? 0))
        .slice(0, 5),
    [terceros.terceros, pendientes],
  );

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return terceros.terceros.filter((tercero) => {
      if (!verInactivos && !tercero.activo) return false;
      if (filtroRol !== "TODOS" && !(rolesPorTercero.get(tercero.id) ?? []).includes(filtroRol)) return false;
      const pendiente = pendientes.get(tercero.id) ?? 0;
      if (filtroDeuda === "CON_DEUDA" && pendiente <= 0) return false;
      if (filtroDeuda === "SIN_DEUDA" && pendiente > 0) return false;
      if (!texto) return true;
      return [tercero.nombre, tercero.telefono, tercero.correo, tercero.identificadorFiscal]
        .join(" ")
        .toLowerCase()
        .includes(texto);
    });
  }, [terceros.terceros, verInactivos, filtroRol, filtroDeuda, pendientes, rolesPorTercero, busqueda]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Terceros activos"
          value={String(activos)}
          detail={`De ${terceros.terceros.length} registrados`}
          icon={<Users />}
          accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
        />
        <MetricCard
          title="Cuentas abiertas"
          value={String(cuentasAbiertas)}
          detail="Deudas y préstamos por cobrar o pagar"
          icon={<WalletCards />}
          accent="bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
        />
        <MetricCard
          title="Pendiente total"
          value={formatMoney(pendienteTotal)}
          detail="Saldo por cobrar o pagar"
          icon={<Landmark />}
          accent="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
        />
      </div>

      {topDeudores.length > 0 && (
        <Card className="rounded-lg shadow-sm">
          <CardHeader className="p-4">
            <CardTitle className="text-base">Deben más</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-4 pt-0">
            {topDeudores.map((tercero) => (
              <div
                key={tercero.id}
                className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-2.5 dark:border-slate-800"
              >
                <button
                  type="button"
                  className="truncate text-left text-sm font-medium text-slate-950 hover:underline dark:text-slate-50"
                  onClick={() => setExpandidoId(expandidoId === tercero.id ? null : tercero.id)}
                >
                  {tercero.nombre}
                </button>
                <span className="shrink-0 text-sm font-semibold text-red-600 dark:text-red-400">
                  {formatMoney(pendientes.get(tercero.id) ?? 0)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="rounded-lg shadow-sm">
        <CardHeader className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">Directorio</CardTitle>
            <Button type="button" size="sm" onClick={() => setDialogo({ modo: "crear" })}>
              <Plus className="size-4" />
              Nuevo
            </Button>
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              ref={buscadorRef}
              autoFocus
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && filtrados.length === 1) {
                  setExpandidoId(filtrados[0].id);
                }
              }}
              placeholder="Buscar por nombre, teléfono, correo o CI… (Enter abre el único resultado)"
              className="pr-9 pl-9"
            />
            {busqueda && (
              <button
                type="button"
                aria-label="Limpiar búsqueda"
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                onClick={() => {
                  setBusqueda("");
                  buscadorRef.current?.focus();
                }}
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={filtroRol === "TODOS" ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => setFiltroRol("TODOS")}
            >
              Todos
            </Badge>
            {ROLES_TERCERO.map((rol) => (
              <Badge
                key={rol.valor}
                variant={filtroRol === rol.valor ? "default" : "secondary"}
                className="cursor-pointer"
                onClick={() => setFiltroRol(filtroRol === rol.valor ? "TODOS" : rol.valor)}
              >
                {rol.etiqueta}s
              </Badge>
            ))}
            <span className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-700" />
            {(
              [
                { valor: "TODOS", etiqueta: "Con y sin deuda" },
                { valor: "CON_DEUDA", etiqueta: "Con deuda" },
                { valor: "SIN_DEUDA", etiqueta: "Sin deuda" },
              ] as const
            ).map((opcion) => (
              <Badge
                key={opcion.valor}
                variant={filtroDeuda === opcion.valor ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setFiltroDeuda(opcion.valor)}
              >
                {opcion.etiqueta}
              </Badge>
            ))}
            <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <input
                type="checkbox"
                checked={verInactivos}
                onChange={(event) => setVerInactivos(event.target.checked)}
                className="size-3.5 accent-slate-900"
              />
              Ver inactivos
            </label>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {filtrados.length} de {terceros.terceros.length} terceros
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 p-4 pt-0 md:grid-cols-2 xl:grid-cols-3">
          {filtrados.map((tercero) => {
            const pendiente = pendientes.get(tercero.id) ?? 0;
            const roles = rolesPorTercero.get(tercero.id) ?? [];
            const expandido = expandidoId === tercero.id;
            const cuentas = terceros.cuentas.filter((cuenta) => cuenta.terceroId === tercero.id);
            return (
              <div
                key={tercero.id}
                className={cn(
                  "rounded-md border border-slate-200 p-3 dark:border-slate-800",
                  !tercero.activo && "opacity-60",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-slate-950 dark:text-slate-50">{tercero.nombre}</p>
                  <span
                    className={cn(
                      "shrink-0 text-sm font-semibold",
                      pendiente > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400",
                    )}
                  >
                    {pendiente > 0 ? formatMoney(pendiente) : "Sin deuda"}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {roles.map((rol) => (
                    <Badge key={rol} variant="secondary" className="text-[10px]">
                      {rol === "CLIENTE" ? "Cliente" : rol === "PROVEEDOR" ? "Proveedor" : rol === "EMPLEADO" ? "Empleado" : "Estado"}
                    </Badge>
                  ))}
                  <Badge variant="outline" className="text-[10px]">
                    {tercero.tipoEntidad}
                  </Badge>
                  {!tercero.activo && (
                    <Badge variant="outline" className="text-[10px]">
                      Inactivo
                    </Badge>
                  )}
                </div>
                <p className="mt-2 wrap-break-word text-xs text-slate-500 dark:text-slate-400">
                  {tercero.telefono || tercero.correo || tercero.direccion || "Sin contacto"}
                </p>
                {expandido && (
                  <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                    {tercero.identificadorFiscal && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">CI/NIT: {tercero.identificadorFiscal}</p>
                    )}
                    {tercero.nota && <p className="text-xs text-slate-500 dark:text-slate-400">{tercero.nota}</p>}
                    {cuentas.length === 0 ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400">Sin cuentas registradas.</p>
                    ) : (
                      cuentas.map((cuenta) => (
                        <div
                          key={cuenta.id}
                          className="rounded-md bg-slate-50 p-2 text-xs dark:bg-slate-900"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">{cuenta.concepto || cuenta.tipoCuenta}</span>
                            <Badge
                              variant={CUENTA_ABIERTA(cuenta) ? "default" : "secondary"}
                              className="text-[10px]"
                            >
                              {cuenta.estado}
                            </Badge>
                          </div>
                          <p className="mt-1 text-slate-500 dark:text-slate-400">
                            Pendiente: {formatMoney(cuenta.montoPendiente)} de {formatMoney(cuenta.montoOriginal)}
                            {cuenta.fechaVencimiento ? ` · vence ${cuenta.fechaVencimiento}` : ""}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
                <div className="mt-2 flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setExpandidoId(expandido ? null : tercero.id)}
                  >
                    {expandido ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                    {expandido ? "Ocultar" : "Ver"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setDialogo({ modo: "editar", tercero })}
                  >
                    <Pencil className="size-3.5" />
                    Editar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => onSetTerceroActivo(tercero.id, !tercero.activo)}
                  >
                    {tercero.activo ? <UserX className="size-3.5" /> : <UserCheck className="size-3.5" />}
                    {tercero.activo ? "Desactivar" : "Activar"}
                  </Button>
                </div>
              </div>
            );
          })}
          {filtrados.length === 0 && (
            <EmptyState
              title={busqueda ? "Sin resultados" : "Sin terceros"}
              description={
                busqueda
                  ? `Nadie coincide con "${busqueda}". Ajusta la búsqueda o crea el tercero.`
                  : "No hay clientes o proveedores guardados en este espacio."
              }
              icon={<Users />}
            />
          )}
        </CardContent>
      </Card>

      <TerceroFormDialog
        clave={dialogo?.modo === "editar" ? dialogo.tercero.id : `nuevo-${secCrear}`}
        tercero={dialogo?.modo === "editar" ? dialogo.tercero : null}
        rolesIniciales={
          dialogo?.modo === "editar" ? (rolesPorTercero.get(dialogo.tercero.id) ?? ["CLIENTE"]) : ["CLIENTE"]
        }
        saving={saving}
        open={dialogo !== null}
        onOpenChange={(abierto) => {
          if (!abierto) setDialogo(null);
        }}
        onSave={(payload) => {
          onUpsertTercero(payload);
        }}
        onSaveAndNew={(payload) => {
          onUpsertTercero(payload);
          setSecCrear((sec) => sec + 1);
        }}
      />
    </div>
  );
};

const dialogoVacio = {
  nombre: "",
  tipoEntidad: "PARTICULAR" as TipoEntidadTercero,
  telefono: "",
  correo: "",
  direccion: "",
  identificadorFiscal: "",
  numeroTarjeta: "",
  nota: "",
};

export const TerceroFormDialog: FC<{
  clave: string;
  tercero: Tercero | null;
  rolesIniciales: RolTerceroType[];
  saving: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: TerceroUpsert) => void;
  onSaveAndNew: (payload: TerceroUpsert) => void;
}> = ({ clave, tercero, rolesIniciales, saving, open, onOpenChange, onSave, onSaveAndNew }) => {
  const [form, setForm] = useState(dialogoVacio);
  const [roles, setRoles] = useState<RolTerceroType[]>(rolesIniciales);
  const nombreRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setForm(
      tercero
        ? {
            nombre: tercero.nombre,
            tipoEntidad: tercero.tipoEntidad,
            telefono: tercero.telefono,
            correo: tercero.correo,
            direccion: tercero.direccion,
            identificadorFiscal: tercero.identificadorFiscal,
            numeroTarjeta: tercero.numeroTarjeta,
            nota: tercero.nota,
          }
        : dialogoVacio,
    );
    setRoles(rolesIniciales);
    window.setTimeout(() => nombreRef.current?.focus(), 50);
    // `clave` fuerza remontar por tercero/modo; los iniciales entran aquí.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, clave]);

  const set = (campo: keyof typeof dialogoVacio, valor: string): void =>
    setForm((actual) => ({ ...actual, [campo]: valor }));

  const alternarRol = (rol: RolTerceroType): void =>
    setRoles((actual) => (actual.includes(rol) ? actual.filter((r) => r !== rol) : [...actual, rol]));

  const valido = form.nombre.trim().length > 0 && roles.length > 0 && !saving;
  const payload = (): TerceroUpsert => ({
    ...(tercero ? { id: tercero.id } : {}),
    nombre: form.nombre.trim(),
    tipoEntidad: form.tipoEntidad,
    telefono: form.telefono.trim(),
    correo: form.correo.trim(),
    direccion: form.direccion.trim(),
    identificadorFiscal: form.identificadorFiscal.trim(),
    numeroTarjeta: form.numeroTarjeta.trim(),
    nota: form.nota.trim(),
    roles,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{tercero ? "Editar tercero" : "Nuevo tercero"}</DialogTitle>
          <DialogDescription>
            {tercero ? "Actualiza los datos del tercero." : "Da de alta al cliente o proveedor. Con Intro se guarda y abre otro."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!valido) return;
            if (!tercero && event.nativeEvent instanceof SubmitEvent && event.nativeEvent.submitter?.hasAttribute("data-guardar-nuevo")) {
              onSaveAndNew(payload());
            } else {
              onSave(payload());
              onOpenChange(false);
            }
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="tercero-nombre">Nombre *</Label>
            <Input
              id="tercero-nombre"
              ref={nombreRef}
              value={form.nombre}
              onChange={(event) => set("nombre", event.target.value)}
              placeholder="Nombre y apellidos o razón social"
              disabled={saving}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Tipo de entidad</Label>
              <Select
                value={form.tipoEntidad}
                onValueChange={(valor) => set("tipoEntidad", valor)}
                disabled={saving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_ENTIDAD.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo === "PARTICULAR" ? "Particular" : tipo === "TCP" ? "TCP" : tipo === "MIPYME" ? "MIPYME" : "Estatal"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Roles *</Label>
              <div className="flex flex-wrap gap-1.5">
                {ROLES_TERCERO.map((rol) => (
                  <Badge
                    key={rol.valor}
                    variant={roles.includes(rol.valor) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => alternarRol(rol.valor)}
                  >
                    {rol.etiqueta}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="tercero-telefono">Teléfono</Label>
              <Input
                id="tercero-telefono"
                value={form.telefono}
                onChange={(event) => set("telefono", event.target.value)}
                placeholder="5xxxxxxx"
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tercero-ci">CI / NIT</Label>
              <Input
                id="tercero-ci"
                value={form.identificadorFiscal}
                onChange={(event) => set("identificadorFiscal", event.target.value)}
                placeholder="Carnet o NIT"
                disabled={saving}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tercero-correo">Correo</Label>
            <Input
              id="tercero-correo"
              type="email"
              value={form.correo}
              onChange={(event) => set("correo", event.target.value)}
              placeholder="correo@ejemplo.cu"
              disabled={saving}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tercero-direccion">Dirección</Label>
            <Input
              id="tercero-direccion"
              value={form.direccion}
              onChange={(event) => set("direccion", event.target.value)}
              placeholder="Calle, municipio…"
              disabled={saving}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tercero-tarjeta">Número de tarjeta</Label>
            <Input
              id="tercero-tarjeta"
              value={form.numeroTarjeta}
              onChange={(event) => set("numeroTarjeta", event.target.value)}
              placeholder="Tarjeta para transferencias"
              disabled={saving}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tercero-nota">Nota</Label>
            <Textarea
              id="tercero-nota"
              value={form.nota}
              onChange={(event) => set("nota", event.target.value)}
              placeholder="Referencia, alias, zona…"
              rows={2}
              disabled={saving}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancelar
            </Button>
            {!tercero && (
              <Button type="submit" data-guardar-nuevo variant="secondary" disabled={!valido}>
                {saving ? "Guardando…" : "Guardar y nuevo"}
              </Button>
            )}
            <Button type="submit" disabled={!valido}>
              {saving ? "Guardando…" : tercero ? "Guardar cambios" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export const CatalogosView: FC<{
  workspace: CloudWorkspaceEntry;
  deletingProduct: boolean;
  savingProductChanges: boolean;
  onDeleteProduct: (productId: string) => void;
  onUpdateProductPrice: (payload: ProductPriceUpdate) => void;
  onUpdateProductStock: (payload: ProductStockUpdate) => void;
}> = ({ workspace, deletingProduct, savingProductChanges, onDeleteProduct, onUpdateProductPrice, onUpdateProductStock }) => {
  const cuentas = workspace.accounting.cuentasContables;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="rounded-lg shadow-sm">
        <CardHeader className="p-4">
          <CardTitle className="text-base">Cuentas contables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-4 pt-0">
          {cuentas.slice(0, 16).map((cuenta) => (
            <div
              key={cuenta.id}
              className="flex items-center justify-between gap-3 rounded-md border border-slate-200 p-3 dark:border-slate-800"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-950 dark:text-slate-50">
                  {cuenta.codigo} / {cuenta.nombre}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {cuenta.tipo} / {cuenta.naturaleza}
                </p>
              </div>
              <Badge variant={cuenta.activo ? "default" : "secondary"}>
                {cuenta.activo ? "Activa" : "Inactiva"}
              </Badge>
            </div>
          ))}
          {cuentas.length === 0 && (
            <EmptyState
              title="Sin cuentas"
              description="El catalogo contable esta vacio."
              icon={<List />}
            />
          )}
        </CardContent>
      </Card>
      <ProductCatalogPanel
        workspace={workspace}
        deletingProduct={deletingProduct}
        savingProductChanges={savingProductChanges}
        onDeleteProduct={onDeleteProduct}
        onUpdateProductPrice={onUpdateProductPrice}
        onUpdateProductStock={onUpdateProductStock}
      />
    </div>
  );
};

export const BackupView: FC<{
  onReload: () => void;
  onDownloadBackup: () => void;
  canDownload: boolean;
  onChangeMode?: () => void;
}> = ({ onReload, onDownloadBackup, canDownload, onChangeMode }) => (
  <div className="space-y-4">
    <Card className="rounded-lg shadow-sm">
      <CardHeader className="flex-row items-center justify-between gap-3 p-4">
        <CardTitle className="text-base">Copia de seguridad</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={onDownloadBackup}
          disabled={!canDownload}
        >
          <FileDown className="size-4" />
          Descargar respaldo
        </Button>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0 text-sm text-slate-600 dark:text-slate-300">
        <p>
          Descarga una copia local del ledger actual o restaura un respaldo
          exportado por la app.
        </p>
        {onChangeMode && (
          <Button type="button" variant="outline" size="sm" onClick={onChangeMode}>
            Cambiar forma de inicio (nube / copia / teléfono)
          </Button>
        )}
      </CardContent>
    </Card>
    <UploadBackupPanel onSuccess={onReload} />
  </div>
);

export const SupportView: FC<{ view: GcTcpView }> = ({ view }) => {
  const content: Record<
    | "documentos"
    | "seguridad"
    | "licencias"
    | "acerca"
    | "ayuda"
    | "recursos"
    | "nomencladores",
    { title: string; description: string; icon: JSX.Element }
  > = {
    documentos: {
      title: "Documentos",
      description:
        "Vista preparada para listar modelos, reportes y documentos asociados al registro contable cuando el backend exponga esa coleccion.",
      icon: <FileText />,
    },
    seguridad: {
      title: "Seguridad y cuenta",
      description:
        "La version de escritorio reserva este espacio para datos de acceso, sincronizacion y proteccion de la cuenta.",
      icon: <Shield />,
    },
    licencias: {
      title: "Licencias y creditos",
      description:
        "Centro reservado para visualizar estado de licencia, creditos e informacion comercial del usuario.",
      icon: <CreditCard />,
    },
    acerca: {
      title: "Gestor Contable TCP",
      description:
        "Version de escritorio integrada al cliente principal de SYSGD para leer, analizar y visualizar workspaces contables.",
      icon: <Info />,
    },
    ayuda: {
      title: "Ayuda de llenado",
      description:
        "Area reservada para guias de llenado del registro, tributos y declaracion jurada.",
      icon: <CircleHelp />,
    },
    recursos: {
      title: "Recursos utiles",
      description:
        "Area reservada para enlaces, formularios y referencias contables relacionadas con TCP.",
      icon: <Search />,
    },
    nomencladores: {
      title: "Nomencladores",
      description:
        "Usa Catalogo para visualizar cuentas y productos. Esta vista queda lista para edicion avanzada.",
      icon: <List />,
    },
  };
  const item = content[view as keyof typeof content];
  return (
    <EmptyState
      title={item.title}
      description={item.description}
      icon={item.icon}
    />
  );
};

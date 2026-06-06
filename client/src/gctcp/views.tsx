import { type FC } from "react";
import {
  Archive,
  Boxes,
  CalendarDays,
  CircleHelp,
  CreditCard,
  FileDown,
  FileText,
  Info,
  Landmark,
  LayoutDashboard,
  List,
  PackageSearch,
  Search,
  Shield,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
  Users,
  WalletCards,
} from "lucide-react";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CloudWorkspaceEntry } from "../accounting/core/types/accountingTypes";
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
}> = ({ workspace, type }) => {
  const label = type === "ingresos" ? "Ingresos" : "Gastos";
  const tone =
    type === "ingresos"
      ? "text-emerald-700 dark:text-emerald-300"
      : "text-rose-700 dark:text-rose-300";

  return (
    <Card className="rounded-lg shadow-sm">
      <CardHeader className="flex-row items-center justify-between gap-3 p-4">
        <div>
          <CardTitle className="text-base">{label} por mes</CardTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Año fiscal {workspace.registro.generales.anio}
          </p>
        </div>
        <Badge variant="outline">{workspace.name}</Badge>
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
              </tr>
            </thead>
            <tbody>
              {MONTH_CODES.map((month) => {
                const rows = activeRows(
                  getRows(workspace.registro, type, month),
                );
                return (
                  <tr
                    key={month}
                    className="border-b border-slate-100 dark:border-slate-800/80"
                  >
                    <td className="py-3 pr-4 font-medium text-slate-950 dark:text-slate-50">
                      {month}
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
                  </tr>
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

export const TercerosView: FC<{ workspace: CloudWorkspaceEntry }> = ({
  workspace,
}) => {
  const terceros = workspace.registro.terceros;
  const pendiente = terceros.cuentas.reduce(
    (total, cuenta) => total + cuenta.montoPendiente,
    0,
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Terceros"
          value={String(terceros.terceros.length)}
          detail="Clientes, proveedores y estado"
          icon={<Users />}
          accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
        />
        <MetricCard
          title="Cuentas abiertas"
          value={String(terceros.cuentas.length)}
          detail="Deudas y prestamos"
          icon={<WalletCards />}
          accent="bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"
        />
        <MetricCard
          title="Pendiente"
          value={formatMoney(pendiente)}
          detail="Saldo por cobrar o pagar"
          icon={<Landmark />}
          accent="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
        />
      </div>
      <Card className="rounded-lg shadow-sm">
        <CardHeader className="p-4">
          <CardTitle className="text-base">Directorio</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 p-4 pt-0 md:grid-cols-2 xl:grid-cols-3">
          {terceros.terceros.map((tercero) => (
            <div
              key={tercero.id}
              className="rounded-md border border-slate-200 p-3 dark:border-slate-800"
            >
              <p className="font-semibold text-slate-950 dark:text-slate-50">
                {tercero.nombre}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {tercero.tipoEntidad} /{" "}
                {tercero.identificadorFiscal || "Sin identificador"}
              </p>
              <p className="mt-2 wrap-break-word text-xs text-slate-500 dark:text-slate-400">
                {tercero.telefono ||
                  tercero.correo ||
                  tercero.direccion ||
                  "Sin contacto"}
              </p>
            </div>
          ))}
          {terceros.terceros.length === 0 && (
            <EmptyState
              title="Sin terceros"
              description="No hay clientes o proveedores guardados en este espacio."
              icon={<Users />}
            />
          )}
        </CardContent>
      </Card>
    </div>
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
}> = ({ onReload, onDownloadBackup, canDownload }) => (
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
      <CardContent className="p-4 pt-0 text-sm text-slate-600 dark:text-slate-300">
        Descarga una copia local del ledger actual o restaura un respaldo
        exportado por la app.
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

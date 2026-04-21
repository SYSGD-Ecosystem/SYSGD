export const MONTHS = [
  'ENE',
  'FEB',
  'MAR',
  'ABR',
  'MAY',
  'JUN',
  'JUL',
  'AGO',
  'SEP',
  'OCT',
  'NOV',
  'DIC'
] as const;

export type MonthKey = (typeof MONTHS)[number];

export interface GeneralesData {
  nombre: string;
  anio: number;
  nit: string;
  actividad: string;
  codigo: string;
  fiscalCalle: string;
  fiscalMunicipio: string;
  fiscalProvincia: string;
  legalCalle: string;
  legalMunicipio: string;
  legalProvincia: string;
}

export interface DayAmountRow {
  id?: string;
  dia: string;
  importe: string;
}

export interface IngresoGastoCuenta {
  id: string;
  ingresoGastoId: string;
  mes: string;
  tipo: 'INGRESO' | 'GASTO';
  cuentaId: string;
  createdAt: number;
}

export interface IngresoGastoNota {
  id: string;
  ingresoGastoId: string;
  mes: string;
  tipo: 'INGRESO' | 'GASTO';
  nota: string;
  createdAt: number;
}

export interface WorkspaceAccounting {
  cuentasContables: unknown[];
  ingresoGastoCuentas: IngresoGastoCuenta[];
  ingresoGastoNotas: IngresoGastoNota[];
  posIntegrationConfig: unknown;
  tributoConfigs: unknown[];
  tributoCuentaBases: unknown[];
}

export interface Workspace {
  id: string;
  name: string;
  accounting: WorkspaceAccounting;
  registro: RegistroTCP;
}

export interface ContLedgerResponse {
  activeWorkspaceId: string;
  workspaces: Workspace[];
  inventario: InventarioRegistro;
  updatedAt: string;
}

export type MonthEntries = Record<MonthKey, DayAmountRow[]>;

export interface TributoRow {
  mes: string;
  ventas: string;
  fuerza: string;
  sellos: string;
  anuncios: string;
  css20: string;
  css14: string;
  otros: string;
  restauracion: string;
  arrendamiento: string;
  exonerado: string;
  otrosMFP: string;
  cuotaMensual: string;
}


export interface ProductoInventario {
  id: string;
  nombre: string;
  precio: number;
  unidad: string;
  tipo: 'venta' | 'compra';
  emoji?: string;
}

export interface OperacionInventario {
  id: string;
  tipo: 'venta' | 'compra';
  fecha: string;
  productoId: string;
  nombreProducto: string;
  unidad: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

export interface Almacen {
  id: string;
  name: string;
  tipo: 'venta' | 'compra' | 'insumos';
}

export interface Inventario {
  id: string;
  product_id: ProductoInventario["id"]
  almacen_id: Almacen["id"]
  cantidad: number
}

export interface InventarioRegistro {
  productosVenta: ProductoInventario[];
  productosCompra: ProductoInventario[];
  operaciones: OperacionInventario[];
}

export interface RegistroTCP {
  generales: GeneralesData;
  ingresos: MonthEntries;
  gastos: MonthEntries;
  tributos: TributoRow[];
  inventario: InventarioRegistro;
}

export interface MonthlyTotals {
  month: MonthKey;
  ingresos: number;
  gastos: number;
  tributos: number;
  otrosDeducibles: number;
  neto: number;
}

export interface AnnualReport {
  year: number;
  totalIngresos: number;
  totalGastos: number;
  totalTributos: number;
  totalOtrosDeducibles: number;
  baseImponible: number;
  impuestoEstimado: number;
  monthly: MonthlyTotals[];
}

export interface AlertMessage {
  level: 'warning' | 'info' | 'ok';
  message: string;
}

export const MAX_MONTH_ROWS = 36;
export const SIMPLIFIED_THRESHOLD_CUP = 500000;

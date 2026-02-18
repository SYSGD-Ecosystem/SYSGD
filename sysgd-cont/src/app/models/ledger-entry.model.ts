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
  dia: string;
  importe: string;
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

export interface RegistroTCP {
  generales: GeneralesData;
  ingresos: MonthEntries;
  gastos: MonthEntries;
  tributos: TributoRow[];
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

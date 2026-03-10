export type SheetTab = "GENERALES" | "INGRESOS" | "GASTOS" | "TRIBUTOS";

export type MonthCode =
  | "ENE" | "FEB" | "MAR" | "ABR" | "MAY" | "JUN"
  | "JUL" | "AGO" | "SEP" | "OCT" | "NOV" | "DIC";

export type GeneralData = {
  anio: string;
  nombre: string;
  nit: string;
  fiscalCalle: string;
  fiscalMunicipio: string;
  fiscalProvincia: string;
  legalCalle: string;
  legalMunicipio: string;
  legalProvincia: string;
  actividad: string;
  codigo: string;
  firmaDia: string;
  firmaMes: string;
  firmaAnio: string;
};

export type MonthEntry = { dia: string; importe: string };
export type MonthEntries = Record<MonthCode, MonthEntry[]>;

export type TributosEntry = {
  mes: string;
  b: string; c: string; d: string; e: string; f: string;
  h: string; i: string; j: string;
  l: string; m: string; n: string; o: string; p: string;
};

export type TcpDocumentPayload = {
  generalData: GeneralData;
  ingresos: MonthEntries;
  gastos: MonthEntries;
  tributos: TributosEntry[];
};

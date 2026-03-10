import type { MonthCode, MonthEntry, MonthEntries, TributosEntry } from "../types";

export const MONTH_CODES: MonthCode[] = [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
  "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
];

export const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export const MONTH_NAME_TO_CODE: Record<string, MonthCode> = {
  Enero: "ENE", Febrero: "FEB", Marzo: "MAR", Abril: "ABR",
  Mayo: "MAY", Junio: "JUN", Julio: "JUL", Agosto: "AGO",
  Septiembre: "SEP", Octubre: "OCT", Noviembre: "NOV", Diciembre: "DIC",
};

export const DAY_COLUMN_WIDTH_PX = 34;
export const MONTH_COLUMN_WIDTH_PX = 58;
export const ROWS_PER_MONTH = 36;

export const INSTRUCTIONS = [
  "INSTRUCCIONES PARA LA CONSERVACIÓN DEL REGISTRO Y ANOTACIÓN DE LAS OPERACIONES",
  "Objetivo: Facilitar el registro de las operaciones a los contribuyentes; proporcionando los elementos para llenar la Declaración Jurada del impuesto sobre ingresos personales. Se registra en CUP",
  "- El Registro debe conservarse limpio y en buen estado. Cuando presenta deterioro, que impide la comprobación de la actividad y de los datos consignados en este, el contribuyente debe sustituirlo por otro.",
  "- El Registro debe mantenerse actualizado, se llena a tinta y en letra de molde legible. Puede llevarse en formato digital.",
  "- El Registro se conserva por cinco (5) años, contados a partir del cierre del año fiscal en que se registraron operaciones.",
  "- En cada una de las columnas señaladas con la letra D se anota el día del mes al que corresponde el ingreso o el gasto.",
  "- Los ingresos y gastos que se cobran o pagan en MLC u otra divisa extranjera convertible en Cuba, se anotan en CUP a la tasa de cambio vigente del BCC.",
  "- En las columnas de los meses, se anota el importe del ingreso o gasto del día que corresponda.",
  "- Al finalizar cada mes, se pasa raya anulando las filas no utilizadas y se suman los ingresos y gastos en la fila Total.",
  "TRIBUTOS PAGADOS DEDUCIBLES EN LA DECLARACIÓN JURADA y GASTOS DEDUCIBLES DIRECTAMENTE DE LA BASE IMPONIBLE:",
  "- En la fila de cada mes se anota el importe pagado en ese mes.",
  "- En la columna 6 el total es la suma de las columnas 7 y 8.",
  "- En la columna 10 se suman las columnas 1 a la 6 y la 9.",
  "- Al finalizar el año se suman verticalmente todas las columnas y el resultado se anota en la fila Total pagado.",
];

export const createMonthRows = (): MonthEntry[] =>
  Array.from({ length: ROWS_PER_MONTH }, () => ({ dia: "", importe: "" }));

export const createMonthEntries = (): MonthEntries => ({
  ENE: createMonthRows(), FEB: createMonthRows(), MAR: createMonthRows(),
  ABR: createMonthRows(), MAY: createMonthRows(), JUN: createMonthRows(),
  JUL: createMonthRows(), AGO: createMonthRows(), SEP: createMonthRows(),
  OCT: createMonthRows(), NOV: createMonthRows(), DIC: createMonthRows(),
});

export const createEmptyTributos = (): TributosEntry[] =>
  MONTH_NAMES.map((mes) => ({
    mes, b: "", c: "", d: "", e: "", f: "",
    h: "", i: "", j: "", l: "", m: "", n: "", o: "", p: "",
  }));

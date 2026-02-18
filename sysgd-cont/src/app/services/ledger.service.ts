import { Injectable } from '@angular/core';
import {
  AlertMessage,
  AnnualReport,
  DayAmountRow,
  GeneralesData,
  MAX_MONTH_ROWS,
  MONTHS,
  MonthEntries,
  MonthKey,
  MonthlyTotals,
  RegistroTCP,
  SIMPLIFIED_THRESHOLD_CUP,
  TributoRow
} from '../models/ledger-entry.model';

const LEDGER_CACHE_KEY = 'sysgd-cont:registro-tcp';

const monthLabel: Record<MonthKey, string> = {
  ENE: 'Enero',
  FEB: 'Febrero',
  MAR: 'Marzo',
  ABR: 'Abril',
  MAY: 'Mayo',
  JUN: 'Junio',
  JUL: 'Julio',
  AGO: 'Agosto',
  SEP: 'Septiembre',
  OCT: 'Octubre',
  NOV: 'Noviembre',
  DIC: 'Diciembre'
};

const taxBrackets = [
  { limit: 10000, rate: 0, base: 0 },
  { limit: 20000, rate: 0.25, base: 0 },
  { limit: 30000, rate: 0.3, base: 2500 },
  { limit: 50000, rate: 0.35, base: 5500 },
  { limit: Number.POSITIVE_INFINITY, rate: 0.4, base: 12500 }
];

@Injectable({ providedIn: 'root' })
export class LedgerService {
  emptyRegistro(year = new Date().getFullYear()): RegistroTCP {
    const emptyRows = (): MonthEntries =>
      MONTHS.reduce((acc, month) => {
        acc[month] = [];
        return acc;
      }, {} as MonthEntries);

    const emptyTributo = (mes: string): TributoRow => ({
      mes,
      ventas: '',
      fuerza: '',
      sellos: '',
      anuncios: '',
      css20: '',
      css14: '',
      otros: '',
      restauracion: '',
      arrendamiento: '',
      exonerado: '',
      otrosMFP: '',
      cuotaMensual: ''
    });

    return {
      generales: {
        nombre: '',
        anio: year,
        nit: '',
        actividad: '',
        codigo: '',
        fiscalCalle: '',
        fiscalMunicipio: '',
        fiscalProvincia: '',
        legalCalle: '',
        legalMunicipio: '',
        legalProvincia: ''
      },
      ingresos: emptyRows(),
      gastos: emptyRows(),
      tributos: MONTHS.map((month) => emptyTributo(monthLabel[month]))
    };
  }

  getRegistro(): RegistroTCP {
    try {
      const raw = localStorage.getItem(LEDGER_CACHE_KEY);
      if (!raw) return this.emptyRegistro();
      const parsed = JSON.parse(raw) as Partial<RegistroTCP>;
      return {
        ...this.emptyRegistro(parsed.generales?.anio),
        ...parsed,
        ingresos: { ...this.emptyRegistro(parsed.generales?.anio).ingresos, ...parsed.ingresos },
        gastos: { ...this.emptyRegistro(parsed.generales?.anio).gastos, ...parsed.gastos },
        tributos: parsed.tributos?.length === 12 ? parsed.tributos : this.emptyRegistro(parsed.generales?.anio).tributos
      };
    } catch {
      return this.emptyRegistro();
    }
  }

  saveRegistro(registro: RegistroTCP): void {
    localStorage.setItem(LEDGER_CACHE_KEY, JSON.stringify(registro));
  }

  updateGenerales(data: GeneralesData): RegistroTCP {
    const registro = this.getRegistro();
    const next = { ...registro, generales: data };
    this.saveRegistro(next);
    return next;
  }

  addIngreso(month: MonthKey, dia: number, importeCUP: number): RegistroTCP {
    return this.addMonthlyEntry('ingresos', month, dia, importeCUP);
  }

  addGasto(month: MonthKey, dia: number, importeCUP: number): RegistroTCP {
    return this.addMonthlyEntry('gastos', month, dia, importeCUP);
  }

  updateTributos(month: MonthKey, values: Omit<TributoRow, 'mes'>): RegistroTCP {
    const registro = this.getRegistro();
    const index = MONTHS.findIndex((m) => m === month);
    const nextTributos = [...registro.tributos];
    nextTributos[index] = {
      mes: monthLabel[month],
      ...values
    };
    const next = { ...registro, tributos: nextTributos };
    this.saveRegistro(next);
    return next;
  }

  convertDivisaToCup(amount: number, rate: number): number {
    return this.round2(amount * rate);
  }

  getAnnualReport(): AnnualReport {
    const registro = this.getRegistro();
    const monthly: MonthlyTotals[] = MONTHS.map((month, index) => {
      const ingresos = this.monthTotal(registro.ingresos[month]);
      const gastos = this.monthTotal(registro.gastos[month]);
      const tributos = this.tributosSubtotal(registro.tributos[index]);
      const otros = this.otrosDeduciblesSubtotal(registro.tributos[index]);
      return {
        month,
        ingresos,
        gastos,
        tributos,
        otrosDeducibles: otros,
        neto: this.round2(ingresos - gastos - tributos - otros)
      };
    });

    const totalIngresos = monthly.reduce((acc, item) => acc + item.ingresos, 0);
    const totalGastos = monthly.reduce((acc, item) => acc + item.gastos, 0);
    const totalTributos = monthly.reduce((acc, item) => acc + item.tributos, 0);
    const totalOtrosDeducibles = monthly.reduce((acc, item) => acc + item.otrosDeducibles, 0);
    const baseImponible = this.round2(totalIngresos - totalGastos - totalTributos - totalOtrosDeducibles);
    const impuestoEstimado = this.estimateIncomeTax(baseImponible);

    return {
      year: registro.generales.anio,
      totalIngresos: this.round2(totalIngresos),
      totalGastos: this.round2(totalGastos),
      totalTributos: this.round2(totalTributos),
      totalOtrosDeducibles: this.round2(totalOtrosDeducibles),
      baseImponible: this.round2(baseImponible),
      impuestoEstimado,
      monthly
    };
  }

  buildAlerts(): AlertMessage[] {
    const report = this.getAnnualReport();
    const alerts: AlertMessage[] = [];

    if (report.totalIngresos > SIMPLIFIED_THRESHOLD_CUP) {
      alerts.push({
        level: 'warning',
        message: `Tus ingresos (${report.totalIngresos.toFixed(2)} CUP) exceden el umbral de ${SIMPLIFIED_THRESHOLD_CUP.toFixed(2)} CUP.`
      });
    }

    const withoutIncomeMonths = report.monthly.filter((m) => m.ingresos === 0).length;
    if (withoutIncomeMonths >= 3) {
      alerts.push({
        level: 'warning',
        message: `No registras ingresos en ${withoutIncomeMonths} meses. Revisa si tu actividad está inactiva.`
      });
    }

    if (report.totalTributos === 0) {
      alerts.push({
        level: 'warning',
        message: 'No has registrado tributos pagados. Recuerda actualizarlos mensualmente.'
      });
    }

    if (report.baseImponible < 0) {
      alerts.push({
        level: 'warning',
        message: `Resultado anual negativo (${report.baseImponible.toFixed(2)} CUP). Verifica datos y soporte documental.`
      });
    }

    if (alerts.length === 0) {
      alerts.push({ level: 'ok', message: 'Registro consistente. Mantén documentos de respaldo por 5 años.' });
    }

    return alerts;
  }

  declarationPreview(anticipos = 0): string {
    const registro = this.getRegistro();
    const report = this.getAnnualReport();
    const result = this.round2(report.impuestoEstimado - anticipos);

    return [
      'DATOS PARA DECLARACIÓN JURADA IMPUESTO SOBRE INGRESOS PERSONALES',
      '',
      `Contribuyente: ${registro.generales.nombre || '(pendiente)'}`,
      `NIT: ${registro.generales.nit || '(pendiente)'}`,
      `Actividad: ${registro.generales.actividad || '(pendiente)'} - Código: ${registro.generales.codigo || '(pendiente)'}`,
      `Período Fiscal: ${report.year}`,
      '',
      `CASILLA 1 - Total Ingresos Brutos: ${report.totalIngresos.toFixed(2)} CUP`,
      `CASILLA 2 - Gastos Deducibles: ${report.totalGastos.toFixed(2)} CUP`,
      `CASILLA 3 - Tributos Pagados: ${report.totalTributos.toFixed(2)} CUP`,
      `CASILLA 4 - Otros Gastos Deducibles: ${report.totalOtrosDeducibles.toFixed(2)} CUP`,
      `CASILLA 5 - BASE IMPONIBLE: ${report.baseImponible.toFixed(2)} CUP`,
      `CASILLA 6 - IMPUESTO ESTIMADO: ${report.impuestoEstimado.toFixed(2)} CUP`,
      `CASILLA 7 - Anticipos pagados: ${anticipos.toFixed(2)} CUP`,
      '',
      `RESULTADO: ${result >= 0 ? `A PAGAR ${result.toFixed(2)} CUP` : `A FAVOR ${Math.abs(result).toFixed(2)} CUP`}`,
      `Declaración estimada para presentar antes del 30 de abril de ${report.year + 1}.`
    ].join('\n');
  }

  private addMonthlyEntry(module: 'ingresos' | 'gastos', month: MonthKey, dia: number, importeCUP: number): RegistroTCP {
    if (!this.isValidDay(month, dia)) {
      throw new Error(`Día inválido para ${month}: ${dia}`);
    }
    if (!Number.isFinite(importeCUP) || importeCUP <= 0) {
      throw new Error('El importe debe ser mayor que 0');
    }

    const registro = this.getRegistro();
    const currentRows = [...registro[module][month]];
    if (currentRows.length >= MAX_MONTH_ROWS) {
      throw new Error(`El mes ${month} ya tiene ${MAX_MONTH_ROWS} filas.`);
    }

    const nextRow: DayAmountRow = { dia: String(dia), importe: this.round2(importeCUP).toFixed(2) };
    currentRows.push(nextRow);

    const next = {
      ...registro,
      [module]: {
        ...registro[module],
        [month]: currentRows
      }
    };
    this.saveRegistro(next);
    return next;
  }

  private monthTotal(rows: DayAmountRow[]): number {
    return this.round2(rows.reduce((acc, item) => acc + this.safeNumber(item.importe), 0));
  }

  private tributosSubtotal(item: TributoRow): number {
    const keys: Array<keyof TributoRow> = ['ventas', 'fuerza', 'sellos', 'anuncios', 'css20', 'css14', 'otros'];
    return this.round2(keys.reduce((acc, key) => acc + this.safeNumber(item[key]), 0));
  }

  private otrosDeduciblesSubtotal(item: TributoRow): number {
    const keys: Array<keyof TributoRow> = ['restauracion', 'arrendamiento', 'exonerado', 'otrosMFP', 'cuotaMensual'];
    return this.round2(keys.reduce((acc, key) => acc + this.safeNumber(item[key]), 0));
  }

  private estimateIncomeTax(baseImponible: number): number {
    if (baseImponible <= 10000) return 0;
    const value = this.round2(baseImponible);

    if (value <= taxBrackets[1].limit) {
      return this.round2((value - 10000) * taxBrackets[1].rate);
    }
    if (value <= taxBrackets[2].limit) {
      return this.round2(taxBrackets[2].base + (value - 20000) * taxBrackets[2].rate);
    }
    if (value <= taxBrackets[3].limit) {
      return this.round2(taxBrackets[3].base + (value - 30000) * taxBrackets[3].rate);
    }
    return this.round2(taxBrackets[4].base + (value - 50000) * taxBrackets[4].rate);
  }

  private isValidDay(month: MonthKey, day: number): boolean {
    if (!Number.isInteger(day) || day < 1) return false;
    const month31: MonthKey[] = ['ENE', 'MAR', 'MAY', 'JUL', 'AGO', 'OCT', 'DIC'];
    if (month31.includes(month)) return day <= 31;
    if (month === 'FEB') return day <= 29;
    return day <= 30;
  }

  private safeNumber(value: string): number {
    const parsed = Number(value || 0);
    if (!Number.isFinite(parsed)) return 0;
    return parsed;
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }
}

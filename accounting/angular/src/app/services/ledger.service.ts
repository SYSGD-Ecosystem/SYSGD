import { Injectable } from '@angular/core';
import {
  AlertMessage,
  AnnualReport,
  DayAmountRow,
  GeneralesData,
  MAX_MONTH_ROWS,
  MONTHS,
  InventarioRegistro,
  MonthEntries,
  MonthKey,
  MonthlyTotals,
  OperacionInventario,
  ProductoInventario,
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
  { limit: 10000, rate: 0.15, base: 0 },
  { limit: 20000, rate: 0.2, base: 1500 },
  { limit: 30000, rate: 0.3, base: 3500 },
  { limit: 50000, rate: 0.4, base: 6500 },
  { limit: Number.POSITIVE_INFINITY, rate: 0.5, base: 14500 }
];

const MIN_EXEMPT_ANNUAL_CUP = 39120;
const BACKUP_SCHEMA_VERSION = 1;

interface RegistroBackupPayload {
  app: string;
  schemaVersion: number;
  exportedAt: string;
  registro: RegistroTCP;
}

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
      tributos: MONTHS.map((month) => emptyTributo(monthLabel[month])),
      inventario: this.emptyInventario()
    };
  }

  private emptyInventario(): InventarioRegistro {
    return {
      productosVenta: [],
      productosCompra: [],
      operaciones: []
    };
  }

  addProductoInventario(tipo: 'venta' | 'compra', nombre: string, precio: number, unidad: string): RegistroTCP {
    const registro = this.getRegistro();
    const producto: ProductoInventario = {
      id: crypto.randomUUID(),
      nombre: nombre.trim(),
      precio: this.round2(precio),
      unidad: unidad.trim() || 'und',
      tipo
    };

    const inventario = { ...registro.inventario };
    if (tipo === 'venta') {
      inventario.productosVenta = [...inventario.productosVenta, producto];
    } else {
      inventario.productosCompra = [...inventario.productosCompra, producto];
    }

    const next = { ...registro, inventario };
    this.saveRegistro(next);
    return next;
  }

  addOperacionInventario(tipo: 'venta' | 'compra', productoId: string, cantidad: number, fechaIso: string): RegistroTCP {
    const registro = this.getRegistro();
    const lista = tipo === 'venta' ? registro.inventario.productosVenta : registro.inventario.productosCompra;
    const producto = lista.find((item) => item.id === productoId);
    if (!producto) return registro;

    const cantidadNormalizada = this.round2(cantidad);
    if (!Number.isFinite(cantidadNormalizada) || cantidadNormalizada <= 0) return registro;

    const operacion: OperacionInventario = {
      id: crypto.randomUUID(),
      tipo,
      fecha: fechaIso,
      productoId: producto.id,
      nombreProducto: producto.nombre,
      unidad: producto.unidad,
      cantidad: cantidadNormalizada,
      precioUnitario: producto.precio,
      total: this.round2(producto.precio * cantidadNormalizada)
    };

    const next = {
      ...registro,
      inventario: {
        ...registro.inventario,
        operaciones: [operacion, ...registro.inventario.operaciones]
      }
    };

    this.saveRegistro(next);
    return next;
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
        tributos: parsed.tributos?.length === 12 ? parsed.tributos : this.emptyRegistro(parsed.generales?.anio).tributos,
        inventario: this.normalizeInventario((parsed as Partial<RegistroTCP>).inventario)
      };
    } catch {
      return this.emptyRegistro();
    }
  }

  saveRegistro(registro: RegistroTCP): void {
    localStorage.setItem(LEDGER_CACHE_KEY, JSON.stringify(registro));
  }

  exportBackup(registro = this.getRegistro()): string {
    const payload: RegistroBackupPayload = {
      app: 'SYSGD Cont',
      schemaVersion: BACKUP_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      registro
    };
    return JSON.stringify(payload, null, 2);
  }

  importBackup(rawJson: string): RegistroTCP {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      throw new Error('El archivo no contiene JSON válido');
    }

    const payload = parsed as { registro?: unknown };
    const source = payload.registro ?? parsed;
    const normalized = this.normalizeRegistro(source);
    this.saveRegistro(normalized);
    return normalized;
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
    const netoAntesMinimo = this.round2(totalIngresos - totalGastos - totalTributos - totalOtrosDeducibles);
    const baseImponible = this.round2(Math.max(netoAntesMinimo - MIN_EXEMPT_ANNUAL_CUP, 0));
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

    const resultadoNeto = report.totalIngresos - report.totalGastos - report.totalTributos - report.totalOtrosDeducibles;
    if (resultadoNeto < 0) {
      alerts.push({
        level: 'warning',
        message: `Resultado anual negativo (${resultadoNeto.toFixed(2)} CUP). Verifica datos y soporte documental.`
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
    if (baseImponible <= 0) return 0;
    const value = this.round2(baseImponible);

    if (value <= taxBrackets[0].limit) {
      return this.round2(value * taxBrackets[0].rate);
    }
    if (value <= taxBrackets[1].limit) {
      return this.round2(taxBrackets[1].base + (value - 10000) * taxBrackets[1].rate);
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

  private normalizeRegistro(source: unknown): RegistroTCP {
    if (!source || typeof source !== 'object') {
      throw new Error('El JSON no contiene una estructura de registro válida');
    }

    const raw = source as Partial<RegistroTCP>;
    const year = Number(raw.generales?.anio);
    const base = this.emptyRegistro(Number.isFinite(year) && year >= 2020 ? year : new Date().getFullYear());

    const generales: GeneralesData = {
      nombre: String(raw.generales?.nombre ?? base.generales.nombre),
      anio: Number.isFinite(year) && year >= 2020 ? year : base.generales.anio,
      nit: String(raw.generales?.nit ?? base.generales.nit),
      actividad: String(raw.generales?.actividad ?? base.generales.actividad),
      codigo: String(raw.generales?.codigo ?? base.generales.codigo),
      fiscalCalle: String(raw.generales?.fiscalCalle ?? base.generales.fiscalCalle),
      fiscalMunicipio: String(raw.generales?.fiscalMunicipio ?? base.generales.fiscalMunicipio),
      fiscalProvincia: String(raw.generales?.fiscalProvincia ?? base.generales.fiscalProvincia),
      legalCalle: String(raw.generales?.legalCalle ?? base.generales.legalCalle),
      legalMunicipio: String(raw.generales?.legalMunicipio ?? base.generales.legalMunicipio),
      legalProvincia: String(raw.generales?.legalProvincia ?? base.generales.legalProvincia)
    };

    const normalizeRows = (rows: unknown): DayAmountRow[] => {
      if (!Array.isArray(rows)) return [];
      return rows
        .map((item) => {
          const row = item as { dia?: unknown; importe?: unknown };
          const dia = Number(row?.dia);
          const importe = Number(row?.importe);
          if (!Number.isFinite(dia) || dia < 1 || dia > 31) return null;
          if (!Number.isFinite(importe) || importe <= 0) return null;
          return { dia: String(Math.trunc(dia)), importe: this.round2(importe).toFixed(2) };
        })
        .filter((item): item is DayAmountRow => item !== null)
        .slice(0, MAX_MONTH_ROWS);
    };

    const ingresos: MonthEntries = { ...base.ingresos };
    const gastos: MonthEntries = { ...base.gastos };
    MONTHS.forEach((month) => {
      ingresos[month] = normalizeRows((raw.ingresos as Record<string, unknown> | undefined)?.[month]);
      gastos[month] = normalizeRows((raw.gastos as Record<string, unknown> | undefined)?.[month]);
    });

    const tributos: TributoRow[] = MONTHS.map((month, index) => {
      const rawRow = (raw.tributos?.[index] ?? {}) as Partial<TributoRow>;
      return {
        mes: monthLabel[month],
        ventas: String(rawRow.ventas ?? ''),
        fuerza: String(rawRow.fuerza ?? ''),
        sellos: String(rawRow.sellos ?? ''),
        anuncios: String(rawRow.anuncios ?? ''),
        css20: String(rawRow.css20 ?? ''),
        css14: String(rawRow.css14 ?? ''),
        otros: String(rawRow.otros ?? ''),
        restauracion: String(rawRow.restauracion ?? ''),
        arrendamiento: String(rawRow.arrendamiento ?? ''),
        exonerado: String(rawRow.exonerado ?? ''),
        otrosMFP: String(rawRow.otrosMFP ?? ''),
        cuotaMensual: String(rawRow.cuotaMensual ?? '')
      };
    });

    const inventario = this.normalizeInventario(raw.inventario as unknown);

    return { generales, ingresos, gastos, tributos, inventario };
  }

  private normalizeInventario(source: unknown): InventarioRegistro {
    const base = this.emptyInventario();
    if (!source || typeof source !== 'object') return base;

    const raw = source as { productosVenta?: unknown; productosCompra?: unknown; operaciones?: unknown };

    const normalizeProducto = (item: unknown, tipo: 'venta' | 'compra'): ProductoInventario | null => {
      if (!item || typeof item !== 'object') return null;
      const p = item as Partial<ProductoInventario>;
      const nombre = String(p.nombre ?? '').trim();
      const unidad = String(p.unidad ?? 'und').trim() || 'und';
      const precio = Number(p.precio);
      if (!nombre || !Number.isFinite(precio) || precio <= 0) return null;
      return {
        id: String(p.id ?? crypto.randomUUID()),
        nombre,
        unidad,
        precio: this.round2(precio),
        tipo
      };
    };

    const productosVenta = Array.isArray(raw.productosVenta)
      ? raw.productosVenta.map((item) => normalizeProducto(item, 'venta')).filter((item): item is ProductoInventario => item !== null)
      : [];
    const productosCompra = Array.isArray(raw.productosCompra)
      ? raw.productosCompra.map((item) => normalizeProducto(item, 'compra')).filter((item): item is ProductoInventario => item !== null)
      : [];

    const operaciones = Array.isArray(raw.operaciones)
      ? raw.operaciones
          .map((item): OperacionInventario | null => {
            if (!item || typeof item !== 'object') return null;
            const op = item as Partial<OperacionInventario>;
            const tipo = op.tipo === 'compra' ? 'compra' : op.tipo === 'venta' ? 'venta' : null;
            if (!tipo) return null;
            const cantidad = Number(op.cantidad);
            const precioUnitario = Number(op.precioUnitario);
            const total = Number(op.total);
            if (!Number.isFinite(cantidad) || cantidad <= 0 || !Number.isFinite(precioUnitario) || precioUnitario <= 0 || !Number.isFinite(total) || total <= 0) return null;
            return {
              id: String(op.id ?? crypto.randomUUID()),
              tipo,
              fecha: String(op.fecha ?? ''),
              productoId: String(op.productoId ?? ''),
              nombreProducto: String(op.nombreProducto ?? ''),
              unidad: String(op.unidad ?? 'und'),
              cantidad: this.round2(cantidad),
              precioUnitario: this.round2(precioUnitario),
              total: this.round2(total)
            };
          })
          .filter((item): item is OperacionInventario => item !== null)
      : [];

    return { productosVenta, productosCompra, operaciones };
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }
}

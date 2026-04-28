import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LedgerService } from '../services/ledger.service';
import { MONTHS, MonthKey, DayAmountRow } from '../models/ledger-entry.model';

@Component({
  selector: 'app-movimientos-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './movimientos-page.component.html',
  styleUrl: './movimientos-page.component.css'
})
export class MovimientosPageComponent implements OnInit {
  months = MONTHS;
  selectedMonth: MonthKey = MONTHS[new Date().getMonth()];
  registro: any = {};
  ingresos: DayAmountRow[] = [];
  gastos: DayAmountRow[] = [];
  ingresosTotal = 0;
  gastosTotal = 0;

  constructor(private readonly ledger: LedgerService) {}

  ngOnInit(): void {
    this.registro = this.ledger.getRegistro();
    this.updateMonthData();
  }

  onMonthChange(): void {
    this.updateMonthData();
  }

  private updateMonthData(): void {
    this.ingresos = this.registro.ingresos[this.selectedMonth] || [];
    this.gastos = this.registro.gastos[this.selectedMonth] || [];
    this.ingresosTotal = this.calculateTotal(this.ingresos);
    this.gastosTotal = this.calculateTotal(this.gastos);
  }

  private calculateTotal(rows: DayAmountRow[]): number {
    return rows.reduce((acc, row) => acc + (parseFloat(row.importe) || 0), 0);
  }

  trackByIndex(index: number): number {
    return index;
  }

  formatAmount(value: string): string {
    const num = parseFloat(value);
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
  }
}

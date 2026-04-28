import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LedgerService } from '../services/ledger.service';
import { TributoRow, MONTHS } from '../models/ledger-entry.model';

@Component({
  selector: 'app-tributos-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tributos-page.component.html',
  styleUrl: './tributos-page.component.css'
})
export class TributosPageComponent implements OnInit {
  months = MONTHS;
  selectedMonth = this.months[new Date().getMonth()];
  tributosRows: TributoRow[] = [];
  currentTributos: TributoRow | null = null;

  constructor(private readonly ledger: LedgerService) {}

  ngOnInit(): void {
    const registro = this.ledger.getRegistro();
    this.tributosRows = registro.tributos || [];
    this.updateCurrentTributos();
  }

  onMonthChange(): void {
    this.updateCurrentTributos();
  }

  private updateCurrentTributos(): void {
    const monthIndex = this.months.findIndex((m: string) => m === this.selectedMonth);
    this.currentTributos = this.tributosRows[monthIndex] || null;
  }

  formatValue(value: string): string {
    if (!value || value.trim() === '') return '-';
    const num = parseFloat(value);
    return isNaN(num) ? '-' : num.toFixed(2);
  }
}

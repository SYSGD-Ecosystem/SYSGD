import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LedgerService } from '../services/ledger.service';
import { AnnualReport, AlertMessage } from '../models/ledger-entry.model';

@Component({
  selector: 'app-resumen-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resumen-page.component.html',
  styleUrl: './resumen-page.component.css'
})
export class ResumenPageComponent implements OnInit {
  report: AnnualReport = {
    year: new Date().getFullYear(),
    totalIngresos: 0,
    totalGastos: 0,
    totalTributos: 0,
    totalOtrosDeducibles: 0,
    baseImponible: 0,
    impuestoEstimado: 0,
    monthly: []
  };
  alerts: AlertMessage[] = [];
  threshold = 500000;

  constructor(private readonly ledger: LedgerService) {}

  ngOnInit(): void {
    this.report = this.ledger.getAnnualReport();
    this.alerts = this.ledger.buildAlerts();
  }

  getAlertClass(level: string): string {
    return level === 'warning' ? 'warning' : level === 'ok' ? 'ok' : '';
  }

  formatNumber(value: number): string {
    return value.toFixed(2);
  }
}

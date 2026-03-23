import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MonthKey, TributoRow } from '../../models/ledger-entry.model';

@Component({
  selector: 'app-tributos-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './tributos-section.component.html',
  styleUrl: './tributos-section.component.css'
})
export class TributosSectionComponent {
  @Input({ required: true }) tributoForm!: FormGroup;
  @Input({ required: true }) months!: readonly MonthKey[];
  @Input({ required: true }) tributosRows!: TributoRow[];

  @Output() saveTributos = new EventEmitter<void>();
  @Output() autoCalculate = new EventEmitter<void>();

  formatMoney(value: string): string {
    return value.trim() ? value : '-';
  }

  tributosSubtotal(row: TributoRow): string {
    const total =
      this.toNumber(row.ventas) +
      this.toNumber(row.fuerza) +
      this.toNumber(row.sellos) +
      this.toNumber(row.anuncios) +
      this.toNumber(row.css20) +
      this.toNumber(row.css14) +
      this.toNumber(row.otros);
    return total > 0 ? total.toFixed(2) : '-';
  }

  otrosSubtotal(row: TributoRow): string {
    const total =
      this.toNumber(row.restauracion) +
      this.toNumber(row.arrendamiento) +
      this.toNumber(row.exonerado) +
      this.toNumber(row.otrosMFP) +
      this.toNumber(row.cuotaMensual);
    return total > 0 ? total.toFixed(2) : '-';
  }

  private toNumber(value: string): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}

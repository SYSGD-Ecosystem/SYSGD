import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DayAmountRow, MonthKey, RegistroTCP } from '../../models/ledger-entry.model';

@Component({
  selector: 'app-movimientos-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './movimientos-section.component.html',
  styleUrl: './movimientos-section.component.css'
})
export class MovimientosSectionComponent {
  @Input({ required: true }) movForm!: FormGroup;
  @Input({ required: true }) months!: readonly MonthKey[];
  @Input({ required: true }) selectedMonth!: MonthKey;
  @Input({ required: true }) registro!: RegistroTCP;
  @Input({ required: true }) selectedMonthIngresosTotal!: number;
  @Input({ required: true }) selectedMonthGastosTotal!: number;
  @Input({ required: true }) trackByDayAmount!: (index: number, item: DayAmountRow) => string;

  @Output() saveMovement = new EventEmitter<void>();
}

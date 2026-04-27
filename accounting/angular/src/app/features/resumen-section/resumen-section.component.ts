import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AlertMessage, AnnualReport } from '../../models/ledger-entry.model';

@Component({
  selector: 'app-resumen-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resumen-section.component.html',
  styleUrl: './resumen-section.component.css'
})
export class ResumenSectionComponent {
  @Input({ required: true }) report!: AnnualReport;
  @Input({ required: true }) threshold!: number;
  @Input({ required: true }) alerts!: AlertMessage[];
  @Input({ required: true }) djPreview!: string;
  @Input({ required: true }) pdfLoading!: boolean;
  @Input() backupMessage = '';

  @Output() downloadPdf = new EventEmitter<void>();
  @Output() exportJson = new EventEmitter<void>();
  @Output() importJson = new EventEmitter<File>();

  onImportSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.importJson.emit(file);
    }
    input.value = '';
  }
}

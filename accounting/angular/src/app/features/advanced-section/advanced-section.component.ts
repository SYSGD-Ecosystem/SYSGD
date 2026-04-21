import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { RegistroTCP } from '../../models/ledger-entry.model';
import { LedgerService } from '../../services/ledger.service';

@Component({
  selector: 'app-advanced-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './advanced-section.component.html',
  styleUrl: './advanced-section.component.css'
})
export class AdvancedSectionComponent {
  @Input() registro!: RegistroTCP;
  @Output() restoreFromJson = new EventEmitter<string>();
  @Output() importFile = new EventEmitter<File>();
  @Output() pushRawJson = new EventEmitter<string>();

  jsonInput = '';
  message = '';
  isError = false;

  constructor(private readonly ledger: LedgerService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.importFile.emit(file);
    input.value = '';
  }

  restoreFromTextarea(): void {
    if (!this.jsonInput.trim()) {
      this.message = 'Por favor, introduce un JSON válido.';
      this.isError = true;
      return;
    }

    try {
      JSON.parse(this.jsonInput);
      this.restoreFromJson.emit(this.jsonInput);
      this.message = 'Datos restaurados correctamente.';
      this.isError = false;
    } catch {
      this.message = 'El texto introducido no es un JSON válido.';
      this.isError = true;
    }
  }

  clearJsonInput(): void {
    this.jsonInput = '';
    this.message = '';
  }

  pushRawJsonToServer(): void {
    if (!this.jsonInput.trim()) {
      this.message = 'El campo está vacío.';
      this.isError = true;
      return;
    }
    this.pushRawJson.emit(this.jsonInput.trim());
    this.message = 'Enviando al servidor...';
    this.isError = false;
  }
}
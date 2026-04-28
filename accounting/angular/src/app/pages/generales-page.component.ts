import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LedgerService } from '../services/ledger.service';
import { MONTHS, MonthKey } from '../models/ledger-entry.model';

@Component({
  selector: 'app-generales-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './generales-page.component.html',
  styleUrl: './generales-page.component.css'
})
export class GeneralesPageComponent implements OnInit {
  generales: any = {};
  provinces = [
    'Pinar del Río', 'Artemisa', 'La Habana', 'Mayabeque', 'Matanzas',
    'Cienfuegos', 'Villa Clara', 'Sancti Spíritus', 'Ciego de Ávila',
    'Camagüey', 'Las Tunas', 'Granma', 'Holguín', 'Santiago de Cuba',
    'Guantánamo', 'Isla de la Juventud'
  ];

  constructor(private readonly ledger: LedgerService) {}

  ngOnInit(): void {
    this.generales = this.ledger.getRegistro().generales;
  }
}

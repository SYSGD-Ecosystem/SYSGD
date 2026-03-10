import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DayAmountRow, MonthKey, OperacionInventario, RegistroTCP } from '../../models/ledger-entry.model';

@Component({
  selector: 'app-movimientos-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
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

  @Input({ required: true }) historialOperacionesMes!: OperacionInventario[];

  @Output() addProductoInventarioEvent = new EventEmitter<{
    tipo: 'venta' | 'compra';
    nombre: string;
    precio: number;
    unidad: string;
  }>();

  @Output() registrarOperacionInventarioEvent = new EventEmitter<{
    tipo: 'venta' | 'compra';
    productoId: string;
    cantidad: number;
    fecha: string;
  }>();

  productoTipo: 'venta' | 'compra' = 'venta';
  productoNombre = '';
  productoPrecio: number | null = null;
  productoUnidad = 'und';

  operacionTipo: 'venta' | 'compra' = 'venta';
  operacionProductoId = '';
  operacionCantidad: number | null = null;
  operacionFecha = new Date().toISOString().slice(0, 10);

  get productosOperacion() {
    return this.operacionTipo === 'venta'
      ? this.registro.inventario.productosVenta
      : this.registro.inventario.productosCompra;
  }

  addProductoInventario(): void {
    if (!this.productoNombre.trim() || !this.productoPrecio || this.productoPrecio <= 0) return;
    this.addProductoInventarioEvent.emit({
      tipo: this.productoTipo,
      nombre: this.productoNombre.trim(),
      precio: this.productoPrecio,
      unidad: this.productoUnidad.trim() || 'und'
    });
    this.productoNombre = '';
    this.productoPrecio = null;
    this.productoUnidad = 'und';
  }

  registrarOperacionInventario(): void {
    if (!this.operacionProductoId || !this.operacionCantidad || this.operacionCantidad <= 0 || !this.operacionFecha) return;
    this.registrarOperacionInventarioEvent.emit({
      tipo: this.operacionTipo,
      productoId: this.operacionProductoId,
      cantidad: this.operacionCantidad,
      fecha: this.operacionFecha
    });
    this.operacionCantidad = null;
  }

}

import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MonthKey, OperacionInventario, RegistroTCP } from '../../models/ledger-entry.model';

@Component({
  selector: 'app-inventario-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario-section.component.html',
  styleUrl: './inventario-section.component.css'
})
export class InventarioSectionComponent {
  @Input({ required: true }) months!: readonly MonthKey[];
  @Input({ required: true }) selectedMonth!: MonthKey;
  @Input({ required: true }) registro!: RegistroTCP;
  @Input({ required: true }) historialOperacionesMes!: OperacionInventario[];

  @Output() selectedMonthChange = new EventEmitter<MonthKey>();
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

  inventarioTab: 'venta' | 'compra' | 'historial' = 'venta';

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

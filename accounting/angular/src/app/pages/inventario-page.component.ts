import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LedgerService } from '../services/ledger.service';
import { ProductoInventario, OperacionInventario } from '../models/ledger-entry.model';

@Component({
  selector: 'app-inventario-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inventario-page.component.html',
  styleUrl: './inventario-page.component.css'
})
export class InventarioPageComponent implements OnInit {
  productosVenta: ProductoInventario[] = [];
  productosCompra: ProductoInventario[] = [];
  operaciones: OperacionInventario[] = [];

  constructor(private readonly ledger: LedgerService) {}

  ngOnInit(): void {
    const registro = this.ledger.getRegistro();
    this.productosVenta = registro.inventario?.productosVenta || [];
    this.productosCompra = registro.inventario?.productosCompra || [];
    this.operaciones = registro.inventario?.operaciones || [];
  }

  formatPrice(precio: number): string {
    return precio.toFixed(2);
  }

  getOperacionProducto(productoId: string, tipo: string): ProductoInventario | undefined {
    const list = tipo === 'venta' ? this.productosVenta : this.productosCompra;
    return list.find(p => p.id === productoId);
  }
}

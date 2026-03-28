import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RegistroTCP, ProductoInventario, OperacionInventario, MONTHS, MonthKey } from '../../models/ledger-entry.model';

@Component({
  selector: 'app-inventario-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario-section.component.html',
  styleUrl: './inventario-section.component.css'
})
export class InventarioSectionComponent {
  @Input({ required: true }) registro!: RegistroTCP;
  @Output() registroChange = new EventEmitter<RegistroTCP>();

  currentTab: 'venta' | 'compra' | 'inventario' | 'historial' = 'venta';

  fechaTrabajo = new Date().toISOString().slice(0, 10);
  mesActualIndex = new Date().getMonth();
  anioActual = new Date().getFullYear();

  cart: Map<ProductoInventario, number> = new Map();
  cartCompra: Map<ProductoInventario, number> = new Map();

  showCantidadDialog = false;
  showCartModal = false;
  showCatalogModal = false;
  selectedProducto: ProductoInventario | null = null;
  carritoTipo: 'venta' | 'compra' = 'venta';
  cantidadInput: number = 1;
  catalogTab: 'venta' | 'compra' = 'venta';

  nuevoProductoNombre = '';
  nuevoProductoPrecio: number | null = null;
  nuevoProductoUnidad = 'und';
  selectedEmoji = '📦';

  expandedDias = new Set<string>();
  expandedOperaciones = new Set<string>();

  private readonly nombresDias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  emojis = [
    '📦', '🍔', '☕', '🥤', '🍟', '🍕', '🎁', '🥪', '🌮', '🍜',
    '🍰', '🧁', '🍩', '🍪', '🍫', '🍬', '🍭', '🍮', '🍯', '🥛',
    '🧃', '🧉', '🍺', '🍻', '🥂', '🥃', '🫗', '🥤', '🧋', '🍵',
    '👕', '👖', '👗', '👘', '👙', '👚', '👛', '👜', '👝', '🎒',
    '👞', '👟', '👠', '👡', '👢', '👑', '👒', '🎩', '🎓', '⛑️',
    '📱', '💻', '⌨️', '🖱️', '🖨️', '📷', '📹', '🎥', '📞', '☎️',
    '📺', '📻', '🎙️', '🎚️', '🎛️', '⏰', '⌚', '📡', '🔋', '💡',
    '🧹', '🧺', '🧻', '🧼', '🪥', '🪒', '🧽', '🪣', '🧴', '🛎️',
    '🔑', '🗝️', '🔒', '🔓', '📁', '📂', '🗂️', '📅', '📆', '📇',
    '✏️', '🖊️', '🖋️', '📌', '📍', '✂️', '🗃️', '🗄️', '📎', '📏'
  ];

  cantidadesRapidas = [1, 2, 3, 5, 10, 0.5, 0.25];

  get productosVenta(): ProductoInventario[] {
    return this.registro?.inventario?.productosVenta || [];
  }

  get productosCompra(): ProductoInventario[] {
    return this.registro?.inventario?.productosCompra || [];
  }

  get cartEntries(): { producto: ProductoInventario; cantidad: number }[] {
    const entries: { producto: ProductoInventario; cantidad: number }[] = [];
    this.cart.forEach((cantidad, producto) => {
      entries.push({ producto, cantidad });
    });
    return entries;
  }

  get cartCompraEntries(): { producto: ProductoInventario; cantidad: number }[] {
    const entries: { producto: ProductoInventario; cantidad: number }[] = [];
    this.cartCompra.forEach((cantidad, producto) => {
      entries.push({ producto, cantidad });
    });
    return entries;
  }

  get cartTotal(): number {
    let total = 0;
    this.cart.forEach((cantidad, producto) => {
      total += producto.precio * cantidad;
    });
    return Math.round(total * 100) / 100;
  }

  get cartCompraTotal(): number {
    let total = 0;
    this.cartCompra.forEach((cantidad, producto) => {
      total += producto.precio * cantidad;
    });
    return Math.round(total * 100) / 100;
  }

  get cartItemCount(): number {
    let count = 0;
    this.cart.forEach(cantidad => count += cantidad);
    return Math.round(count * 100) / 100;
  }

  get cartCompraItemCount(): number {
    let count = 0;
    this.cartCompra.forEach(cantidad => count += cantidad);
    return Math.round(count * 100) / 100;
  }

  get operaciones(): OperacionInventario[] {
    return this.registro?.inventario?.operaciones || [];
  }

  get operacionesMes(): OperacionInventario[] {
    const mesStr = String(this.mesActualIndex + 1).padStart(2, '0');
    const anioStr = String(this.anioActual);
    return this.operaciones.filter(op => op.fecha.startsWith(`${anioStr}-${mesStr}`));
  }

  get operacionesPorDia(): { fecha: string; operaciones: OperacionInventario[]; totalVentas: number; totalCompras: number }[] {
    const diasMap = new Map<string, { fecha: string; operaciones: OperacionInventario[]; totalVentas: number; totalCompras: number }>();
    
    this.operacionesMes.forEach(op => {
      if (!diasMap.has(op.fecha)) {
        diasMap.set(op.fecha, { fecha: op.fecha, operaciones: [], totalVentas: 0, totalCompras: 0 });
      }
      const dia = diasMap.get(op.fecha)!;
      dia.operaciones.push(op);
      if (op.tipo === 'venta') {
        dia.totalVentas += op.total;
      } else {
        dia.totalCompras += op.total;
      }
    });

    return Array.from(diasMap.values()).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }

  get operacionesDia(): OperacionInventario[] {
    return this.operaciones.filter(op => op.fecha === this.fechaTrabajo);
  }

  get totalVentasDia(): number {
    return this.operacionesDia
      .filter(op => op.tipo === 'venta')
      .reduce((acc, op) => acc + op.total, 0);
  }

  get totalComprasDia(): number {
    return this.operacionesDia
      .filter(op => op.tipo === 'compra')
      .reduce((acc, op) => acc + op.total, 0);
  }

  get totalVentasMes(): number {
    return this.operacionesMes
      .filter(op => op.tipo === 'venta')
      .reduce((acc, op) => acc + op.total, 0);
  }

  get totalComprasMes(): number {
    return this.operacionesMes
      .filter(op => op.tipo === 'compra')
      .reduce((acc, op) => acc + op.total, 0);
  }

  totalInventario(id:string): number {
    return this.operaciones
      .filter(op => op.productoId === id)
      .reduce((acc, op) => acc + op.cantidad, 0);
  }

  get balanceMes(): number {
    return Math.round((this.totalVentasMes - this.totalComprasMes) * 100) / 100;
  }

  get mesActualLabel(): string {
    return MONTHS[this.mesActualIndex];
  }

  selectProducto(producto: ProductoInventario, tipo: 'venta' | 'compra'): void {
    this.selectedProducto = producto;
    this.carritoTipo = tipo;
    this.cantidadInput = 1;
    this.showCantidadDialog = true;
  }

  closeCantidadDialog(): void {
    this.showCantidadDialog = false;
    this.selectedProducto = null;
    this.cantidadInput = 1;
  }

  incrementarCantidad(): void {
    this.cantidadInput = Math.round((this.cantidadInput + 1) * 100) / 100;
  }

  decrementarCantidad(): void {
    if (this.cantidadInput > 0.01) {
      this.cantidadInput = Math.round((this.cantidadInput - 1) * 100) / 100;
    }
  }

  agregarAlCarrito(): void {
    if (!this.selectedProducto || !this.cantidadInput || this.cantidadInput <= 0) return;

    if (this.carritoTipo === 'venta') {
      const actual = this.cart.get(this.selectedProducto) || 0;
      this.cart.set(this.selectedProducto, Math.round((actual + this.cantidadInput) * 100) / 100);
    } else {
      const actual = this.cartCompra.get(this.selectedProducto) || 0;
      this.cartCompra.set(this.selectedProducto, Math.round((actual + this.cantidadInput) * 100) / 100);
    }

    this.closeCantidadDialog();
  }

  addToCart(producto: ProductoInventario): void {
    const actual = this.cart.get(producto) || 0;
    this.cart.set(producto, Math.round((actual + 1) * 100) / 100);
  }

  removeFromCart(producto: ProductoInventario): void {
    const actual = this.cart.get(producto) || 0;
    if (actual > 1) {
      this.cart.set(producto, Math.round((actual - 1) * 100) / 100);
    } else {
      this.cart.delete(producto);
    }
  }

  addToCartCompra(producto: ProductoInventario): void {
    const actual = this.cartCompra.get(producto) || 0;
    this.cartCompra.set(producto, Math.round((actual + 1) * 100) / 100);
  }

  removeFromCartCompra(producto: ProductoInventario): void {
    const actual = this.cartCompra.get(producto) || 0;
    if (actual > 1) {
      this.cartCompra.set(producto, Math.round((actual - 1) * 100) / 100);
    } else {
      this.cartCompra.delete(producto);
    }
  }

  openCart(): void {
    this.showCartModal = true;
  }

  closeCart(): void {
    this.showCartModal = false;
  }

  openCatalog(): void {
    this.catalogTab = this.currentTab === 'compra' ? 'compra' : 'venta';
    this.nuevoProductoNombre = '';
    this.nuevoProductoPrecio = null;
    this.nuevoProductoUnidad = 'und';
    this.showCatalogModal = true;
  }

  closeCatalog(): void {
    this.showCatalogModal = false;
  }

  agregarProducto(): void {
    if (!this.nuevoProductoNombre?.trim() || !this.nuevoProductoPrecio || this.nuevoProductoPrecio <= 0) {
      alert('Completa el nombre y precio');
      return;
    }

    const producto: ProductoInventario = {
      id: crypto.randomUUID(),
      nombre: this.nuevoProductoNombre.trim(),
      precio: Math.round(this.nuevoProductoPrecio * 100) / 100,
      unidad: this.nuevoProductoUnidad?.trim() || 'und',
      tipo: this.catalogTab,
      emoji: this.selectedEmoji
    };

    if (!this.registro || !this.registro.inventario) {
      alert('Error: No hay registro');
      return;
    }

    const inventario = { ...this.registro.inventario };
    
    if (this.catalogTab === 'venta') {
      const currentProductos = inventario.productosVenta || [];
      inventario.productosVenta = [...currentProductos, producto];
    } else {
      const currentProductos = inventario.productosCompra || [];
      inventario.productosCompra = [...currentProductos, producto];
    }

    const newRegistro = { ...this.registro, inventario };
    this.registro = newRegistro;
    this.registroChange.emit(newRegistro);

    this.nuevoProductoNombre = '';
    this.nuevoProductoPrecio = null;
    this.nuevoProductoUnidad = 'und';
    this.selectedEmoji = '📦';
  }

  eliminarProducto(producto: ProductoInventario): void {
    if (!confirm(`¿Eliminar "${producto.nombre}"?`)) return;

    const inventario = { ...this.registro.inventario };
    if (producto.tipo === 'venta') {
      inventario.productosVenta = (inventario.productosVenta || []).filter(p => p.id !== producto.id);
    } else {
      inventario.productosCompra = (inventario.productosCompra || []).filter(p => p.id !== producto.id);
    }

    this.registro = { ...this.registro, inventario };
    this.registroChange.emit(this.registro);
  }

  registrarOperacion(): void {
    const fechaIso = this.fechaTrabajo;
    const now = new Date();
    const hora = now.toISOString().slice(11, 19);

    const nuevasOperaciones: OperacionInventario[] = [];

    if (this.carritoTipo === 'venta') {
      this.cart.forEach((cantidad, producto) => {
        nuevasOperaciones.push({
          id: crypto.randomUUID(),
          tipo: 'venta',
          fecha: fechaIso,
          productoId: producto.id,
          nombreProducto: producto.nombre,
          unidad: producto.unidad,
          cantidad: Math.round(cantidad * 100) / 100,
          precioUnitario: producto.precio,
          total: Math.round(producto.precio * cantidad * 100) / 100
        });
      });
      this.cart.clear();
    } else {
      this.cartCompra.forEach((cantidad, producto) => {
        nuevasOperaciones.push({
          id: crypto.randomUUID(),
          tipo: 'compra',
          fecha: fechaIso,
          productoId: producto.id,
          nombreProducto: producto.nombre,
          unidad: producto.unidad,
          cantidad: Math.round(cantidad * 100) / 100,
          precioUnitario: producto.precio,
          total: Math.round(producto.precio * cantidad * 100) / 100
        });
      });
      this.cartCompra.clear();
    }

    if (nuevasOperaciones.length > 0) {
      const inventario = {
        ...this.registro.inventario,
        operaciones: [...nuevasOperaciones, ...(this.registro.inventario.operaciones || [])].slice(0, 500)
      };
      this.registro = { ...this.registro, inventario };
      this.registroChange.emit(this.registro);
    }

    this.closeCart();
  }

  mesAnterior(): void {
    if (this.mesActualIndex === 0) {
      this.mesActualIndex = 11;
      this.anioActual--;
    } else {
      this.mesActualIndex--;
    }
  }

  mesSiguiente(): void {
    if (this.mesActualIndex === 11) {
      this.mesActualIndex = 0;
      this.anioActual++;
    } else {
      this.mesActualIndex++;
    }
  }

  toggleDia(fecha: string): void {
    if (this.expandedDias.has(fecha)) {
      this.expandedDias.delete(fecha);
    } else {
      this.expandedDias.add(fecha);
    }
  }

  isDiaExpanded(fecha: string): boolean {
    return this.expandedDias.has(fecha);
  }

  toggleOperacion(opId: string): void {
    if (this.expandedOperaciones.has(opId)) {
      this.expandedOperaciones.delete(opId);
    } else {
      this.expandedOperaciones.add(opId);
    }
  }

  isOperacionExpanded(opId: string): boolean {
    return this.expandedOperaciones.has(opId);
  }

  getDiaNombre(fecha: string): string {
    const date = new Date(fecha);
    const dia = date.getDay();
    const numero = date.getDate();
    return `${this.nombresDias[dia]} ${numero}`;
  }

  eliminarOperacion(op: OperacionInventario): void {
    if (!confirm(`¿Eliminar esta ${op.tipo === 'venta' ? 'venta' : 'compra'} de ${op.nombreProducto}?`)) {
      return;
    }

    const operaciones = (this.registro.inventario.operaciones || []).filter(o => o.id !== op.id);
    const inventario = { ...this.registro.inventario, operaciones };
    this.registro = { ...this.registro, inventario };
    this.registroChange.emit(this.registro);
  }
}

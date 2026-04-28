export type MonthCode =
  | "ENE" | "FEB" | "MAR" | "ABR" | "MAY" | "JUN"
  | "JUL" | "AGO" | "SEP" | "OCT" | "NOV" | "DIC";

export type TributoKey = "ventas" | "fuerza" | "sellos" | "anuncios" | "css20" | "css14" | "otros" | "restauracion" | "arrendamiento" | "exonerado" | "otrosMFP" | "cuotaMensual";

export type NaturalezaCuenta = "ACREEDORA" | "DEUDORA";

export type TipoCuenta = "ACTIVO" | "PASIVO" | "PATRIMONIO" | "INGRESO" | "GASTO";

export type TipoEntidadTercero = "TCP" | "PARTICULAR" | "ESTATAL" | "MIPYME";

export type RolTerceroType = "CLIENTE" | "PROVEEDOR" | "EMPLEADO" | "ESTADO";

export type TipoCuentaTercero = "DEUDA" | "PRESTAMO";

export type EstadoCuentaTercero = "PENDIENTE" | "PAGADO" | "COBRADO" | "VENCIDO" | "CANCELADO";

export type TipoMovimientoInventario = "COMPRA" | "VENTA" | "AJUSTE" | "TRANSFERENCIA";

export type CategoriaTributo = "TRIBUTO" | "OTRO_DEDUCIBLE";

export type CuentaContable = {
  id: string;
  codigo: string;
  nombre: string;
  naturaleza: NaturalezaCuenta;
  tipo: TipoCuenta;
  padreId: string | null;
  usaParaTributo: string | null;
  activo: boolean;
  createdAt: number;
  updatedAt: number;
};

export type IngresoGastoCuenta = {
  id: string;
  ingresoGastoId: string;
  mes: string;
  tipo: "INGRESO" | "GASTO";
  cuentaId: string;
  createdAt: number;
};

export type IngresoGastoNota = {
  id: string;
  ingresoGastoId: string;
  mes: string;
  tipo: "INGRESO" | "GASTO";
  nota: string;
  createdAt: number;
};

export type PosIntegrationConfig = {
  id: string;
  enabled: boolean;
  ingresoCuentaId: string | null;
  gastoCuentaId: string | null;
  updatedAt: number;
};

export type TributoConfig = {
  key: TributoKey;
  nombre: string;
  categoria: CategoriaTributo;
  porcentaje: number;
  incluido: boolean;
  autocalcular: boolean;
  orden: number;
  updatedAt: number;
};

export type TributoCuentaBase = {
  tributoKey: TributoKey;
  cuentaId: string;
  createdAt: number;
};

export type AccountingWorkspaceState = {
  cuentasContables: CuentaContable[];
  ingresoGastoCuentas: IngresoGastoCuenta[];
  ingresoGastoNotas: IngresoGastoNota[];
  posIntegrationConfig: PosIntegrationConfig | null;
  tributoConfigs: TributoConfig[];
  tributoCuentaBases: TributoCuentaBase[];
};

export type Almacen = {
  id: string;
  nombre: string;
  principal: boolean;
};

export type ProductoInventario = {
  id: string;
  nombre: string;
  unidad: string;
  descripcion: string;
  emoji: string;
  precio: number;
  tipo: string;
};

export type CatalogoVenta = {
  id: string;
  productoId: string;
  precioReferencia: number;
  almacenId: string;
  activo: boolean;
};

export type CatalogoCompra = {
  id: string;
  productoId: string;
  precioReferencia: number;
  almacenDestinoId: string;
  activo: boolean;
};

export type HistorialPrecio = {
  id: string;
  productoId: string;
  almacenId: string;
  fechaDesde: string;
  precio: number;
  moneda: string;
  tipoPrecio: "COMPRA" | "VENTA";
  activo: boolean;
  createdAt: number;
};

export type MovimientoInventario = {
  id: string;
  tipoMovimiento: TipoMovimientoInventario;
  fecha: string;
  hora: string;
  productoId: string;
  cantidad: number;
  almacenOrigenId: string | null;
  almacenDestinoId: string | null;
  stockOrigenAntes: number | null;
  stockOrigenDespues: number | null;
  stockDestinoAntes: number | null;
  stockDestinoDespues: number | null;
  referenciaId: string;
  nota: string;
};

export type OperacionInventario = {
  id: string;
  tipo: "venta" | "compra";
  fecha: string;
  hora: string;
  anulada: boolean;
  productoId: string;
  nombreProducto: string;
  unidad: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  almacenId: string;
  operacionId: string;
};

export type StockRegistro = {
  id: string;
  productoId: string;
  almacenId: string;
  stockDisponible: number;
  modoStock: "ILIMITADO" | "MANUAL" | "VINCULADO";
  productosVinculadosIds: string;
  ratiosConversion: string;
  ultimaActualizacion: string;
  visibleEnVentas: boolean;
};

export type VinculoInventario = Record<string, unknown>;

export type InventarioRegistro = {
  productos: ProductoInventario[];
  catalogoVentas: CatalogoVenta[];
  catalogoCompras: CatalogoCompra[];
  historialPrecios: HistorialPrecio[];
  almacenes: Almacen[];
  stock: StockRegistro[];
  vinculos: VinculoInventario[];
  movimientos: MovimientoInventario[];
  operaciones: OperacionInventario[];
  productosVenta: ProductoInventario[];
  productosCompra: ProductoInventario[];
};

export type Tercero = {
  id: string;
  nombre: string;
  tipoEntidad: TipoEntidadTercero;
  telefono: string;
  correo: string;
  direccion: string;
  identificadorFiscal: string;
  numeroTarjeta: string;
  direccionCrypto: string;
  nota: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TerceroRol = {
  id: string;
  terceroId: string;
  rol: RolTerceroType;
  activo: boolean;
  createdAt: string;
};

export type TerceroCuenta = {
  id: string;
  terceroId: string;
  tipoCuenta: TipoCuentaTercero;
  categoria: "CLIENTE" | "PROVEEDOR";
  concepto: string;
  descripcion: string;
  montoOriginal: number;
  montoPendiente: number;
  fechaCreacion: string;
  fechaVencimiento: string;
  estado: EstadoCuentaTercero;
  moneda: string;
  origenTipo: string;
  origenId: string;
  nota: string;
  createdAt: string;
  updatedAt: string;
};

export type TerceroMovimiento = {
  id: string;
  cuentaId: string;
  tipoMovimiento: string;
  monto: number;
  fecha: string;
  metodo: string;
  referencia: string;
  nota: string;
  createdAt: string;
};

export type TercerosRegistro = {
  terceros: Tercero[];
  roles: TerceroRol[];
  cuentas: TerceroCuenta[];
  movimientos: TerceroMovimiento[];
};

export type GeneralesData = {
  nombre: string;
  anio: number;
  nit: string;
  actividad: string;
  codigo: string;
  fiscalCalle: string;
  fiscalMunicipio: string;
  fiscalProvincia: string;
  legalCalle: string;
  legalMunicipio: string;
  legalProvincia: string;
};

export type DayAmountRow = {
  id: string;
  dia: string;
  importe: string;
};

export type MonthEntries = Record<MonthCode, DayAmountRow[]>;

export type TributoRow = {
  mes: string;
  ventas: string;
  fuerza: string;
  sellos: string;
  anuncios: string;
  css20: string;
  css14: string;
  otros: string;
  restauracion: string;
  arrendamiento: string;
  exonerado: string;
  otrosMFP: string;
  cuotaMensual: string;
};

export type RegistroTCP = {
  generales: GeneralesData;
  ingresos: MonthEntries;
  gastos: MonthEntries;
  tributos: TributoRow[];
  inventario: InventarioRegistro;
  terceros: TercerosRegistro;
};

export type CloudWorkspaceEntry = {
  id: string;
  name: string;
  registro: RegistroTCP;
  accounting: AccountingWorkspaceState;
};

export type CloudLedgerContainer = {
  activeWorkspaceId: string;
  workspaces: CloudWorkspaceEntry[];
};

export type ContLedgerResponse = {
  registro: CloudLedgerContainer;
  inventarioRegistro: InventarioRegistro | null;
  updatedAt: string;
};

export type PdfGeneralData = {
  anio: string;
  nombre: string;
  nit: string;
  fiscalCalle: string;
  fiscalMunicipio: string;
  fiscalProvincia: string;
  legalCalle: string;
  legalMunicipio: string;
  legalProvincia: string;
  actividad: string;
  codigo: string;
  firmaDia: string;
  firmaMes: string;
  firmaAnio: string;
};

export type TcpPdfPayload = {
  generalData: PdfGeneralData;
  ingresos: Record<string, DayAmountRow[]>;
  gastos: Record<string, DayAmountRow[]>;
  tributos: TributoRow[];
};

export type MonthlyTotals = {
  month: string;
  ingresos: number;
  gastos: number;
  tributos: number;
  otrosDeducibles: number;
  neto: number;
};

export type AnnualReport = {
  year: number;
  totalIngresos: number;
  totalGastos: number;
  totalTributos: number;
  totalOtrosDeducibles: number;
  baseImponible: number;
  impuestoEstimado: number;
  monthly: MonthlyTotals[];
};

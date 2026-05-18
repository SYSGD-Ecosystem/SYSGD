import { CloudWorkspaceEntry, Moneda, MonedaTasa, MonedaTasaHistorial, Wallet2, WalletMovimientoTipo, WalletReferenciaTipo, WalletTipo } from "@/accounting/core/types/accountingTypes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
    ArrowDownRight,
    ArrowRightLeft,
    ArrowUpRight,
    Banknote,
    Building2,
    CircleDollarSign,
    Coins,
    LineChart,
    Package,
    Plus,
    Receipt,
    Settings,
    Smartphone,
    TrendingUp,
    Wallet,
    AlertCircle,
    Pencil,
    Trash2,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { FC, useMemo, useState } from "react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    XAxis,
    YAxis,
} from "recharts";
import { formatMoney } from "../accountingMath";

type WalletLedgerRow = {
  id: string;
  fecha: string;
  tipo: string;
  descripcion: string;
  origen: string;
  destino: string;
  monto: number;
  monedaTipo?: string;
  tasaAlMomento?: number;
};


const WALLET_COLORS = {
  EFECTIVO: "hsl(142, 76%, 36%)",
  BANCO: "hsl(221, 83%, 53%)",
  MOVIL: "hsl(262, 83%, 58%)",
  OTRO: "hsl(25, 95%, 53%)",
  MERCANCIA: "hsl(199, 89%, 48%)",
};

const WALLET_ICONS = {
  EFECTIVO: Banknote,
  BANCO: Building2,
  MOVIL: Smartphone,
  OTRO: CircleDollarSign,
};

type CajaBancoProps = {
  workspace: CloudWorkspaceEntry;
  // Entidades de moneda
  monedas: Moneda[];
  monedaTasas: MonedaTasa[];
  monedaTasaHistorial?: MonedaTasaHistorial[];
  // Callbacks
  onCreateWallet: (payload: {
    nombre: string;
    tipo: WalletTipo;
    saldoInicial: number;
    monedaId: string;
  }) => Promise<void>;

  onCreateMovimiento: (payload: {
    tipo: WalletMovimientoTipo;
    walletOrigenId: string | null;
    walletDestinoId: string | null;
    monto: number;
    monedaId: string;
    tasaAlMomento: number;
    referenciaTipo: WalletReferenciaTipo;
    nota: string;
    fecha: string;
  }) => Promise<void>;

  onUpdateMonedaTasa?: (monedaId: string, nuevaTasa: number) => Promise<void>;
  onCreateMoneda: (payload: {
    nombre: string;
    tipo: string;
    tasaInicial: number;
  }) => Promise<void>;
  onDeleteMoneda?: (monedaId: string) => Promise<void>;
  savingWallet: boolean;
  savingMovimiento: boolean;
  savingMoneda: boolean;
};

const CajaBanco: FC<CajaBancoProps> = ({ 
  workspace, 
  monedas,
  monedaTasas,
  // monedaTasaHistorial = [],
  onCreateWallet, 
  onCreateMovimiento,
  onUpdateMonedaTasa,
  onCreateMoneda,
  onDeleteMoneda,
  savingWallet,
  savingMovimiento,
  savingMoneda,
}) => {
  // Estado del modal de crear billetera
  const [walletNombre, setWalletNombre] = useState("");
  const [walletTipo, setWalletTipo] = useState<WalletTipo>("EFECTIVO");
  const [walletSaldoInicial, setWalletSaldoInicial] = useState("0");
  const [walletMonedaId, setWalletMonedaId] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Estado del modal de movimiento
  const [movDialogOpen, setMovDialogOpen] = useState(false);
  const [movTipo, setMovTipo] = useState<WalletMovimientoTipo>("ENTRADA");
  const [movWalletOrigenId, setMovWalletOrigenId] = useState("");
  const [movWalletDestinoId, setMovWalletDestinoId] = useState("");
  const [movMontoOriginal, setMovMontoOriginal] = useState("");
  const [movMonedaId, setMovMonedaId] = useState("");
  const [movTasaPersonalizada, setMovTasaPersonalizada] = useState("");
  const [movNota, setMovNota] = useState("");
  const [movFecha, setMovFecha] = useState(() => new Date().toISOString().slice(0, 10));
  
  // Estado del modal de tasas de cambio
  const [tasasDialogOpen, setTasasDialogOpen] = useState(false);
  const [editingTasas, setEditingTasas] = useState<Record<string, string>>({});
  
  // Estado para ver historial de una billetera específica
  const [selectedWalletForChart, setSelectedWalletForChart] = useState<string | null>(null);

  // Estado del modal de crear moneda
  const [monedaDialogOpen, setMonedaDialogOpen] = useState(false);
  const [monedaNombre, setMonedaNombre] = useState("");
  const [monedaTipo, setMonedaTipo] = useState("");
  const [monedaTasaInicial, setMonedaTasaInicial] = useState("1");
  
  // Estado para el diálogo de crear moneda base
  const [showNoCurrencyAlert, setShowNoCurrencyAlert] = useState(false);
  const [creatingBaseCurrency, setCreatingBaseCurrency] = useState(false);

  // Helpers para obtener moneda y tasa
  const getMonedaById = (id: string): Moneda | undefined => monedas.find((m) => m.id === id);
  const getTasaByMonedaId = (monedaId: string): number => {
    const moneda = getMonedaById(monedaId);
    if (!moneda) return 1;
    const tasa = monedaTasas.find((t) => t.id === moneda.tasaId);
    return tasa?.tasa ?? 1;
  };
  const getMonedaBase = (): Moneda | undefined => monedas.find((m) => m.tipo === "CUP");

  // Inicializar moneda por defecto
  useMemo(() => {
    if (monedas.length > 0 && !walletMonedaId) {
      const base = getMonedaBase();
      if (base) setWalletMonedaId(base.id);
    }
    if (monedas.length > 0 && !movMonedaId) {
      const base = getMonedaBase();
      if (base) setMovMonedaId(base.id);
    }
  }, [monedas]);

  // Inicializar tasas editables
  useMemo(() => {
    const initial: Record<string, string> = {};
    monedas.forEach((m) => {
      initial[m.id] = String(getTasaByMonedaId(m.id));
    });
    setEditingTasas(initial);
  }, [monedas, monedaTasas]);

  // Verificar si no hay monedas y mostrar alerta
  useMemo(() => {
    if (monedas.length === 0) {
      setShowNoCurrencyAlert(true);
    } else {
      setShowNoCurrencyAlert(false);
    }
  }, [monedas]);

  const wallets =
    workspace.accounting.wallets?.filter((wallet) => wallet.activo) ?? [];
  const walletMovimientos = workspace.accounting.walletMovimientos ?? [];

  // Calcular tasa de cambio actual para el movimiento
  const getTasaCambioActual = (): number => {
    if (movTasaPersonalizada) {
      const tasa = Number.parseFloat(movTasaPersonalizada);
      if (!Number.isNaN(tasa) && tasa > 0) return tasa;
    }
    return getTasaByMonedaId(movMonedaId);
  };

  // Monto convertido a moneda base (CUP)
  const montoEnBase = useMemo(() => {
    const monto = Number.parseFloat(movMontoOriginal);
    if (Number.isNaN(monto)) return 0;
    return monto * getTasaCambioActual();
  }, [movMontoOriginal, movMonedaId, movTasaPersonalizada, monedaTasas]);

  // Moneda seleccionada actual
  const movMonedaActual = getMonedaById(movMonedaId);
  const monedaBase = getMonedaBase();

  const baseWallets =
    wallets.length > 0
      ? wallets
      : [
          {
            id: "wallet-efectivo",
            nombre: "Caja efectivo",
            tipo: "EFECTIVO",
            saldoInicial: 0,
            moneda: "CUP",
            activo: true,
            createdAt: 0,
            updatedAt: 0,
          },
          {
            id: "wallet-banco",
            nombre: "Banco",
            tipo: "BANCO",
            saldoInicial: 0,
            moneda: "CUP",
            activo: true,
            createdAt: 0,
            updatedAt: 0,
          },
          {
            id: "wallet-movil",
            nombre: "Saldo móvil",
            tipo: "MOVIL",
            saldoInicial: 0,
            moneda: "CUP",
            activo: true,
            createdAt: 0,
            updatedAt: 0,
          },
        ];

  const valorMercancia = workspace.registro.inventario.stock.reduce(
    (total, stock) => {
      const precioCostoActivo = workspace.registro.inventario.historialPrecios
        .filter(
          (precio) =>
            precio.productoId === stock.productoId &&
            precio.tipoPrecio === "COMPRA" &&
            precio.activo
        )
        .sort((a, b) => b.fechaDesde.localeCompare(a.fechaDesde))[0];
      const precioCosto = precioCostoActivo?.precio ?? 0;
      return total + stock.stockDisponible * precioCosto;
    },
    0
  );

  const walletSaldos = baseWallets.map((wallet) => {
    const entradas = walletMovimientos
      .filter((mov) => mov.walletDestinoId === wallet.id)
      .reduce((total, mov) => total + mov.monto, 0);
    const salidas = walletMovimientos
      .filter((mov) => mov.walletOrigenId === wallet.id)
      .reduce((total, mov) => total + mov.monto, 0);
    return { ...wallet, saldoActual: wallet.saldoInicial + entradas - salidas };
  });

  const totalLiquido = walletSaldos
    .filter((wallet) => wallet.tipo !== "MERCANCIA")
    .reduce((total, wallet) => total + wallet.saldoActual, 0);

  const totalEntradas = walletMovimientos
    .filter((mov) => mov.walletDestinoId && !mov.walletOrigenId)
    .reduce((total, mov) => total + mov.monto, 0);

  const totalSalidas = walletMovimientos
    .filter((mov) => mov.walletOrigenId && !mov.walletDestinoId)
    .reduce((total, mov) => total + mov.monto, 0);

  const walletNameById = Object.fromEntries(
    walletSaldos.map((wallet) => [wallet.id, wallet.nombre])
  );

  const movimientos: WalletLedgerRow[] = walletMovimientos
    .map((mov) => {
      const moneda = getMonedaById(mov.monedaId);
      return {
        id: mov.id,
        fecha: mov.fecha,
        tipo: mov.tipo,
        descripcion: mov.nota || mov.referenciaTipo || "Movimiento",
        origen: mov.walletOrigenId
          ? (walletNameById[mov.walletOrigenId] ?? "Wallet desconocida")
          : "Entrada externa",
        destino: mov.walletDestinoId
          ? (walletNameById[mov.walletDestinoId] ?? "Wallet desconocida")
          : "Salida externa",
        monto: mov.monto,
        monedaTipo: moneda?.tipo || "CUP",
        tasaAlMomento: mov.tasaAlMomento,
      };
    })
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  // Chart data for pie chart
  const pieChartData = useMemo(() => {
    return walletSaldos
      .filter((w) => w.saldoActual > 0)
      .map((wallet) => ({
        name: wallet.nombre,
        value: wallet.saldoActual,
        tipo: wallet.tipo,
        fill: WALLET_COLORS[wallet.tipo as keyof typeof WALLET_COLORS] || WALLET_COLORS.OTRO,
      }));
  }, [walletSaldos]);

  // Chart data for bar chart (wallet balances)
  const barChartData = useMemo(() => {
    return walletSaldos.map((wallet) => ({
      name: wallet.nombre,
      saldo: wallet.saldoActual,
      tipo: wallet.tipo,
      fill: WALLET_COLORS[wallet.tipo as keyof typeof WALLET_COLORS] || WALLET_COLORS.OTRO,
    }));
  }, [walletSaldos]);

  // Chart data for area chart (movements over time)
  const movementTrendData = useMemo(() => {
    const grouped: Record<string, { entradas: number; salidas: number }> = {};
    
    walletMovimientos.forEach((mov) => {
      const date = mov.fecha.slice(0, 10);
      if (!grouped[date]) {
        grouped[date] = { entradas: 0, salidas: 0 };
      }
      if (mov.walletDestinoId && !mov.walletOrigenId) {
        grouped[date].entradas += mov.monto;
      } else if (mov.walletOrigenId && !mov.walletDestinoId) {
        grouped[date].salidas += mov.monto;
      }
    });

    return Object.entries(grouped)
      .map(([fecha, data]) => ({
        fecha,
        entradas: data.entradas,
        salidas: data.salidas,
      }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .slice(-14); // Last 14 days
  }, [walletMovimientos]);

  // Datos de evolución de saldo para una billetera específica
  const walletHistoryData = useMemo(() => {
    if (!selectedWalletForChart) return [];
    
    const wallet = walletSaldos.find((w) => w.id === selectedWalletForChart);
    if (!wallet) return [];

    // Obtener movimientos de esta billetera ordenados por fecha
    const movs = walletMovimientos
      .filter((m) => m.walletOrigenId === wallet.id || m.walletDestinoId === wallet.id)
      .sort((a, b) => a.fecha.localeCompare(b.fecha));

    if (movs.length === 0) {
      return [{ fecha: "Inicial", saldo: wallet.saldoInicial }];
    }

    let saldoAcumulado = wallet.saldoInicial;
    const dataPoints: { fecha: string; saldo: number }[] = [
      { fecha: "Inicial", saldo: saldoAcumulado },
    ];

    movs.forEach((mov) => {
      if (mov.walletDestinoId === wallet.id) {
        saldoAcumulado += mov.monto;
      }
      if (mov.walletOrigenId === wallet.id) {
        saldoAcumulado -= mov.monto;
      }
      dataPoints.push({
        fecha: mov.fecha.slice(5, 10),
        saldo: saldoAcumulado,
      });
    });

    return dataPoints;
  }, [selectedWalletForChart, walletSaldos, walletMovimientos]);

  const chartConfig: ChartConfig = {
    saldo: { label: "Saldo", color: "hsl(142, 76%, 36%)" },
    entradas: { label: "Entradas", color: "hsl(142, 76%, 36%)" },
    salidas: { label: "Salidas", color: "hsl(0, 84%, 60%)" },
  };

  const handleCreateWallet = async () => {
    const saldo = Number.parseFloat(walletSaldoInicial);
    if (!walletNombre.trim() || Number.isNaN(saldo) || !walletMonedaId) return;
    await onCreateWallet({
      nombre: walletNombre.trim(),
      tipo: walletTipo,
      saldoInicial: saldo,
      monedaId: walletMonedaId,
    });
    setWalletNombre("");
    setWalletSaldoInicial("0");
    const base = getMonedaBase();
    if (base) setWalletMonedaId(base.id);
    setDialogOpen(false);
  };

  const handleCreateMovimiento = async () => {
    const montoOriginal = Number.parseFloat(movMontoOriginal);
    if (Number.isNaN(montoOriginal) || montoOriginal <= 0) return;
    if (!movMonedaId) return;

    // Validaciones según tipo
    if (movTipo === "ENTRADA" && !movWalletDestinoId) return;
    if (movTipo === "SALIDA" && !movWalletOrigenId) return;
    if (movTipo === "TRANSFERENCIA" && (!movWalletOrigenId || !movWalletDestinoId)) return;
    if (movTipo === "TRANSFERENCIA" && movWalletOrigenId === movWalletDestinoId) return;

    const tasaActual = getTasaCambioActual();
    const moneda = getMonedaById(movMonedaId);

    await onCreateMovimiento({
      tipo: movTipo,
      walletOrigenId: movTipo === "ENTRADA" ? null : movWalletOrigenId,
      walletDestinoId: movTipo === "SALIDA" ? null : movWalletDestinoId,
      monto: montoOriginal,
      monedaId: movMonedaId,
      tasaAlMomento: tasaActual,
      referenciaTipo: "MANUAL",
      nota: movNota.trim() || `${movTipo}${moneda && moneda.tipo !== "CUP" ? ` - ${movMontoOriginal} ${moneda.tipo} @ ${tasaActual}` : ""}`,
      fecha: movFecha,
    });

    // Reset form
    setMovTipo("ENTRADA");
    setMovWalletOrigenId("");
    setMovWalletDestinoId("");
    setMovMontoOriginal("");
    const base = getMonedaBase();
    if (base) setMovMonedaId(base.id);
    setMovTasaPersonalizada("");
    setMovNota("");
    setMovFecha(new Date().toISOString().slice(0, 10));
    setMovDialogOpen(false);
  };

  const resetMovimientoForm = () => {
    setMovWalletOrigenId("");
    setMovWalletDestinoId("");
  };

  const handleCreateMoneda = async () => {
    if (!monedaNombre.trim() || !monedaTipo.trim()) return;
    const tasa = Number.parseFloat(monedaTasaInicial);
    if (Number.isNaN(tasa) || tasa <= 0) return;

    await onCreateMoneda({
      nombre: monedaNombre.trim(),
      tipo: monedaTipo.trim().toUpperCase(),
      tasaInicial: tasa,
    });

    setMonedaNombre("");
    setMonedaTipo("");
    setMonedaTasaInicial("1");
    setMonedaDialogOpen(false);
  };

  const handleCreateBaseCurrency = async () => {
    setCreatingBaseCurrency(true);
    try {
      await onCreateMoneda({
        nombre: "Peso Cubano",
        tipo: "CUP",
        tasaInicial: 1,
      });
      setShowNoCurrencyAlert(false);
    } finally {
      setCreatingBaseCurrency(false);
    }
  };

  // Si no hay monedas, mostrar alerta para crear la moneda base
  if (showNoCurrencyAlert) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Caja y Banco</h2>
          <p className="text-muted-foreground">
            Gestión integral del flujo de efectivo y cuentas bancarias.
          </p>
        </div>
        <Alert variant="default" className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 dark:text-amber-200">
            Configuración inicial requerida
          </AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300">
            <p className="mb-4">
              Para comenzar a usar el sistema de Caja y Banco, necesitas configurar al menos una moneda base. 
              El Peso Cubano (CUP) se usará como moneda de referencia para todas las conversiones.
            </p>
            <Button 
              onClick={handleCreateBaseCurrency}
              disabled={creatingBaseCurrency}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {creatingBaseCurrency ? "Creando..." : "Crear Peso Cubano (CUP) como moneda base"}
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Caja y Banco</h2>
          <p className="text-muted-foreground">
            Gestión integral del flujo de efectivo y cuentas bancarias.
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nueva Billetera
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Crear Nueva Billetera</DialogTitle>
                <DialogDescription>
                  Añade una nueva billetera para gestionar tus fondos.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="nombre">Nombre de la billetera</Label>
                  <Input
                    id="nombre"
                    placeholder="Ej: BPA, Caja Principal..."
                    value={walletNombre}
                    onChange={(e) => setWalletNombre(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tipo">Tipo de billetera</Label>
                  <Select
                    value={walletTipo}
                    onValueChange={(value) =>
                      setWalletTipo(
                        value as "EFECTIVO" | "BANCO" | "MOVIL" | "OTRO"
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EFECTIVO">
                        <div className="flex items-center gap-2">
                          <Banknote className="h-4 w-4" />
                          Efectivo
                        </div>
                      </SelectItem>
                      <SelectItem value="BANCO">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Banco
                        </div>
                      </SelectItem>
                      <SelectItem value="MOVIL">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          Móvil
                        </div>
                      </SelectItem>
                      <SelectItem value="OTRO">
                        <div className="flex items-center gap-2">
                          <CircleDollarSign className="h-4 w-4" />
                          Otro
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="moneda">Moneda</Label>
                  <Select
                    value={walletMonedaId}
                    onValueChange={setWalletMonedaId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      {monedas.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          <div className="flex items-center gap-2">
                            <span>{m.nombre}</span>
                            <span className="text-muted-foreground">({m.tipo})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="saldo">Saldo inicial</Label>
                  <div className="flex gap-2">
                    <Input
                      id="saldo"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={walletSaldoInicial}
                      onChange={(e) => setWalletSaldoInicial(e.target.value)}
                      className="flex-1"
                    />
                    <span className="flex items-center text-sm text-muted-foreground px-3 bg-muted rounded-md">
                      {getMonedaById(walletMonedaId)?.tipo || "---"}
                    </span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateWallet} disabled={savingWallet || !walletMonedaId}>
                  {savingWallet ? "Creando..." : "Crear Billetera"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {/* Modal Registrar Movimiento */}
          <Dialog open={movDialogOpen} onOpenChange={setMovDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Receipt className="mr-2 h-4 w-4" />
                Registrar movimiento
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Registrar Movimiento</DialogTitle>
                <DialogDescription>
                  Registra un ingreso, gasto o transferencia entre billeteras.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Tipo de movimiento */}
                <div className="grid gap-2">
                  <Label>Tipo de movimiento</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={movTipo === "ENTRADA" ? "default" : "outline"}
                      className="flex-col h-auto py-3"
                      onClick={() => { setMovTipo("ENTRADA"); resetMovimientoForm(); }}
                    >
                      <ArrowDownRight className="h-5 w-5 mb-1 text-emerald-500" />
                      <span className="text-xs">Ingreso</span>
                    </Button>
                    <Button
                      type="button"
                      variant={movTipo === "SALIDA" ? "default" : "outline"}
                      className="flex-col h-auto py-3"
                      onClick={() => { setMovTipo("SALIDA"); resetMovimientoForm(); }}
                    >
                      <ArrowUpRight className="h-5 w-5 mb-1 text-rose-500" />
                      <span className="text-xs">Gasto</span>
                    </Button>
                    <Button
                      type="button"
                      variant={movTipo === "TRANSFERENCIA" ? "default" : "outline"}
                      className="flex-col h-auto py-3"
                      onClick={() => { setMovTipo("TRANSFERENCIA"); resetMovimientoForm(); }}
                    >
                      <ArrowRightLeft className="h-5 w-5 mb-1 text-blue-500" />
                      <span className="text-xs">Transferencia</span>
                    </Button>
                  </div>
                </div>

                {/* Billetera origen (para SALIDA y TRANSFERENCIA) */}
                {(movTipo === "SALIDA" || movTipo === "TRANSFERENCIA") && (
                  <div className="grid gap-2">
                    <Label>{movTipo === "TRANSFERENCIA" ? "Billetera origen" : "Desde billetera"}</Label>
                    <Select value={movWalletOrigenId} onValueChange={setMovWalletOrigenId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar billetera" />
                      </SelectTrigger>
                      <SelectContent>
                        {walletSaldos.map((w) => {
                          const Icon = WALLET_ICONS[w.tipo as keyof typeof WALLET_ICONS] || CircleDollarSign;
                          return (
                            <SelectItem key={w.id} value={w.id}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                <span>{w.nombre}</span>
                                <span className="text-muted-foreground">
                                  ({formatMoney(w.saldoActual)} CUP)
                                </span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Billetera destino (para ENTRADA y TRANSFERENCIA) */}
                {(movTipo === "ENTRADA" || movTipo === "TRANSFERENCIA") && (
                  <div className="grid gap-2">
                    <Label>{movTipo === "TRANSFERENCIA" ? "Billetera destino" : "A billetera"}</Label>
                    <Select value={movWalletDestinoId} onValueChange={setMovWalletDestinoId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar billetera" />
                      </SelectTrigger>
                      <SelectContent>
                        {walletSaldos
                          .filter((w) => w.id !== movWalletOrigenId)
                          .map((w) => {
                            const Icon = WALLET_ICONS[w.tipo as keyof typeof WALLET_ICONS] || CircleDollarSign;
                            return (
                              <SelectItem key={w.id} value={w.id}>
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4" />
                                  <span>{w.nombre}</span>
                                  <span className="text-muted-foreground">
                                    ({formatMoney(w.saldoActual)} CUP)
                                  </span>
                                </div>
                              </SelectItem>
                            );
                          })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Monto y moneda */}
                <div className="grid gap-2">
                  <Label>Monto</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={movMontoOriginal}
                      onChange={(e) => setMovMontoOriginal(e.target.value)}
                      className="flex-1"
                    />
                    <Select value={movMonedaId} onValueChange={setMovMonedaId}>
                      <SelectTrigger className="w-28">
                        <SelectValue placeholder="Moneda" />
                      </SelectTrigger>
                      <SelectContent>
                        {monedas.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Tasa de cambio (si no es moneda base) */}
                {movMonedaActual && movMonedaActual.tipo !== "CUP" && (
                  <div className="grid gap-2">
                    <Label className="flex items-center justify-between">
                      <span>Tasa de cambio (1 {movMonedaActual.tipo} = X {monedaBase?.tipo || "CUP"})</span>
                      <span className="text-xs text-muted-foreground">
                        Predeterminado: {getTasaByMonedaId(movMonedaId)}
                      </span>
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder={String(getTasaByMonedaId(movMonedaId))}
                      value={movTasaPersonalizada}
                      onChange={(e) => setMovTasaPersonalizada(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Equivalente: <span className="font-semibold">{formatMoney(montoEnBase)} {monedaBase?.tipo || "CUP"}</span>
                    </p>
                  </div>
                )}

                {/* Fecha */}
                <div className="grid gap-2">
                  <Label>Fecha</Label>
                  <Input
                    type="date"
                    value={movFecha}
                    onChange={(e) => setMovFecha(e.target.value)}
                  />
                </div>

                {/* Nota */}
                <div className="grid gap-2">
                  <Label>Nota (opcional)</Label>
                  <Textarea
                    placeholder="Descripción del movimiento..."
                    value={movNota}
                    onChange={(e) => setMovNota(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setMovDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleCreateMovimiento} 
                  disabled={savingMovimiento || montoEnBase <= 0 || !movMonedaId}
                >
                  {savingMovimiento ? "Guardando..." : "Registrar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Modal Tasas de Cambio */}
          <Dialog open={tasasDialogOpen} onOpenChange={setTasasDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" title="Configurar tasas de cambio">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Tasas de Cambio</DialogTitle>
                <DialogDescription>
                  Configura las tasas de conversión respecto a {monedaBase?.nombre || "CUP"}. Estas tasas se usan como valores predeterminados al registrar movimientos.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {monedas.filter((m) => m.tipo !== "CUP").map((moneda) => (
                  <div key={moneda.id} className="grid gap-2">
                    <Label className="flex items-center justify-between">
                      <span>{moneda.nombre} ({moneda.tipo})</span>
                      <span className="text-xs text-muted-foreground">
                        1 {moneda.tipo} = X {monedaBase?.tipo || "CUP"}
                      </span>
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={editingTasas[moneda.id] ?? ""}
                      onChange={(e) => setEditingTasas((prev) => ({
                        ...prev,
                        [moneda.id]: e.target.value,
                      }))}
                    />
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setTasasDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={async () => {
                    if (onUpdateMonedaTasa) {
                      for (const [monedaId, valor] of Object.entries(editingTasas)) {
                        const moneda = getMonedaById(monedaId);
                        if (moneda && moneda.tipo !== "CUP") {
                          const tasa = Number.parseFloat(valor);
                          if (!Number.isNaN(tasa) && tasa > 0) {
                            await onUpdateMonedaTasa(monedaId, tasa);
                          }
                        }
                      }
                    }
                    setTasasDialogOpen(false);
                  }}
                >
                  Guardar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="resumen" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="resumen" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="billeteras" className="gap-2">
            <Wallet className="h-4 w-4" />
            Billeteras
          </TabsTrigger>
          <TabsTrigger value="movimientos" className="gap-2">
            <ArrowUpRight className="h-4 w-4" />
            Movimientos
          </TabsTrigger>
          <TabsTrigger value="monedas" className="gap-2">
            <Coins className="h-4 w-4" />
            Monedas
          </TabsTrigger>
        </TabsList>

        {/* Tab: Resumen */}
        <TabsContent value="resumen" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Líquido
                    </p>
                    <p
                      className={cn(
                        "text-2xl font-bold",
                        totalLiquido >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      )}
                    >
                      {formatMoney(totalLiquido)} CUP
                    </p>
                  </div>
                  <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-900/30">
                    <Wallet className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Valor Mercancía
                    </p>
                    <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                      {formatMoney(valorMercancia)} CUP
                    </p>
                  </div>
                  <div className="rounded-full bg-sky-100 p-3 dark:bg-sky-900/30">
                    <Package className="h-6 w-6 text-sky-600 dark:text-sky-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Entradas
                    </p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatMoney(totalEntradas)} CUP
                    </p>
                  </div>
                  <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-900/30">
                    <ArrowUpRight className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Salidas
                    </p>
                    <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                      {formatMoney(totalSalidas)} CUP
                    </p>
                  </div>
                  <div className="rounded-full bg-rose-100 p-3 dark:bg-rose-900/30">
                    <ArrowDownRight className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Pie Chart - Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Distribución de Fondos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pieChartData.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-75">
                    <PieChart>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value) => `${formatMoney(Number(value))} CUP`}
                          />
                        }
                      />
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="flex h-75 items-center justify-center text-muted-foreground">
                    Sin datos para mostrar
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bar Chart - Wallet Balances */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Saldos por Billetera
                </CardTitle>
              </CardHeader>
              <CardContent>
                {barChartData.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-75">
                    <BarChart data={barChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={(v) => formatMoney(v)} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={100}
                        tick={{ fontSize: 12 }}
                      />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value) => `${formatMoney(Number(value))} CUP`}
                          />
                        }
                      />
                      <Bar dataKey="saldo" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="flex h-75 items-center justify-center text-muted-foreground">
                    Sin datos para mostrar
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Area Chart - Movement Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Tendencia de Movimientos (últimos 14 días)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {movementTrendData.length > 0 ? (
                <ChartContainer config={chartConfig} className="h-75">
                  <AreaChart data={movementTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="fecha"
                      tickFormatter={(v) => v.slice(5)}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis tickFormatter={(v) => formatMoney(v)} />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => `${formatMoney(Number(value))} CUP`}
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="entradas"
                      stackId="1"
                      stroke="hsl(142, 76%, 36%)"
                      fill="hsl(142, 76%, 36%)"
                      fillOpacity={0.4}
                    />
                    <Area
                      type="monotone"
                      dataKey="salidas"
                      stackId="2"
                      stroke="hsl(0, 84%, 60%)"
                      fill="hsl(0, 84%, 60%)"
                      fillOpacity={0.4}
                    />
                  </AreaChart>
                </ChartContainer>
              ) : (
                <div className="flex h-75 items-center justify-center text-muted-foreground">
                  Sin movimientos registrados
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Billeteras */}
        <TabsContent value="billeteras" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {walletSaldos.map((wallet) => {
              const Icon =
                WALLET_ICONS[wallet.tipo as keyof typeof WALLET_ICONS] ||
                CircleDollarSign;
              const color =
                WALLET_COLORS[wallet.tipo as keyof typeof WALLET_COLORS] ||
                WALLET_COLORS.OTRO;
              const walletMoneda = getMonedaById((wallet as Wallet2).monedaId);

              return (
                <Card
                  key={wallet.id}
                  className="relative overflow-hidden transition-shadow hover:shadow-md"
                >
                  <div
                    className="absolute inset-y-0 left-0 w-1"
                    style={{ backgroundColor: color }}
                  />
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          {wallet.nombre}
                        </p>
                        <p
                          className={cn(
                            "text-2xl font-bold",
                            wallet.saldoActual >= 0
                              ? "text-foreground"
                              : "text-rose-600 dark:text-rose-400"
                          )}
                        >
                          {formatMoney(wallet.saldoActual)} {walletMoneda?.tipo || "CUP"}
                        </p>
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                            style={{
                              backgroundColor: `${color}20`,
                              color: color,
                            }}
                          >
                            {wallet.tipo}
                          </span>
                          {walletMoneda && walletMoneda.tipo !== "CUP" && (
                            <span className="text-xs text-muted-foreground">
                              @ {getTasaByMonedaId((wallet as Wallet2).monedaId)} CUP
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        className="rounded-xl p-3"
                        style={{ backgroundColor: `${color}15` }}
                      >
                        <Icon className="h-6 w-6" style={{ color }} />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div>
                          <span className="block font-medium text-foreground">
                            {formatMoney(wallet.saldoInicial)}
                          </span>
                          <span>Saldo inicial</span>
                        </div>
                        <div className="h-8 w-px bg-border" />
                        <div>
                          <span className="block font-medium text-foreground">
                            {
                              walletMovimientos.filter(
                                (m) =>
                                  m.walletOrigenId === wallet.id ||
                                  m.walletDestinoId === wallet.id
                              ).length
                            }
                          </span>
                          <span>Movimientos</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedWalletForChart(
                          selectedWalletForChart === wallet.id ? null : wallet.id
                        )}
                        className="h-8"
                      >
                        <LineChart className="h-4 w-4" />
                      </Button>
                    </div>
                    {/* Mini chart for this wallet */}
                    {selectedWalletForChart === wallet.id && (
                      <div className="mt-4 border-t pt-4">
                        <p className="mb-2 text-xs font-medium text-muted-foreground">
                          Evolución del saldo
                        </p>
                        {walletHistoryData.length > 1 ? (
                          <ChartContainer config={chartConfig} className="h-30">
                            <AreaChart data={walletHistoryData}>
                              <XAxis
                                dataKey="fecha"
                                tick={{ fontSize: 9 }}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis hide />
                              <ChartTooltip
                                content={
                                  <ChartTooltipContent
                                    formatter={(value) => `${formatMoney(Number(value))} ${walletMoneda?.tipo || "CUP"}`}
                                  />
                                }
                              />
                              <Area
                                type="monotone"
                                dataKey="saldo"
                                stroke={color}
                                fill={color}
                                fillOpacity={0.2}
                              />
                            </AreaChart>
                          </ChartContainer>
                        ) : (
                          <div className="flex h-30 items-center justify-center text-xs text-muted-foreground">
                            Sin historial suficiente
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {/* Merchandise Card */}
            <Card className="relative overflow-hidden border-dashed transition-shadow hover:shadow-md">
              <div
                className="absolute inset-y-0 left-0 w-1"
                style={{ backgroundColor: WALLET_COLORS.MERCANCIA }}
              />
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Mercancía (costo)
                    </p>
                    <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                      {formatMoney(valorMercancia)} CUP
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Calculada desde inventario
                    </p>
                  </div>
                  <div
                    className="rounded-xl p-3"
                    style={{ backgroundColor: `${WALLET_COLORS.MERCANCIA}15` }}
                  >
                    <Package
                      className="h-6 w-6"
                      style={{ color: WALLET_COLORS.MERCANCIA }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Movimientos */}
        <TabsContent value="movimientos" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Historial de Movimientos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs font-medium uppercase text-muted-foreground">
                      <th className="py-3 pr-4">Fecha</th>
                      <th className="py-3 pr-4">Tipo</th>
                      <th className="py-3 pr-4">Origen</th>
                      <th className="py-3 pr-4">Destino</th>
                      <th className="py-3 pr-4">Descripción</th>
                      <th className="py-3 pr-4 text-right">Monto</th>
                      <th className="py-3 pr-4 text-right">Tasa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map((mov) => (
                      <tr
                        key={mov.id}
                        className="border-b border-border/50 transition-colors hover:bg-muted/50"
                      >
                        <td className="py-3 pr-4 font-medium">{mov.fecha}</td>
                        <td className="py-3 pr-4">
                          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                            {mov.tipo}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {mov.origen}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {mov.destino}
                        </td>
                        <td className="py-3 pr-4">{mov.descripcion}</td>
                        <td className="py-3 pr-4 text-right font-semibold tabular-nums">
                          {formatMoney(mov.monto)} {mov.monedaTipo}
                        </td>
                        <td className="py-3 pr-4 text-right text-xs text-muted-foreground tabular-nums">
                          {mov.monedaTipo !== "CUP" && mov.tasaAlMomento ? (
                            <span>@ {mov.tasaAlMomento}</span>
                          ) : (
                            <span>-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {movimientos.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-12 text-center text-muted-foreground"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Wallet className="h-8 w-8 opacity-50" />
                            <span>Sin movimientos registrados</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Monedas */}
        <TabsContent value="monedas" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Gestión de Monedas</h3>
              <p className="text-sm text-muted-foreground">
                Administra las monedas y sus tasas de cambio respecto al {monedaBase?.nombre || "CUP"}.
              </p>
            </div>
            <Dialog open={monedaDialogOpen} onOpenChange={setMonedaDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Moneda
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Crear Nueva Moneda</DialogTitle>
                  <DialogDescription>
                    Añade una nueva moneda al sistema. La tasa indica cuántos {monedaBase?.tipo || "CUP"} equivalen a 1 unidad de esta moneda.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="moneda-nombre">Nombre</Label>
                    <Input
                      id="moneda-nombre"
                      placeholder="Ej: Dólar Estadounidense"
                      value={monedaNombre}
                      onChange={(e) => setMonedaNombre(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="moneda-tipo">Código (ISO)</Label>
                    <Input
                      id="moneda-tipo"
                      placeholder="Ej: USD, EUR, MLC"
                      value={monedaTipo}
                      onChange={(e) => setMonedaTipo(e.target.value.toUpperCase())}
                      maxLength={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      Código corto para identificar la moneda (máx. 5 caracteres)
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="moneda-tasa">
                      Tasa de cambio (1 {monedaTipo || "XXX"} = X {monedaBase?.tipo || "CUP"})
                    </Label>
                    <Input
                      id="moneda-tasa"
                      type="number"
                      step="0.01"
                      placeholder="350"
                      value={monedaTasaInicial}
                      onChange={(e) => setMonedaTasaInicial(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Por ejemplo, si 1 USD = 350 CUP, ingresa 350
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setMonedaDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCreateMoneda} 
                    disabled={savingMoneda || !monedaNombre.trim() || !monedaTipo.trim()}
                  >
                    {savingMoneda ? "Creando..." : "Crear Moneda"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Moneda Base Card */}
          {monedaBase && (
            <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-emerald-100 p-2 dark:bg-emerald-900/50">
                      <Coins className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{monedaBase.nombre}</CardTitle>
                      <p className="text-sm text-muted-foreground">Moneda base del sistema</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                    {monedaBase.tipo}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Todas las demás monedas se comparan contra esta moneda. La tasa de cambio siempre es 1.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Other Currencies Grid */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {monedas.filter((m) => m.tipo !== "CUP").map((moneda) => {
              const tasa = getTasaByMonedaId(moneda.id);
              const tasaObj = monedaTasas.find((t) => t.id === moneda.tasaId);
              
              return (
                <Card key={moneda.id} className="relative overflow-hidden transition-shadow hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
                          <CircleDollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{moneda.nombre}</CardTitle>
                          <p className="text-xs text-muted-foreground">
                            Actualizado: {tasaObj ? new Date(tasaObj.updatedAt).toLocaleDateString() : "-"}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        {moneda.tipo}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Tasa de cambio</p>
                        <p className="text-2xl font-bold">
                          1 {moneda.tipo} = <span className="text-emerald-600 dark:text-emerald-400">{formatMoney(tasa)}</span> {monedaBase?.tipo || "CUP"}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingTasas((prev) => ({
                              ...prev,
                              [moneda.id]: String(tasa),
                            }));
                            setTasasDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {onDeleteMoneda && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-rose-500 hover:text-rose-600"
                            onClick={() => onDeleteMoneda(moneda.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {monedas.filter((m) => m.tipo !== "CUP").length === 0 && (
              <Card className="col-span-full border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Coins className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground text-center">
                    No hay otras monedas configuradas.
                  </p>
                  <p className="text-sm text-muted-foreground text-center mt-1">
                    Añade monedas como USD, EUR o MLC para registrar movimientos en diferentes divisas.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setMonedaDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir moneda
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CajaBanco;

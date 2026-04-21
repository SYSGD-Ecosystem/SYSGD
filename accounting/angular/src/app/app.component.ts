import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import {
  AlertMessage,
  AnnualReport,
  DayAmountRow,
  MONTHS,
  MonthKey,
  RegistroTCP,
  SIMPLIFIED_THRESHOLD_CUP
} from './models/ledger-entry.model';
import { AuthSectionComponent } from './features/auth-section/auth-section.component';
import { GeneralesSectionComponent } from './features/generales-section/generales-section.component';
import { MovimientosSectionComponent } from './features/movimientos-section/movimientos-section.component';
import { ResourcesSectionComponent } from './features/resources-section/resources-section.component';
import { ResumenSectionComponent } from './features/resumen-section/resumen-section.component';
import { InventarioSectionComponent } from './features/inventario-section/inventario-section.component';
import { TributosSectionComponent } from './features/tributos-section/tributos-section.component';
import { AdvancedSectionComponent } from './features/advanced-section/advanced-section.component';
import { LedgerService } from './services/ledger.service';
import { AuthService, type AuthUser } from './services/auth.service';
import { RegistroSyncService } from './services/registro-sync.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    AuthSectionComponent,
    GeneralesSectionComponent,
    MovimientosSectionComponent,
    ResourcesSectionComponent,
    TributosSectionComponent,
    ResumenSectionComponent,
    InventarioSectionComponent,
    AdvancedSectionComponent
  ],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  private readonly today = new Date();
  private readonly currentMonth: MonthKey = MONTHS[this.today.getMonth()];
  private readonly currentDay = this.today.getDate();

  readonly provinces = [
    'Pinar del Río',
    'Artemisa',
    'La Habana',
    'Mayabeque',
    'Matanzas',
    'Cienfuegos',
    'Villa Clara',
    'Sancti Spíritus',
    'Ciego de Ávila',
    'Camagüey',
    'Las Tunas',
    'Granma',
    'Holguín',
    'Santiago de Cuba',
    'Guantánamo',
    'Isla de la Juventud'
  ];

  readonly municipiosByProvincia: Record<string, string[]> = {
    'Pinar del Río': ['Consolación del Sur', 'Guane', 'La Palma', 'Los Palacios', 'Mantua', 'Minas de Matahambre', 'Pinar del Río', 'San Juan y Martínez', 'San Luis', 'Sandino', 'Viñales'],
    'Artemisa': ['Alquízar', 'Artemisa', 'Bauta', 'Caimito', 'Guanajay', 'Güira de Melena', 'Mariel', 'Bahía Honda', 'San Antonio de los Baños', 'San Cristóbal'],
    'La Habana': ['Playa', 'Plaza de la Revolución', 'Centro Habana', 'Habana Vieja', 'Regla', 'Habana del Este', 'Guanabacoa', 'San Miguel del Padrón', 'Diez de Octubre', 'Cerro', 'Marianao', 'La Lisa', 'Boyeros', 'Arroyo Naranjo', 'Cotorro'],
    'Mayabeque': ['Batabanó', 'Bejucal', 'Güines', 'Jaruco', 'Madruga', 'Melena del Sur', 'Nueva Paz', 'Quivicán', 'San José de las Lajas', 'San Nicolás de Bari', 'Santa Cruz del Norte'],
    'Matanzas': ['Calimete', 'Cárdenas', 'Ciénaga de Zapata', 'Colón', 'Jagüey Grande', 'Jovellanos', 'Limonar', 'Los Arabos', 'Martí', 'Matanzas', 'Pedro Betancourt', 'Perico', 'Unión de Reyes'],
    'Cienfuegos': ['Abreus', 'Aguada de Pasajeros', 'Cienfuegos', 'Cruces', 'Cumanayagua', 'Lajas', 'Palmira', 'Rodas'],
    'Villa Clara': ['Caibarién', 'Camajuaní', 'Cifuentes', 'Corralillo', 'Encrucijada', 'Manicaragua', 'Placetas', 'Quemado de Güines', 'Ranchuelo', 'Remedios', 'Sagua la Grande', 'Santa Clara', 'Santo Domingo'],
    'Sancti Spíritus': ['Cabaiguán', 'Fomento', 'Jatibonico', 'La Sierpe', 'Sancti Spíritus', 'Taguasco', 'Trinidad', 'Yaguajay'],
    'Ciego de Ávila': ['Baraguá', 'Bolivia', 'Chambas', 'Ciego de Ávila', 'Ciro Redondo', 'Florencia', 'Majagua', 'Morón', 'Primero de Enero', 'Venezuela'],
    'Camagüey': ['Camagüey', 'Carlos Manuel de Céspedes', 'Esmeralda', 'Florida', 'Guáimaro', 'Jimaguayú', 'Minas', 'Najasa', 'Nuevitas', 'Santa Cruz del Sur', 'Sibanicú', 'Sierra de Cubitas', 'Vertientes'],
    'Las Tunas': ['Amancio', 'Colombia', 'Jesús Menéndez', 'Jobabo', 'Las Tunas', 'Majibacoa', 'Manatí', 'Puerto Padre'],
    'Granma': ['Bartolomé Masó', 'Bayamo', 'Buey Arriba', 'Campechuela', 'Cauto Cristo', 'Guisa', 'Jiguaní', 'Manzanillo', 'Media Luna', 'Niquero', 'Pilón', 'Río Cauto', 'Yara'],
    'Holguín': ['Antilla', 'Báguanos', 'Banes', 'Cacocum', 'Calixto García', 'Cueto', 'Frank País', 'Gibara', 'Holguín', 'Mayarí', 'Moa', 'Rafael Freyre', 'Sagua de Tánamo', 'Urbano Noris'],
    'Santiago de Cuba': ['Contramaestre', 'Guamá', 'Mella', 'Palma Soriano', 'San Luis', 'Santiago de Cuba', 'Segundo Frente', 'Songo-La Maya', 'Tercer Frente'],
    'Guantánamo': ['Baracoa', 'Caimanera', 'El Salvador', 'Guantánamo', 'Imías', 'Maisí', 'Manuel Tames', 'Niceto Pérez', 'San Antonio del Sur', 'Yateras'],
    'Isla de la Juventud': ['Isla de la Juventud']
  };

  activeTab: 'ledger' | 'inventario' | 'recursos' | 'advanced' = 'ledger';
  ledgerTab: 'generales' | 'movimientos' | 'tributos' | 'resumen' = 'generales';
  months = MONTHS;
  threshold = SIMPLIFIED_THRESHOLD_CUP;
  isOnline = navigator.onLine;
  sessionReady = false;
  authMode: 'login' | 'register' = 'login';
  authLoading = false;
  authError = '';
  offlineRecoveryAvailable = false;
  currentUser: AuthUser | null = null;
  pdfLoading = false;
  showPromoBanner = true;
  backupMessage = '';
  selectedMonth: MonthKey = this.currentMonth;
  registro: RegistroTCP = this.ledger.getRegistro();
  report: AnnualReport = this.ledger.getAnnualReport();
  alerts: AlertMessage[] = this.ledger.buildAlerts();
  djPreview = this.ledger.declarationPreview();
  workspaces: { id: string; name: string }[] = this.ledger.getAvailableWorkspaces();
  activeWorkspaceId: string | null = this.ledger.getActiveWorkspaceId();

  get activeWorkspaceName(): string {
    if (!this.activeWorkspaceId) return 'Sin espacio de trabajo';
    const ws = this.workspaces.find((w) => w.id === this.activeWorkspaceId);
    return ws?.name ?? 'Espacio de trabajo';
  }

  get selectedMonthIngresosTotal(): number {
    return this.monthTotal(this.registro.ingresos[this.selectedMonth]);
  }

  get selectedMonthGastosTotal(): number {
    return this.monthTotal(this.registro.gastos[this.selectedMonth]);
  }

  get fiscalMunicipios(): string[] {
    const provincia = this.generalesForm.controls.fiscalProvincia.value;
    return this.municipiosByProvincia[provincia] ?? [];
  }

  get legalMunicipios(): string[] {
    const provincia = this.generalesForm.controls.legalProvincia.value;
    return this.municipiosByProvincia[provincia] ?? [];
  }

  generalesForm = this.fb.nonNullable.group({
    nombre: ['', Validators.required],
    anio: [new Date().getFullYear(), [Validators.required, Validators.min(2020)]],
    nit: ['', Validators.required],
    actividad: ['', Validators.required],
    codigo: ['', Validators.required],
    fiscalCalle: ['', Validators.required],
    fiscalMunicipio: ['', Validators.required],
    fiscalProvincia: ['', Validators.required],
    legalCalle: ['', Validators.required],
    legalMunicipio: ['', Validators.required],
    legalProvincia: ['', Validators.required]
  });

  movForm = this.fb.nonNullable.group({
    tipo: ['ingreso' as 'ingreso' | 'gasto', Validators.required],
    mes: [this.currentMonth, Validators.required],
    dia: [this.currentDay, [Validators.required, Validators.min(1), Validators.max(31)]],
    importe: [null as number | null, [Validators.required, Validators.min(0.01)]],
    montoDivisa: [null as number | null],
    tasaDivisa: [null as number | null]
  });

  tributoForm = this.fb.nonNullable.group({
    mes: [this.currentMonth, Validators.required],
    ventas: [null as number | null],
    fuerza: [null as number | null],
    sellos: [null as number | null],
    anuncios: [null as number | null],
    css20: [null as number | null],
    css14: [null as number | null],
    otros: [null as number | null],
    restauracion: [null as number | null],
    arrendamiento: [null as number | null],
    exonerado: [null as number | null],
    otrosMFP: [null as number | null],
    cuotaMensual: [null as number | null]
  });

  authForm = this.fb.nonNullable.group({
    name: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly ledger: LedgerService,
    private readonly auth: AuthService,
    private readonly registroSync: RegistroSyncService
  ) {}

  ngOnInit(): void {
    this.patchForms();
    window.addEventListener('online', this.handleConnection);
    window.addEventListener('offline', this.handleConnection);
    void this.initializeSession();
    this.movForm.controls.mes.valueChanges.subscribe((value) => {
      this.selectedMonth = value;
    });
    this.tributoForm.controls.mes.valueChanges.subscribe((value) => {
      this.patchTributoForm(value);
    });
    this.generalesForm.controls.fiscalProvincia.valueChanges.subscribe(() => {
      this.generalesForm.controls.fiscalMunicipio.setValue('');
    });
    this.generalesForm.controls.legalProvincia.valueChanges.subscribe(() => {
      this.generalesForm.controls.legalMunicipio.setValue('');
    });
  }

  toggleAuthMode(): void {
    this.authMode = this.authMode === 'login' ? 'register' : 'login';
    this.authError = '';
    this.offlineRecoveryAvailable = false;
  }

  async submitAuth(): Promise<void> {
    if (this.authForm.invalid) return;
    this.authLoading = true;
    this.authError = '';

    try {
      const { name, email, password } = this.authForm.getRawValue();
      if (this.authMode === 'register') {
        if (!name.trim()) {
          this.authError = 'El nombre es obligatorio para crear la cuenta';
          return;
        }
        await this.auth.register(name.trim(), email.trim(), password);
      }

      this.currentUser = await this.auth.login(email.trim(), password);
      this.offlineRecoveryAvailable = false;
      await this.syncRemoteWithLocal();
    } catch (error) {
      this.authError = this.formatError(error, 'No se pudo iniciar sesión');
    } finally {
      this.authLoading = false;
    }
  }

  logout(): void {
    this.auth.logout();
    this.currentUser = null;
    this.authError = '';
    this.offlineRecoveryAvailable = false;
    this.workspaces = [];
    this.activeWorkspaceId = null;
    localStorage.removeItem('sysgd-cont:registro-tcp');
    localStorage.removeItem('sysgd-cont:workspace-id');
    localStorage.removeItem('sysgd-cont:workspaces-list');
  }

  async changeWorkspace(workspaceId: string): Promise<void> {
    this.activeWorkspaceId = workspaceId;
    this.ledger.setActiveWorkspaceId(workspaceId);
    await this.syncRemoteWithLocal();
  }

  continueOffline(): void {
    this.currentUser = {
      id: 'offline-local',
      name: this.registro.generales.nombre.trim() || 'Modo offline',
      email: 'offline@local',
      privileges: 'user'
    };
    this.authError = '';
    this.offlineRecoveryAvailable = false;
  }

  saveGenerales(): void {
    if (this.generalesForm.invalid) return;
    this.registro = this.ledger.updateGenerales(this.generalesForm.getRawValue());
    this.refreshReport();
    void this.syncToServer();
    this.ledgerTab = 'movimientos';
  }

  saveMovement(): void {
    if (this.movForm.invalid) return;
    const data = this.movForm.getRawValue();
    const montoDivisa = data.montoDivisa ?? 0;
    const tasaDivisa = data.tasaDivisa ?? 0;
    const importeInput = data.importe ?? 0;
    const hasDivisa = montoDivisa > 0 && tasaDivisa > 0;
    const importe = hasDivisa
      ? this.ledger.convertDivisaToCup(montoDivisa, tasaDivisa)
      : importeInput;

    if (data.tipo === 'ingreso') {
      this.registro = this.ledger.addIngreso(data.mes, data.dia, importe);
    } else {
      this.registro = this.ledger.addGasto(data.mes, data.dia, importe);
    }

    this.movForm.patchValue({ importe: null, montoDivisa: null, tasaDivisa: null });
    this.selectedMonth = data.mes;
    if (this.tributoForm.controls.mes.value === data.mes) {
      this.patchTributoForm(data.mes);
    }
    this.refreshReport();
    void this.syncToServer();
  }

  onInventarioChange(registro: RegistroTCP): void {
    this.registro = registro;
    this.ledger.saveRegistro(registro);
    void this.syncToServer();
  }

  saveTributos(): void {
    const raw = this.tributoForm.getRawValue();
    this.registro = this.ledger.updateTributos(raw.mes, {
      ventas: this.moneyInputToString(raw.ventas),
      fuerza: this.moneyInputToString(raw.fuerza),
      sellos: this.moneyInputToString(raw.sellos),
      anuncios: this.moneyInputToString(raw.anuncios),
      css20: this.moneyInputToString(raw.css20),
      css14: this.moneyInputToString(raw.css14),
      otros: this.moneyInputToString(raw.otros),
      restauracion: this.moneyInputToString(raw.restauracion),
      arrendamiento: this.moneyInputToString(raw.arrendamiento),
      exonerado: this.moneyInputToString(raw.exonerado),
      otrosMFP: this.moneyInputToString(raw.otrosMFP),
      cuotaMensual: this.moneyInputToString(raw.cuotaMensual)
    });
    this.patchTributoForm(raw.mes);
    this.refreshReport();
    void this.syncToServer();
    this.ledgerTab = 'resumen';
  }

  autoCalculateTributos(): void {
    const month = this.tributoForm.controls.mes.value;
    const suggestion = this.calculateTributosSuggestion(month);
    this.tributoForm.patchValue({
      ventas: suggestion.ventas,
      cuotaMensual: suggestion.cuotaMensual
    });
  }

  exportRegistroJson(): void {
    try {
      const content = this.ledger.exportBackup(this.registro);
      const filename = `sysgd-cont-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const blob = new Blob([content], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      this.backupMessage = 'Backup exportado correctamente.';
    } catch {
      this.backupMessage = 'No se pudo exportar el backup JSON.';
    }
  }

  async importRegistroJson(file: File): Promise<void> {
    try {
      const content = await file.text();
      this.registro = this.ledger.importBackup(content);
      this.patchForms();
      this.refreshReport();
      await this.syncToServer();
      this.backupMessage = 'Backup importado y restaurado correctamente.';
    } catch (error) {
      this.backupMessage = this.formatError(error, 'No se pudo importar el archivo JSON.');
    }
  }

  restoreFromJsonText(jsonString: string): void {
    try {
      this.registro = this.ledger.importBackup(jsonString);
      this.patchForms();
      this.refreshReport();
      void this.syncToServer();
      this.backupMessage = 'Datos restaurados desde JSON correctamente.';
    } catch (error) {
      this.backupMessage = this.formatError(error, 'No se pudieron restaurar los datos desde JSON.');
    }
  }

  async downloadPdf(): Promise<void> {
    const token = this.auth.token;
    if (!token) {
      this.authError = 'Debes iniciar sesión para generar el PDF';
      return;
    }

    this.pdfLoading = true;
    this.authError = '';
    try {
      const response = await this.registroSync.generateTcpPdf(token, this.registro);
      const disposition = response.headers.get('content-disposition') ?? '';
      const match = disposition.match(/filename=\"?([^"]+)\"?/);
      const filename = match?.[1] ?? `Registro_TCP_${this.report.year}.pdf`;

      const blob = response.body;
      if (!blob) {
        throw new Error('La respuesta del servidor no contiene archivo PDF');
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      this.authError = this.formatError(error, 'No se pudo generar el PDF');
    } finally {
      this.pdfLoading = false;
    }
  }

  private refreshReport(): void {
    this.report = this.ledger.getAnnualReport();
    this.alerts = this.ledger.buildAlerts();
    this.djPreview = this.ledger.declarationPreview();
  }

  private patchForms(): void {
    this.generalesForm.patchValue(this.registro.generales);
    this.patchTributoForm(this.tributoForm.controls.mes.value);
  }

  private async initializeSession(): Promise<void> {
    if (!this.auth.isAuthenticated) {
      this.sessionReady = true;
      return;
    }

    try {
      this.currentUser = await this.auth.me();
      await this.syncRemoteWithLocal();
    } catch {
      if (this.hasLocalData(this.registro)) {
        this.currentUser = null;
        this.authError = 'No se pudo conectar con el servidor. Puedes continuar con los datos locales.';
        this.offlineRecoveryAvailable = true;
      } else {
        this.auth.logout();
        this.currentUser = null;
      }
    } finally {
      this.sessionReady = true;
    }
  }

  private async syncRemoteWithLocal(): Promise<void> {
    const token = this.auth.token;
    if (!token || !navigator.onLine) {
      return;
    }

    const remote = await this.registroSync.pull(token);
    if (remote) {
      this.registro = this.ledger.normalizeWorkspacesResponse(remote);
      this.workspaces = this.ledger.getAvailableWorkspaces();
      this.activeWorkspaceId = this.ledger.getActiveWorkspaceId();
      this.ledger.saveRegistro(this.registro);
      this.patchForms();
      this.refreshReport();
      return;
    }

    if (this.hasLocalData(this.registro)) {
      await this.registroSync.push(token, this.registro);
    }
  }

  private async syncToServer(): Promise<void> {
    const token = this.auth.token;
    if (!token || !navigator.onLine) return;

    try {
      await this.registroSync.push(token, this.registro);
    } catch (error) {
      console.error('No se pudo sincronizar con el servidor:', error);
    }
  }

  private hasLocalData(registro: RegistroTCP): boolean {
    const hasGenerales =
      registro.generales.nombre.trim() !== '' ||
      registro.generales.nit.trim() !== '' ||
      registro.generales.actividad.trim() !== '' ||
      registro.generales.codigo.trim() !== '';
    const hasRows = MONTHS.some((month) => registro.ingresos[month].length > 0 || registro.gastos[month].length > 0);
    const hasTributos = registro.tributos.some((row) =>
      Object.entries(row).some(([key, value]) => key !== 'mes' && String(value).trim() !== '')
    );
    const hasInventario =
      registro.inventario.productosVenta.length > 0 ||
      registro.inventario.productosCompra.length > 0 ||
      registro.inventario.operaciones.length > 0;
    return hasGenerales || hasRows || hasTributos || hasInventario;
  }

  private formatError(error: unknown, fallback: string): string {
    const candidate = error as { error?: { message?: string; error?: string }; message?: string };
    return candidate.error?.message ?? candidate.error?.error ?? candidate.message ?? fallback;
  }

  private readonly handleConnection = () => {
    this.isOnline = navigator.onLine;
    if (this.isOnline) {
      if (this.currentUser?.id === 'offline-local') {
        void this.initializeSession();
      }
      void this.syncToServer();
    }
  };

  trackByDayAmount(index: number, item: DayAmountRow): string {
    return `${index}-${item.dia}-${item.importe}`;
  }

  private monthTotal(rows: DayAmountRow[]): number {
    return rows.reduce((acc, row) => acc + this.toNumber(row.importe), 0);
  }

  private patchTributoForm(month: MonthKey): void {
    const monthIndex = MONTHS.findIndex((item) => item === month);
    const row = this.registro.tributos[monthIndex];
    if (!row) return;

    this.tributoForm.patchValue(
      {
        ventas: this.parseTributoValue(row.ventas),
        fuerza: this.parseTributoValue(row.fuerza),
        sellos: this.parseTributoValue(row.sellos),
        anuncios: this.parseTributoValue(row.anuncios),
        css20: this.parseTributoValue(row.css20),
        css14: this.parseTributoValue(row.css14),
        otros: this.parseTributoValue(row.otros),
        restauracion: this.parseTributoValue(row.restauracion),
        arrendamiento: this.parseTributoValue(row.arrendamiento),
        exonerado: this.parseTributoValue(row.exonerado),
        otrosMFP: this.parseTributoValue(row.otrosMFP),
        cuotaMensual: this.parseTributoValue(row.cuotaMensual)
      },
      { emitEvent: false }
    );
    this.applyTributoSuggestionIfEmpty(month);
  }

  private parseTributoValue(value: string): number | null {
    if (!value.trim()) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private moneyInputToString(value: number | null): string {
    const parsed = Number(value ?? 0);
    if (!Number.isFinite(parsed) || parsed <= 0) return '';
    return parsed.toFixed(2);
  }

  private applyTributoSuggestionIfEmpty(month: MonthKey): void {
    const suggestion = this.calculateTributosSuggestion(month);
    const raw = this.tributoForm.getRawValue();
    this.tributoForm.patchValue({
      ventas: raw.ventas == null || raw.ventas === 0 ? suggestion.ventas : raw.ventas,
      cuotaMensual: raw.cuotaMensual == null || raw.cuotaMensual === 0 ? suggestion.cuotaMensual : raw.cuotaMensual
    });
  }

  private calculateTributosSuggestion(month: MonthKey): { ventas: number; cuotaMensual: number } {
    const ingresos = this.monthTotal(this.registro.ingresos[month]);
    return {
      ventas: this.roundMoney(ingresos * 0.1),
      cuotaMensual: this.roundMoney(ingresos * 0.05)
    };
  }

  private roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private toNumber(value: string): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}

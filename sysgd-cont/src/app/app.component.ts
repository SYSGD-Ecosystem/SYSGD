import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AlertMessage,
  AnnualReport,
  DayAmountRow,
  MONTHS,
  MonthKey,
  RegistroTCP,
  SIMPLIFIED_THRESHOLD_CUP
} from './models/ledger-entry.model';
import { LedgerService } from './services/ledger.service';
import { AuthService, type AuthUser } from './services/auth.service';
import { RegistroSyncService } from './services/registro-sync.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe],
  template: `
    <main class="container">
      <header class="header" *ngIf="sessionReady && currentUser">
        <div>
          <h1>Registro TCP: Ingresos y Gastos</h1>
          <p class="subtitle">Sistema para control fiscal y pre-cálculo de Declaración Jurada en Cuba</p>
        </div>
        <div class="session-box">
          <span class="badge" [class.offline]="!isOnline">{{ isOnline ? 'Conectado' : 'Offline' }}</span>
          <span class="user-pill">{{ currentUser.name }}</span>
          <button type="button" class="logout-btn" (click)="logout()">Salir</button>
        </div>
      </header>

      <section class="card auth-card" *ngIf="!sessionReady">
        <h2>Conectando...</h2>
        <p class="subtitle">Comprobando sesión y sincronización de datos.</p>
      </section>

      <section class="card auth-card" *ngIf="sessionReady && !currentUser">
        <h2>{{ authMode === 'login' ? 'Iniciar sesión' : 'Crear cuenta' }}</h2>
        <p class="subtitle">Tus datos se guardan localmente y se sincronizan con el servidor.</p>

        <form [formGroup]="authForm" (ngSubmit)="submitAuth()" class="form-grid">
          <label *ngIf="authMode === 'register'">Nombre completo <input type="text" formControlName="name" /></label>
          <label>Email <input type="email" formControlName="email" /></label>
          <label>Contraseña <input type="password" formControlName="password" /></label>
          <div class="actions full">
            <button type="submit" [disabled]="authLoading || authForm.invalid">
              {{ authLoading ? 'Procesando...' : authMode === 'login' ? 'Entrar' : 'Crear cuenta' }}
            </button>
            <button type="button" class="secondary-btn" [disabled]="authLoading" (click)="toggleAuthMode()">
              {{ authMode === 'login' ? 'No tengo cuenta' : 'Ya tengo cuenta' }}
            </button>
          </div>
          <p class="full auth-error" *ngIf="authError">{{ authError }}</p>
          <div class="actions full" *ngIf="offlineRecoveryAvailable">
            <button type="button" class="secondary-btn" (click)="continueOffline()">Continuar en modo offline</button>
          </div>
        </form>
      </section>

      <ng-container *ngIf="sessionReady && currentUser">
      <nav class="tabs">
        <button [class.active]="activeTab === 'generales'" (click)="activeTab = 'generales'">1. Generales</button>
        <button [class.active]="activeTab === 'movimientos'" (click)="activeTab = 'movimientos'">2-3. Ingresos/Gastos</button>
        <button [class.active]="activeTab === 'tributos'" (click)="activeTab = 'tributos'">4. Tributos</button>
        <button [class.active]="activeTab === 'resumen'" (click)="activeTab = 'resumen'">Resumen DJ</button>
      </nav>

      <section class="card" *ngIf="activeTab === 'generales'">
        <h2>Datos Generales del Contribuyente</h2>
        <form [formGroup]="generalesForm" (ngSubmit)="saveGenerales()" class="form-grid">
          <label>Nombre completo <input type="text" formControlName="nombre" /></label>
          <label>Año fiscal <input type="number" formControlName="anio" /></label>
          <label>NIT <input type="text" formControlName="nit" /></label>
          <label>Código de actividad <input type="text" formControlName="codigo" /></label>
          <label class="full">Actividad económica <input type="text" formControlName="actividad" /></label>
          <label class="full subtitle2">Domicilio fiscal</label>
          <label class="full">Calle / número <input type="text" formControlName="fiscalCalle" /></label>
          <label>Provincia
            <select formControlName="fiscalProvincia">
              <option value="">Seleccione provincia</option>
              <option *ngFor="let prov of provinces" [value]="prov">{{ prov }}</option>
            </select>
          </label>
          <label>Municipio
            <select formControlName="fiscalMunicipio">
              <option value="">Seleccione municipio</option>
              <option *ngFor="let mun of fiscalMunicipios" [value]="mun">{{ mun }}</option>
            </select>
          </label>
          <label class="full subtitle2">Domicilio legal</label>
          <label class="full">Calle / número <input type="text" formControlName="legalCalle" /></label>
          <label>Provincia
            <select formControlName="legalProvincia">
              <option value="">Seleccione provincia</option>
              <option *ngFor="let prov of provinces" [value]="prov">{{ prov }}</option>
            </select>
          </label>
          <label>Municipio
            <select formControlName="legalMunicipio">
              <option value="">Seleccione municipio</option>
              <option *ngFor="let mun of legalMunicipios" [value]="mun">{{ mun }}</option>
            </select>
          </label>
          <div class="actions full"><button type="submit" [disabled]="generalesForm.invalid">Guardar generales</button></div>
        </form>
      </section>

      <section class="card" *ngIf="activeTab === 'movimientos'">
        <h2>Registro mensual de ingresos y gastos</h2>
        <form [formGroup]="movForm" (ngSubmit)="saveMovement()" class="form-grid">
          <label>Tipo
            <select formControlName="tipo">
              <option value="ingreso">Ingreso</option>
              <option value="gasto">Gasto</option>
            </select>
          </label>
          <label>Mes
            <select formControlName="mes">
              <option *ngFor="let m of months" [value]="m">{{ m }}</option>
            </select>
          </label>
          <label>Día <input type="number" min="1" max="31" formControlName="dia" /></label>
          <label>Importe CUP <input type="number" min="0.01" step="0.01" formControlName="importe" /></label>
          <label>Divisa (opcional) <input type="number" min="0" step="0.01" formControlName="montoDivisa" /></label>
          <label>Tasa BCC (opcional) <input type="number" min="0" step="0.01" formControlName="tasaDivisa" /></label>
          <div class="actions full">
            <button type="submit" [disabled]="movForm.invalid">Registrar</button>
          </div>
        </form>

        <div class="table-section">
          <h3>Movimientos del mes {{ selectedMonth }}</h3>
          <div class="split-tables">
            <article class="movement-card">
              <h4>Ingresos</h4>
              <div class="table-wrapper">
                <table class="mov-table">
                  <thead>
                    <tr>
                      <th>Día</th>
                      <th>Ingreso</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let row of registro.ingresos[selectedMonth]; trackBy: trackByDayAmount">
                      <td>{{ row.dia }}</td>
                      <td>{{ row.importe | currency:'CUP':'symbol':'1.2-2' }}</td>
                    </tr>
                    <tr *ngIf="registro.ingresos[selectedMonth].length === 0">
                      <td colspan="2" class="empty-cell">Sin ingresos en este mes.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </article>

            <article class="movement-card">
              <h4>Gastos</h4>
              <div class="table-wrapper">
                <table class="mov-table">
                  <thead>
                    <tr>
                      <th>Día</th>
                      <th>Gasto</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let row of registro.gastos[selectedMonth]; trackBy: trackByDayAmount">
                      <td>{{ row.dia }}</td>
                      <td>{{ row.importe | currency:'CUP':'symbol':'1.2-2' }}</td>
                    </tr>
                    <tr *ngIf="registro.gastos[selectedMonth].length === 0">
                      <td colspan="2" class="empty-cell">Sin gastos en este mes.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </article>
          </div>
          <div class="movement-totals">
            <span>Total ingresos: <strong>{{ selectedMonthIngresosTotal | currency:'CUP':'symbol':'1.2-2' }}</strong></span>
            <span>Total gastos: <strong>{{ selectedMonthGastosTotal | currency:'CUP':'symbol':'1.2-2' }}</strong></span>
          </div>
        </div>
      </section>

      <section class="card" *ngIf="activeTab === 'tributos'">
        <h2>Tributos y otros gastos deducibles</h2>
        <form [formGroup]="tributoForm" (ngSubmit)="saveTributos()" class="form-grid">
          <label>Mes
            <select formControlName="mes">
              <option *ngFor="let m of months" [value]="m">{{ m }}</option>
            </select>
          </label>
          <label>Imp. Ventas/Servicios (011402) <input type="number" min="0" step="0.01" formControlName="ventas" /></label>
          <label>Fuerza de trabajo (061032) <input type="number" min="0" step="0.01" formControlName="fuerza" /></label>
          <label>Documentos/sellos (073012) <input type="number" min="0" step="0.01" formControlName="sellos" /></label>
          <label>Anuncios (090012) <input type="number" min="0" step="0.01" formControlName="anuncios" /></label>
          <label>CSS 20% (082013) <input type="number" min="0" step="0.01" formControlName="css20" /></label>
          <label>CSS 14% (081013) <input type="number" min="0" step="0.01" formControlName="css14" /></label>
          <label>Otros tributos <input type="number" min="0" step="0.01" formControlName="otros" /></label>
          <label>Restauración <input type="number" min="0" step="0.01" formControlName="restauracion" /></label>
          <label>Arrendamiento <input type="number" min="0" step="0.01" formControlName="arrendamiento" /></label>
          <label>Exonerado <input type="number" min="0" step="0.01" formControlName="exonerado" /></label>
          <label>Otros MFP <input type="number" min="0" step="0.01" formControlName="otrosMFP" /></label>
          <label>Cuota mensual 5% (051012) <input type="number" min="0" step="0.01" formControlName="cuotaMensual" /></label>
          <div class="actions full"><button type="submit">Guardar tributos</button></div>
        </form>
      </section>

      <section class="card summary" *ngIf="activeTab === 'resumen'">
        <h2>Resumen fiscal {{ report.year }}</h2>
        <div class="grid">
          <div><strong>Ingresos:</strong> {{ report.totalIngresos | currency:'CUP':'symbol':'1.2-2' }}</div>
          <div><strong>Gastos:</strong> {{ report.totalGastos | currency:'CUP':'symbol':'1.2-2' }}</div>
          <div><strong>Tributos:</strong> {{ report.totalTributos | currency:'CUP':'symbol':'1.2-2' }}</div>
          <div><strong>Otros deducibles:</strong> {{ report.totalOtrosDeducibles | currency:'CUP':'symbol':'1.2-2' }}</div>
          <div><strong>Base imponible:</strong> {{ report.baseImponible | currency:'CUP':'symbol':'1.2-2' }}</div>
          <div><strong>Impuesto estimado:</strong> {{ report.impuestoEstimado | currency:'CUP':'symbol':'1.2-2' }}</div>
          <div><strong>Umbral 500,000:</strong>
            <span [class.warn]="report.totalIngresos > threshold" [class.ok]="report.totalIngresos <= threshold">
              {{ report.totalIngresos <= threshold ? 'Dentro de régimen simplificado' : 'Supera umbral simplificado' }}
            </span>
          </div>
        </div>

        <h3>Alertas inteligentes</h3>
        <ul class="alerts">
          <li *ngFor="let a of alerts" [class.warn]="a.level === 'warning'" [class.ok]="a.level === 'ok'">{{ a.message }}</li>
        </ul>

        <h3>Pre-llenado Declaración Jurada</h3>
        <pre class="dj">{{ djPreview }}</pre>
      </section>
      </ng-container>
    </main>
  `,
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
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

  activeTab: 'generales' | 'movimientos' | 'tributos' | 'resumen' = 'generales';
  months = MONTHS;
  threshold = SIMPLIFIED_THRESHOLD_CUP;
  isOnline = navigator.onLine;
  sessionReady = false;
  authMode: 'login' | 'register' = 'login';
  authLoading = false;
  authError = '';
  offlineRecoveryAvailable = false;
  currentUser: AuthUser | null = null;
  selectedMonth: MonthKey = 'ENE';
  registro: RegistroTCP = this.ledger.getRegistro();
  report: AnnualReport = this.ledger.getAnnualReport();
  alerts: AlertMessage[] = this.ledger.buildAlerts();
  djPreview = this.ledger.declarationPreview();

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
    mes: ['ENE' as MonthKey, Validators.required],
    dia: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
    importe: [0, [Validators.required, Validators.min(0.01)]],
    montoDivisa: [0],
    tasaDivisa: [0]
  });

  tributoForm = this.fb.nonNullable.group({
    mes: ['ENE' as MonthKey, Validators.required],
    ventas: [0],
    fuerza: [0],
    sellos: [0],
    anuncios: [0],
    css20: [0],
    css14: [0],
    otros: [0],
    restauracion: [0],
    arrendamiento: [0],
    exonerado: [0],
    otrosMFP: [0],
    cuotaMensual: [0]
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
    this.activeTab = 'movimientos';
  }

  saveMovement(): void {
    if (this.movForm.invalid) return;
    const data = this.movForm.getRawValue();
    const hasDivisa = data.montoDivisa > 0 && data.tasaDivisa > 0;
    const importe = hasDivisa
      ? this.ledger.convertDivisaToCup(data.montoDivisa, data.tasaDivisa)
      : data.importe;

    if (data.tipo === 'ingreso') {
      this.registro = this.ledger.addIngreso(data.mes, data.dia, importe);
    } else {
      this.registro = this.ledger.addGasto(data.mes, data.dia, importe);
    }

    this.movForm.patchValue({ importe: 0, montoDivisa: 0, tasaDivisa: 0 });
    this.selectedMonth = data.mes;
    this.refreshReport();
    void this.syncToServer();
  }

  saveTributos(): void {
    const raw = this.tributoForm.getRawValue();
    this.registro = this.ledger.updateTributos(raw.mes, {
      ventas: raw.ventas.toFixed(2),
      fuerza: raw.fuerza.toFixed(2),
      sellos: raw.sellos.toFixed(2),
      anuncios: raw.anuncios.toFixed(2),
      css20: raw.css20.toFixed(2),
      css14: raw.css14.toFixed(2),
      otros: raw.otros.toFixed(2),
      restauracion: raw.restauracion.toFixed(2),
      arrendamiento: raw.arrendamiento.toFixed(2),
      exonerado: raw.exonerado.toFixed(2),
      otrosMFP: raw.otrosMFP.toFixed(2),
      cuotaMensual: raw.cuotaMensual.toFixed(2)
    });
    this.refreshReport();
    void this.syncToServer();
    this.activeTab = 'resumen';
  }

  private refreshReport(): void {
    this.report = this.ledger.getAnnualReport();
    this.alerts = this.ledger.buildAlerts();
    this.djPreview = this.ledger.declarationPreview();
  }

  private patchForms(): void {
    this.generalesForm.patchValue(this.registro.generales);
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
    if (remote.registro) {
      this.registro = remote.registro;
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
    return hasGenerales || hasRows || hasTributos;
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

  private toNumber(value: string): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}

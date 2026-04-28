import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, AuthUser } from '../services/auth.service';
import { LedgerService } from '../services/ledger.service';
import { RegistroSyncService } from '../services/registro-sync.service';

@Component({
  selector: 'app-account-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './account-page.component.html',
  styleUrl: './account-page.component.css'
})
export class AccountPageComponent implements OnInit {
  user: AuthUser | null = null;
  tier = 'Gratuito';
  creditos = 0;
  isDownloading = false;

  constructor(
    private readonly auth: AuthService,
    private readonly ledger: LedgerService,
    private readonly syncService: RegistroSyncService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.auth.currentUserValue;
    this.loadUserTier();
  }

  async downloadAllData(): Promise<void> {
    const token = this.auth.token;
    if (!token) {
      alert('Debes iniciar sesión para descargar datos.');
      return;
    }

    this.isDownloading = true;
    try {
      const response = await this.syncService.pull(token);
      if (response) {
        const dataStr = JSON.stringify(response, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `sysgd-cont-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        alert('Datos descargados exitosamente.');
      } else {
        alert('No se encontraron datos en el servidor.');
      }
    } catch (error) {
      console.error('Error al descargar:', error);
      alert('Error al descargar los datos del servidor.');
    } finally {
      this.isDownloading = false;
    }
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  private loadUserTier(): void {
    // TODO: Get tier and credits from API
    // For now, show default values
    if (this.user?.privileges === 'admin') {
      this.tier = 'Administrador';
      this.creditos = 999999;
    } else {
      this.tier = 'Gratuito';
      this.creditos = 0;
    }
  }
}

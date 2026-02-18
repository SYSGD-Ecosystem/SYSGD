import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import type { RegistroTCP } from '../models/ledger-entry.model';

interface ContLedgerResponse {
  registro: RegistroTCP | null;
  updatedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class RegistroSyncService {
  constructor(
    private readonly http: HttpClient,
    private readonly auth: AuthService
  ) {}

  async pull(token: string): Promise<ContLedgerResponse> {
    return firstValueFrom(
      this.http.get<ContLedgerResponse>(`${this.auth.apiBaseUrl}/api/cont-ledger`, {
        headers: this.auth.authHeaders(token)
      })
    );
  }

  async push(token: string, registro: RegistroTCP): Promise<void> {
    await firstValueFrom(
      this.http.put(
        `${this.auth.apiBaseUrl}/api/cont-ledger`,
        { registro },
        { headers: this.auth.authHeaders(token) }
      )
    );
  }
}

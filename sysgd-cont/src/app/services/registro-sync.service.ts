import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import type { RegistroTCP } from '../models/ledger-entry.model';

interface ContLedgerResponse {
  registro: RegistroTCP | null;
  updatedAt: string | null;
}

type TcpPdfMonthRow = {
  dia: string;
  importe: string;
};

type TcpPdfTributoRow = {
  mes: string;
  b: string;
  c: string;
  d: string;
  e: string;
  f: string;
  h: string;
  i: string;
  j: string;
  l: string;
  m: string;
  n: string;
  o: string;
  p: string;
};

type TcpPdfPayload = {
  generalData: {
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
  ingresos: Record<string, TcpPdfMonthRow[]>;
  gastos: Record<string, TcpPdfMonthRow[]>;
  tributos: TcpPdfTributoRow[];
};

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

  async generateTcpPdf(token: string, registro: RegistroTCP): Promise<HttpResponse<Blob>> {
    const payload: TcpPdfPayload = {
      generalData: {
        anio: String(registro.generales.anio ?? ''),
        nombre: registro.generales.nombre ?? '',
        nit: registro.generales.nit ?? '',
        fiscalCalle: registro.generales.fiscalCalle ?? '',
        fiscalMunicipio: registro.generales.fiscalMunicipio ?? '',
        fiscalProvincia: registro.generales.fiscalProvincia ?? '',
        legalCalle: registro.generales.legalCalle ?? '',
        legalMunicipio: registro.generales.legalMunicipio ?? '',
        legalProvincia: registro.generales.legalProvincia ?? '',
        actividad: registro.generales.actividad ?? '',
        codigo: registro.generales.codigo ?? '',
        firmaDia: '',
        firmaMes: '',
        firmaAnio: ''
      },
      ingresos: registro.ingresos,
      gastos: registro.gastos,
      tributos: registro.tributos.map((row) => ({
        mes: row.mes,
        b: row.ventas,
        c: row.fuerza,
        d: row.sellos,
        e: row.anuncios,
        f: row.css20,
        h: row.css14,
        i: row.otros,
        j: row.restauracion,
        l: row.arrendamiento,
        m: row.exonerado,
        n: row.otrosMFP,
        o: row.cuotaMensual,
        p: ''
      }))
    };

    return firstValueFrom(
      this.http.post(`${this.auth.apiBaseUrl}/api/accounting-documents/pdf/tcp`, payload, {
        headers: this.auth.authHeaders(token),
        observe: 'response',
        responseType: 'blob'
      })
    );
  }
}

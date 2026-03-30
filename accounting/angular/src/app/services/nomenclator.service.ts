import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import type {
  AccountingCategory,
  AccountingItem,
  AccountingSubcategory,
  CnaeItem
} from '../models/nomenclator.model';

@Injectable({ providedIn: 'root' })
export class NomenclatorService {
  constructor(
    private readonly http: HttpClient,
    private readonly auth: AuthService
  ) {}

  async getAccountingCategories(): Promise<AccountingCategory[]> {
    return firstValueFrom(
      this.http.get<AccountingCategory[]>(
        `${this.auth.apiBaseUrl}/api/nomenclators/accounting/categories`,
        { headers: this.getAuthHeaders() }
      )
    );
  }

  async getAccountingSubcategories(): Promise<AccountingSubcategory[]> {
    return firstValueFrom(
      this.http.get<AccountingSubcategory[]>(
        `${this.auth.apiBaseUrl}/api/nomenclators/accounting/subcategories`,
        { headers: this.getAuthHeaders() }
      )
    );
  }

  async searchAccounting(params: {
    query?: string;
    categoryCode?: string;
    subcategoryCode?: string;
    limit?: number;
  }): Promise<AccountingItem[]> {
    let httpParams = new HttpParams();

    if (params.query?.trim()) {
      httpParams = httpParams.set('q', params.query.trim());
    }

    if (params.categoryCode?.trim()) {
      httpParams = httpParams.set('categoryCode', params.categoryCode.trim());
    }

    if (params.subcategoryCode?.trim()) {
      httpParams = httpParams.set('subcategoryCode', params.subcategoryCode.trim());
    }

    if (params.limit) {
      httpParams = httpParams.set('limit', String(params.limit));
    }

    return firstValueFrom(
      this.http.get<AccountingItem[]>(
        `${this.auth.apiBaseUrl}/api/nomenclators/accounting/search`,
        {
          headers: this.getAuthHeaders(),
          params: httpParams
        }
      )
    );
  }

  async searchCnae(query: string, limit = 50): Promise<CnaeItem[]> {
    let httpParams = new HttpParams().set('limit', String(limit));

    if (query.trim()) {
      httpParams = httpParams.set('q', query.trim());
    }

    return firstValueFrom(
      this.http.get<CnaeItem[]>(
        `${this.auth.apiBaseUrl}/api/nomenclators/cnae/search`,
        {
          headers: this.getAuthHeaders(),
          params: httpParams
        }
      )
    );
  }

  private getAuthHeaders() {
    const token = this.auth.token;
    if (!token) {
      throw new Error('Debes iniciar sesión para usar el nomenclador');
    }

    return this.auth.authHeaders(token);
  }
}

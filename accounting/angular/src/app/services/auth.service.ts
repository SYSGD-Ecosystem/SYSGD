import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

const TOKEN_KEY = 'sysgd-cont:auth-token';
const API_BASE_KEY = 'sysgd-cont:api-base-url';
const USER_KEY = 'sysgd-cont:auth-user';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  privileges: string;
}

interface LoginResponse {
  token: string;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private readonly http: HttpClient) {}

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get isAuthenticated(): boolean {
    return Boolean(this.token);
  }

  get currentUserValue(): AuthUser | null {
    const userStr = localStorage.getItem(USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as AuthUser;
    } catch {
      return null;
    }
  }

  get apiBaseUrl(): string {
    const configured = localStorage.getItem(API_BASE_KEY)?.trim();
    if (configured) return configured.replace(/\/$/, '');
    return window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://sysgd-production.up.railway.app';
  }

  setApiBaseUrl(url: string): void {
    localStorage.setItem(API_BASE_KEY, url.trim().replace(/\/$/, ''));
  }

  async login(email: string, password: string): Promise<AuthUser> {
    const headers = new HttpHeaders({ 'X-App-Source': 'web' });
    const response = await firstValueFrom(
      this.http.post<LoginResponse>(`${this.apiBaseUrl}/api/auth/login`, {
        email,
        password
      }, { headers })
    );
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
    return response.user;
  }

  async register(name: string, email: string, password: string): Promise<void> {
    const headers = new HttpHeaders({ 'X-App-Source': 'web' });
    await firstValueFrom(
      this.http.post(`${this.apiBaseUrl}/api/users/register`, {
        name,
        email,
        password
      }, { headers })
    );
  }

  async me(): Promise<AuthUser> {
    const token = this.token;
    if (!token) {
      throw new Error('Sin token de autenticación');
    }
    return firstValueFrom(
      this.http.get<AuthUser>(`${this.apiBaseUrl}/api/auth/me`, {
        headers: this.authHeaders(token)
      })
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  authHeaders(token: string): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }
}

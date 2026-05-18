import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, type AuthUser } from '../../services/auth.service';

@Component({
  selector: 'app-auth-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth-section.component.html',
  styleUrl: './auth-section.component.css'
})
export class AuthSectionComponent implements OnInit {
  sessionReady = false;
  authMode: 'login' | 'register' = 'login';
  authLoading = false;
  authError = '';
  offlineRecoveryAvailable = false;
  currentUser: AuthUser | null = null;

  authForm: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router
  ) {
    this.authForm = this.fb.nonNullable.group({
      name: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit(): void {
    if (this.auth.isAuthenticated) {
      this.router.navigate(['/portal']);
      return;
    }
    this.sessionReady = true;
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

      const user = await this.auth.login(email.trim(), password);
      this.currentUser = user;
      this.router.navigate(['/portal']);
    } catch (error) {
      this.authError = this.formatError(error, 'No se pudo iniciar sesión');
    } finally {
      this.authLoading = false;
    }
  }

  continueOffline(): void {
    this.currentUser = {
      id: 'offline-local',
      name: 'Modo offline',
      email: 'offline@local',
      privileges: 'user'
    };
    this.authError = '';
    this.offlineRecoveryAvailable = false;
  }

  private formatError(error: unknown, fallback: string): string {
    const candidate = error as { error?: { message?: string; error?: string }; message?: string };
    return candidate.error?.message ?? candidate.error?.error ?? candidate.message ?? fallback;
  }
}

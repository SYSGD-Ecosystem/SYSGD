import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-auth-section',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth-section.component.html',
  styleUrl: './auth-section.component.css'
})
export class AuthSectionComponent {
  @Input({ required: true }) sessionReady!: boolean;
  @Input({ required: true }) authMode!: 'login' | 'register';
  @Input({ required: true }) authLoading!: boolean;
  @Input({ required: true }) authForm!: FormGroup;
  @Input({ required: true }) authError!: string;
  @Input({ required: true }) offlineRecoveryAvailable!: boolean;

  @Output() submitAuth = new EventEmitter<void>();
  @Output() toggleAuthMode = new EventEmitter<void>();
  @Output() continueOffline = new EventEmitter<void>();
}

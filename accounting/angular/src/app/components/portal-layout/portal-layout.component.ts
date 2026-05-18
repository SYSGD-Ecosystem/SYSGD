import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-portal-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './portal-layout.component.html',
  styleUrl: './portal-layout.component.css'
})
export class PortalLayoutComponent {
  constructor(public auth: AuthService) {}

  logout(): void {
    this.auth.logout();
    window.location.href = '/login';
  }
}

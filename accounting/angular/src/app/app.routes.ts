import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth-section/auth-section.component').then(m => m.AuthSectionComponent)
  },
  {
    path: 'portal',
    canActivate: [authGuard],
    loadComponent: () => import('./components/portal-layout/portal-layout.component').then(m => m.PortalLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'resumen',
        pathMatch: 'full'
      },
      {
        path: 'generales',
        loadComponent: () => import('./pages/generales-page.component').then(m => m.GeneralesPageComponent)
      },
      {
        path: 'movimientos',
        loadComponent: () => import('./pages/movimientos-page.component').then(m => m.MovimientosPageComponent)
      },
      {
        path: 'tributos',
        loadComponent: () => import('./pages/tributos-page.component').then(m => m.TributosPageComponent)
      },
      {
        path: 'resumen',
        loadComponent: () => import('./pages/resumen-page.component').then(m => m.ResumenPageComponent)
      },
      {
        path: 'inventario',
        loadComponent: () => import('./pages/inventario-page.component').then(m => m.InventarioPageComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];

// src/app/app.routes.
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { loginGuard } from './core/guards/login.guard';

export const routes: Routes = [
  // Home público
  {
    path: '',
    loadComponent: () =>
      import('./pages/welcome/welcome.component').then(
        (m) => m.WelcomeComponent
      ),
    pathMatch: 'full',
  },

  // Login (si ya está logueado, lo saco a su panel)
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
    canActivate: [loginGuard],
  },

  {
    path: 'registro',
    canActivate: [loginGuard], // <- si está logueado, no entra
    loadComponent: () =>
      import('./pages/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },

  // Paciente: requiere estar logueado
  {
    path: 'paciente',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/patient-dashboard/patient-dashboard.component').then(
        (m) => m.PatientDashboardComponent
      ),
  },

  // Especialista (chequeo de aprobado lo hace el authGuard con data.roles)
  {
    path: 'especialista',
    canActivate: [authGuard],
    data: { roles: ['especialista'] },
    loadComponent: () =>
      import(
        './pages/specialist-dashboard/specialist-dashboard.component'
      ).then((m) => m.SpecialistDashboardComponent),
  },

  // Admin
  {
    path: 'admin/usuarios',
    canActivate: [authGuard],
    data: { roles: ['admin'] },
    loadComponent: () =>
      import('./pages/admin-users/admin-users.component').then(
        (m) => m.AdminUsersComponent
      ),
  },

  // 404 -> Home público
  { path: '**', redirectTo: '' },
];

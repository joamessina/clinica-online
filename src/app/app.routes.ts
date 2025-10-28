import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { emailVerifiedGuard } from './core/guards/email-verified.guard';
import { adminGuard } from './core/guards/admin.guard';
import { specialistApprovedGuard } from './core/guards/specialist-approved.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/welcome/welcome.component').then(m => m.WelcomeComponent) },

  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'registro', loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent) },

  {
    path: 'paciente',
    canActivate: [authGuard, emailVerifiedGuard],
    loadComponent: () => import('./pages/patient-dashboard/patient-dashboard.component')
      .then(m => m.PatientDashboardComponent),
  },
  {
    path: 'especialista',
    canActivate: [authGuard, emailVerifiedGuard, specialistApprovedGuard],
    loadComponent: () => import('./pages/specialist-dashboard/specialist-dashboard.component')
      .then(m => m.SpecialistDashboardComponent),
  },
  {
    path: 'admin/usuarios',
    canActivate: [authGuard, emailVerifiedGuard, adminGuard],
    loadComponent: () => import('./pages/admin-users/admin-users.component')
      .then(m => m.AdminUsersComponent),
  },

  { path: '**', redirectTo: '' },
];

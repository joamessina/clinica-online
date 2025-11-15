// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { loginGuard } from './core/guards/login.guard';

export const routes: Routes = [
  // Home
  {
    path: '',
    loadComponent: () =>
      import('./pages/welcome/welcome.component').then(
        (m) => m.WelcomeComponent
      ),
    pathMatch: 'full',
    data: { animation: 'slideDown' }, // 👈 entra desde arriba
  },

  // Auth
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
    canActivate: [loginGuard],
    data: { animation: 'slideRight' }, // 👈 segunda animación
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./pages/register/register.component').then(
        (m) => m.RegisterComponent
      ),
    canActivate: [loginGuard],
    data: { animation: 'slideRight' },
  },

  // Dashboards
  {
    path: 'paciente',
    loadComponent: () =>
      import('./pages/patient-dashboard/patient-dashboard.component').then(
        (m) => m.PatientDashboardComponent
      ),
    canActivate: [authGuard],
    data: { animation: 'slideDown' },
  },
  {
    path: 'especialista',
    loadComponent: () =>
      import(
        './pages/specialist-dashboard/specialist-dashboard.component'
      ).then((m) => m.SpecialistDashboardComponent),
    canActivate: [authGuard],
    data: { roles: ['especialista'], animation: 'slideRight' },
  },
  {
    path: 'admin/usuarios',
    loadComponent: () =>
      import('./pages/admin-users/admin-users.component').then(
        (m) => m.AdminUsersComponent
      ),
    canActivate: [authGuard],
    data: { roles: ['admin'], animation: 'slideDown' }, // 👈 admin entra desde arriba
  },

  // NUEVO — Sprint 2
  {
    path: 'paciente/mis-turnos',
    loadComponent: () =>
      import('./paciente/mis-turnos/mis-turnos.component').then(
        (m) => m.MisTurnosPacienteComponent
      ),
    canActivate: [authGuard],
    data: { animation: 'slideRight' },
  },
  {
    path: 'paciente/encuesta/:id',
    loadComponent: () =>
      import('./paciente/encuesta/encuesta.component').then(
        (m) => m.EncuestaPacienteComponent
      ),
    canActivate: [authGuard],
    data: { animation: 'slideRight' },
  },

  {
    path: 'especialista/mis-turnos',
    loadComponent: () =>
      import('./especialidades/mis-turnos/mis-turnos.component').then(
        (m) => m.MisTurnosEspecialistaComponent
      ),
    canActivate: [authGuard],
    data: { roles: ['especialista'], animation: 'slideRight' },
  },
  {
    path: 'especialista/mis-horarios',
    loadComponent: () =>
      import('./especialidades/mis-horarios/mis-horarios.component').then(
        (m) => m.MisHorariosComponent
      ),
    canActivate: [authGuard],
    data: { roles: ['especialista'], animation: 'slideRight' },
  },

  {
    path: 'admin/turnos',
    loadComponent: () =>
      import('./admin/turnos/turnos-admin.component').then(
        (m) => m.TurnosAdminComponent
      ),
    canActivate: [authGuard],
    data: { roles: ['admin'], animation: 'slideDown' },
  },

  {
    path: 'turnos/solicitar',
    loadComponent: () =>
      import('./turnos/solicitar/solicitar-turno.component').then(
        (m) => m.SolicitarTurnoComponent
      ),
    canActivate: [authGuard],
    data: { animation: 'slideRight' },
  },

  {
    path: 'perfil',
    loadComponent: () =>
      import('./pages/profile/profile.component').then(
        (m) => m.ProfileComponent
      ),
    canActivate: [authGuard],
    data: { animation: 'slideDown' },
  },

  // 404
  { path: '**', redirectTo: '' },
];

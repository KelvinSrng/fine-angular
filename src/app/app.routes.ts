import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'data-upload',
    loadComponent: () => import('./components/data-upload/data-upload.component').then(m => m.DataUploadComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['coordinador_academico'] }
  },
  {
    path: 'schedules',
    loadComponent: () => import('./components/schedule-viewer/schedule-viewer.component').then(m => m.ScheduleViewerComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['coordinador_academico'] }
  },
  {
    path: 'conflicts',
    loadComponent: () => import('./components/conflict-detector/conflict-detector.component').then(m => m.ConflictDetectorComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['coordinador_academico'] }
  },
  {
    path: 'simulator',
    loadComponent: () => import('./components/simulator/simulator.component').then(m => m.SimulatorComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['coordinador_academico'] }
  },
  {
    path: 'reports',
    loadComponent: () => import('./components/reports/reports.component').then(m => m.ReportsComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['coordinador_academico'] }
  },
  {
    path: 'asignaciones',
    loadComponent: () => import('./components/asignaciones/asignaciones.component').then(m => m.AsignacionesComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['coordinador_academico'] }
  },
  {
    path: 'sugerencias-asignacion',
    loadComponent: () => import('./components/asignaciones/sugerencias-asignacion.component').then(m => m.SugerenciasAsignacionComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['coordinador_academico'] }
  },
  {
    path: 'docentes',
    loadComponent: () => import('./components/docentes/docentes.component').then(m => m.DocentesComponent),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['rrhh'] }
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
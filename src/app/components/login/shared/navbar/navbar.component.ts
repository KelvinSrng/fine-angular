import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../../services/auth.service';
import { User } from '../../../../models/api.models';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar navbar-expand-lg">
      <div class="container-fluid">
        <a class="navbar-brand" routerLink="/dashboard">
          <i class="fas fa-book me-2"></i>
          Fine Tuned English
        </a>
        
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <a class="nav-link" routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
            </li>
            
            <!-- Opciones para Coordinador Académico -->
            <ng-container *ngIf="currentUser?.rol === 'coordinador_academico'">
              <li class="nav-item">
                <a class="nav-link" routerLink="/schedules" routerLinkActive="active">Horarios Docentes</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/asignaciones" routerLinkActive="active">Asignaciones</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/sugerencias-asignacion" routerLinkActive="active">Sugerencias de Asignación</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/data-upload" routerLinkActive="active">Carga de Datos</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/conflicts" routerLinkActive="active">Conflictos</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/simulator" routerLinkActive="active">Simulación</a>
              </li>
              <li class="nav-item">
                <a class="nav-link" routerLink="/reports" routerLinkActive="active">Reportes</a>
              </li>
            </ng-container>
            
            <!-- Opciones para RRHH -->
            <ng-container *ngIf="currentUser?.rol === 'rrhh'">
              <li class="nav-item">
                <a class="nav-link" routerLink="/docentes" routerLinkActive="active">Gestión de Docentes</a>
              </li>
            </ng-container>
          </ul>
          
          <div class="navbar-nav" *ngIf="currentUser">
            <div class="nav-item dropdown">
              <a class="nav-link dropdown-toggle d-flex align-items-center" 
                 href="#" 
                 role="button" 
                 data-bs-toggle="dropdown" 
                 aria-expanded="false"
                 (click)="$event.preventDefault()">
                <i class="fas fa-user-circle me-2"></i>
                <div class="d-flex flex-column align-items-start">
                  <span class="fw-semibold">{{ currentUser.name }}</span>
                  <small class="text-muted">{{ getRoleLabel(currentUser.rol) }} - {{ currentUser.sede }}</small>
                </div>
              </a>
              <ul class="dropdown-menu dropdown-menu-end">
                <li>
                  <h6 class="dropdown-header">
                    <i class="fas fa-user me-2"></i>{{ currentUser.name }}
                  </h6>
                </li>
                <li>
                  <div class="dropdown-item-text">
                    <div class="d-flex align-items-center">
                      <i class="fas fa-envelope me-2 text-muted"></i>
                      <small>{{ currentUser.email }}</small>
                    </div>
                    <div class="d-flex align-items-center mt-1">
                      <i class="fas fa-building me-2 text-muted"></i>
                      <small>{{ currentUser.sede }}</small>
                    </div>
                    <div class="d-flex align-items-center mt-1">
                      <i class="fas fa-user-tag me-2 text-muted"></i>
                      <small>{{ getRoleLabel(currentUser.rol) }}</small>
                    </div>
                  </div>
                </li>
                <li><hr class="dropdown-divider"></li>
                <li>
                  <a class="dropdown-item" href="#" (click)="$event.preventDefault()">
                    <i class="fas fa-user-cog me-2"></i>
                    Mi Perfil
                  </a>
                </li>
                <li>
                  <a class="dropdown-item" href="#" (click)="$event.preventDefault()">
                    <i class="fas fa-cog me-2"></i>
                    Configuración
                  </a>
                </li>
                <li><hr class="dropdown-divider"></li>
                <li>
                  <a class="dropdown-item" href="#" (click)="logout(); $event.preventDefault()">
                    <i class="fas fa-sign-out-alt me-2"></i>
                    Cerrar Sesión
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent implements OnInit {
  currentUser: User | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  logout(): void {
    this.authService.logout();
  }

  getRoleLabel(rol: string): string {
    const roleLabels: Record<string, string> = {
      'rrhh': 'Recursos Humanos',
      'coordinador_academico': 'Coordinador Académico'
    };
    return roleLabels[rol] || rol;
  }
}
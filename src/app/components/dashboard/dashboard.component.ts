import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../login/shared/navbar/navbar.component';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    
    <div class="container-fluid">
      <div class="row">
        <main class="col-12 main-content">
          <div class="fade-in">
            <!-- Dashboard Header -->
            <div class="dashboard-header">
              <h1>Panel de Control - Sistema de Gestión de Horarios</h1>
              <p>Gestión integral de docentes, aulas y asignaciones académicas</p>
            </div>
            
            <!-- Conflict Alert -->
            <div class="alert alert-warning mb-4" *ngIf="conflictsCount > 0">
              <div class="d-flex align-items-center">
                <i class="fas fa-exclamation-triangle me-3"></i>
                <div>
                  <strong>Conflictos de Asignación Detectados</strong><br>
                  <small>Se han detectado {{ conflictsCount }} conflictos en la asignación de horarios. <a routerLink="/conflicts" class="alert-link">Ver detalles</a></small>
                </div>
              </div>
            </div>
            
            <!-- Statistics Cards -->
            <div class="row mb-4">
              <div class="col-xl-3 col-md-6 mb-4">
                <div class="stats-card">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <div class="text-muted small mb-1">Docentes Registrados</div>
                      <div class="h3 mb-0 font-weight-bold text-primary">{{ teachersCount }}</div>
                      <div class="text-muted small">Profesores activos</div>
                    </div>
                    <div class="text-primary">
                      <i class="fas fa-users fa-2x opacity-50"></i>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="col-xl-3 col-md-6 mb-4">
                <div class="stats-card secondary">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <div class="text-muted small mb-1">Aulas Disponibles</div>
                      <div class="h3 mb-0 font-weight-bold" style="color: var(--secondary-color)">{{ classroomsCount }}</div>
                      <div class="text-muted small">Espacios físicos</div>
                    </div>
                    <div style="color: var(--secondary-color)">
                      <i class="fas fa-building fa-2x opacity-50"></i>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="col-xl-3 col-md-6 mb-4">
                <div class="stats-card success">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <div class="text-muted small mb-1">Componentes</div>
                      <div class="h3 mb-0 font-weight-bold text-success">{{ componentsCount }}</div>
                      <div class="text-muted small">Materias programadas</div>
                    </div>
                    <div class="text-success">
                      <i class="fas fa-book fa-2x opacity-50"></i>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="col-xl-3 col-md-6 mb-4">
                <div class="stats-card warning">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <div class="text-muted small mb-1">Asignaciones</div>
                      <div class="h3 mb-0 font-weight-bold text-warning">{{ assignmentsCount }}</div>
                      <div class="text-muted small">Horarios programados</div>
                    </div>
                    <div class="text-warning">
                      <i class="fas fa-calendar-alt fa-2x opacity-50"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Action Cards -->
            <div class="row">
              <div class="col-lg-4 mb-4">
                <div class="card h-100 shadow">
                  <div class="card-body text-center">
                    <i class="fas fa-calendar-alt fa-3x text-primary mb-3"></i>
                    <h5 class="card-title">Ver Horarios</h5>
                    <p class="card-text text-muted">Visualiza todos los horarios programados y asignaciones</p>
                    <button class="btn btn-primary" routerLink="/schedules">Ver Horarios</button>
                  </div>
                </div>
              </div>
              
              <div class="col-lg-4 mb-4">
                <div class="card h-100 shadow">
                  <div class="card-body text-center">
                    <i class="fas fa-upload fa-3x text-success mb-3"></i>
                    <h5 class="card-title">Cargar Datos</h5>
                    <p class="card-text text-muted">Importa docentes, aulas y componentes desde archivos Excel</p>
                    <button class="btn btn-success" routerLink="/data-upload">Cargar Datos</button>
                  </div>
                </div>
              </div>
              
              <div class="col-lg-4 mb-4">
                <div class="card h-100 shadow">
                  <div class="card-body text-center">
                    <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                    <h5 class="card-title">Detectar Conflictos</h5>
                    <p class="card-text text-muted">Identifica conflictos en horarios y asignaciones</p>
                    <button class="btn btn-warning" routerLink="/conflicts">Ver Conflictos</button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Additional Tools -->
            <div class="row mt-4">
              <div class="col-lg-6 mb-4">
                <div class="card shadow">
                  <div class="card-header">
                    <h5 class="card-title mb-0">Herramientas Adicionales</h5>
                  </div>
                  <div class="card-body">
                    <div class="d-grid gap-2">
                      <button class="btn btn-outline-primary" routerLink="/simulator">
                        <i class="fas fa-flask me-2"></i>Simulador de Horarios
                      </button>
                      <button class="btn btn-outline-info" routerLink="/reports">
                        <i class="fas fa-file-pdf me-2"></i>Generar Reportes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="col-lg-6 mb-4">
                <div class="card shadow">
                  <div class="card-header">
                    <h5 class="card-title mb-0">Resumen de Capacidad</h5>
                  </div>
                  <div class="card-body">
                    <div class="mb-3">
                      <div class="d-flex justify-content-between align-items-center mb-2">
                        <span>Capacidad Total Ofertada</span>
                        <span class="fw-bold">{{ totalCapacity }} estudiantes</span>
                      </div>
                      <div class="progress" style="height: 8px;">
                        <div class="progress-bar bg-success" style="width: 75%"></div>
                      </div>
                      <small class="text-muted">75% de ocupación estimada</small>
                    </div>
                    
                    <div class="mb-3">
                      <div class="d-flex justify-content-between align-items-center mb-2">
                        <span>Docentes con Asignaciones</span>
                        <span class="fw-bold">{{ getActiveTeachersCount() }}/{{ teachersCount }}</span>
                      </div>
                      <div class="progress" style="height: 8px;">
                        <div class="progress-bar bg-info" [style.width.%]="getActiveTeachersPercentage()"></div>
                      </div>
                    </div>
                    
                    <div class="mb-3">
                      <div class="d-flex justify-content-between align-items-center mb-2">
                        <span>Aulas en Uso</span>
                        <span class="fw-bold">{{ getActiveClassroomsCount() }}/{{ classroomsCount }}</span>
                      </div>
                      <div class="progress" style="height: 8px;">
                        <div class="progress-bar bg-warning" [style.width.%]="getActiveClassroomsPercentage()"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  teachersCount = 0;
  classroomsCount = 0;
  componentsCount = 0;
  assignmentsCount = 0;
  conflictsCount = 0;
  totalCapacity = 0;
  activeTeachers = 0;
  activeClassrooms = 0;

  constructor(
    private dataService: DataService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  private loadStats(): void {
    // Cargar estadísticas de docentes
    this.dataService.getDocentes().subscribe(docentes => {
      this.teachersCount = docentes.length;
    });

    // Cargar estadísticas de aulas
    this.dataService.getAulas().subscribe(aulas => {
      this.classroomsCount = aulas.length;
    });

    // Cargar estadísticas de componentes
    this.dataService.getComponentes().subscribe(componentes => {
      this.componentsCount = componentes.length;
      this.totalCapacity = componentes.reduce((total, comp) => total + comp.capacidad_ofertada, 0);
    });

    // Cargar estadísticas de asignaciones
    this.dataService.getAsignaciones().subscribe(asignaciones => {
      this.assignmentsCount = asignaciones.length;
      
      // Calcular docentes activos (con asignaciones)
      const docentesConAsignaciones = new Set(asignaciones.map(a => a.docente_id));
      this.activeTeachers = docentesConAsignaciones.size;
      
      // Calcular aulas activas (con asignaciones)
      const aulasConAsignaciones = new Set(asignaciones.map(a => a.componente?.aula_id).filter(id => id));
      this.activeClassrooms = aulasConAsignaciones.size;
    });

    // Detectar conflictos
    this.dataService.detectConflicts().subscribe(conflicts => {
      this.conflictsCount = conflicts.length;
    });
  }

  getActiveTeachersCount(): number {
    return this.activeTeachers;
  }

  getActiveTeachersPercentage(): number {
    return this.teachersCount > 0 ? (this.activeTeachers / this.teachersCount) * 100 : 0;
  }

  getActiveClassroomsCount(): number {
    return this.activeClassrooms;
  }

  getActiveClassroomsPercentage(): number {
    return this.classroomsCount > 0 ? (this.activeClassrooms / this.classroomsCount) * 100 : 0;
  }
}
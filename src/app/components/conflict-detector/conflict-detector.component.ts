import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from '../login/shared/navbar/navbar.component';
import { DataService, Conflict } from '../../services/data.service';

@Component({
  selector: 'app-conflict-detector',
  standalone: true,
  imports: [CommonModule, RouterModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    
    <div class="container-fluid">
      <div class="row">
        <main class="col-12 main-content">
          <div class="fade-in">
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
              <h1 class="h2">Detección de Conflictos</h1>
              <button class="btn btn-primary" (click)="refreshConflicts()" [disabled]="isLoading">
                <span class="spinner-border spinner-border-sm me-2" *ngIf="isLoading"></span>
                <i class="fas fa-sync-alt me-2" *ngIf="!isLoading"></i>
                {{ isLoading ? 'Analizando...' : 'Actualizar' }}
              </button>
            </div>
            
            <!-- Loading State -->
            <div class="text-center py-4" *ngIf="isLoading">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Analizando conflictos...</span>
              </div>
              <p class="mt-2">Analizando asignaciones desde la base de datos...</p>
            </div>
            
            <!-- Summary Cards -->
            <div class="row mb-4" *ngIf="!isLoading">
              <div class="col-md-4">
                <div class="card border-danger shadow h-100">
                  <div class="card-body text-center">
                    <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                    <h3 class="text-danger">{{ conflicts.length }}</h3>
                    <p class="card-text">Conflictos Detectados</p>
                  </div>
                </div>
              </div>
              
              <div class="col-md-4">
                <div class="card border-warning shadow h-100">
                  <div class="card-body text-center">
                    <i class="fas fa-user-times fa-3x text-warning mb-3"></i>
                    <h3 class="text-warning">{{ getTeacherConflictCount() }}</h3>
                    <p class="card-text">Conflictos de Docentes</p>
                  </div>
                </div>
              </div>
              
              <div class="col-md-4">
                <div class="card border-info shadow h-100">
                  <div class="card-body text-center">
                    <i class="fas fa-building fa-3x text-info mb-3"></i>
                    <h3 class="text-info">{{ getClassroomConflictCount() }}</h3>
                    <p class="card-text">Conflictos de Aulas</p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Conflicts List -->
            <div class="card shadow" *ngIf="!isLoading && conflicts.length > 0">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="fas fa-list me-2"></i>Lista de Conflictos Detectados
                </h5>
              </div>
              <div class="card-body">
                <div class="accordion" id="conflictsAccordion">
                  <div class="accordion-item" *ngFor="let conflict of conflicts; let i = index">
                    <h2 class="accordion-header">
                      <button 
                        class="accordion-button" 
                        [class.collapsed]="i !== 0"
                        type="button" 
                        data-bs-toggle="collapse"
                        [attr.data-bs-target]="'#collapse' + i"
                        [attr.aria-expanded]="i === 0"
                        [attr.aria-controls]="'collapse' + i"
                      >
                        <i class="fas fa-exclamation-circle text-danger me-2"></i>
                        <strong>{{ conflict.message }}</strong>
                        <span class="badge bg-danger ms-auto me-2">{{ getConflictTypeLabel(conflict.type) }}</span>
                      </button>
                    </h2>
                    <div 
                      [id]="'collapse' + i" 
                      class="accordion-collapse collapse"
                      [class.show]="i === 0"
                      data-bs-parent="#conflictsAccordion"
                    >
                      <div class="accordion-body">
                        <!-- Affected Schedules -->
                        <h6 class="mb-3">
                          <i class="fas fa-calendar-times me-2"></i>Horarios Afectados:
                        </h6>
                        <div class="table-responsive mb-3">
                          <table class="table table-sm table-striped">
                            <thead class="table-dark">
                              <tr>
                                <th>Día</th>
                                <th>Horario</th>
                                <th>Aula</th>
                                <th>Docente</th>
                                <th>Paralelo</th>
                                <th>Componente</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr *ngFor="let schedule of conflict.schedules" class="conflict-row">
                                <td>
                                  <span class="badge bg-secondary">{{ schedule.dia }}</span>
                                </td>
                                <td>
                                  <strong>{{ schedule.hora_inicio }} - {{ schedule.hora_fin }}</strong>
                                </td>
                                <td>
                                  <span class="badge bg-info">{{ schedule.aula }}</span>
                                </td>
                                <td>{{ schedule.docente }}</td>
                                <td>
                                  <span class="badge bg-primary">{{ schedule.paralelo }}</span>
                                </td>
                                <td>{{ schedule.programa || 'N/A' }}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        
                        <!-- Suggestion -->
                        <div class="alert alert-info">
                          <h6 class="alert-heading">
                            <i class="fas fa-lightbulb me-2"></i>Sugerencia de Resolución:
                          </h6>
                          {{ conflict.suggestion }}
                        </div>
                        
                        <!-- Action Buttons -->
                        <div class="d-flex gap-2 flex-wrap">
                          <button class="btn btn-success btn-sm" (click)="resolveConflict(conflict.id)">
                            <i class="fas fa-check me-1"></i>Marcar como Resuelto
                          </button>
                          <button class="btn btn-warning btn-sm" (click)="createSimulation(conflict)" routerLink="/simulator">
                            <i class="fas fa-flask me-1"></i>Crear Simulación
                          </button>
                          <button class="btn btn-info btn-sm" (click)="viewSchedules(conflict)" routerLink="/schedules">
                            <i class="fas fa-calendar me-1"></i>Ver en Horarios
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- No Conflicts State -->
            <div class="card shadow" *ngIf="!isLoading && conflicts.length === 0">
              <div class="card-body text-center py-5">
                <i class="fas fa-check-circle fa-4x text-success mb-3"></i>
                <h3 class="text-success">¡Excelente!</h3>
                <p class="lead">No se detectaron conflictos en los horarios actuales.</p>
                <p class="text-muted">Todas las asignaciones están correctamente programadas sin solapamientos.</p>
                <div class="mt-4">
                  <button class="btn btn-primary me-2" routerLink="/schedules">
                    <i class="fas fa-calendar me-2"></i>Ver Horarios
                  </button>
                  <button class="btn btn-outline-success" (click)="refreshConflicts()">
                    <i class="fas fa-sync-alt me-2"></i>Verificar Nuevamente
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Recommendations Panel -->
            <div class="card shadow mt-4" *ngIf="!isLoading && conflicts.length > 0">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="fas fa-clipboard-list me-2"></i>Recomendaciones Generales
                </h5>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-6">
                    <h6><i class="fas fa-tasks me-2"></i>Acciones Recomendadas:</h6>
                    <ul class="list-unstyled">
                      <li class="mb-2">
                        <i class="fas fa-arrow-right text-primary me-2"></i>
                        Revisar disponibilidad de docentes antes de asignar horarios
                      </li>
                      <li class="mb-2">
                        <i class="fas fa-arrow-right text-primary me-2"></i>
                        Verificar capacidad de aulas vs. tamaño de grupos
                      </li>
                      <li class="mb-2">
                        <i class="fas fa-arrow-right text-primary me-2"></i>
                        Considerar la distancia entre aulas para cambios de clase
                      </li>
                      <li class="mb-2">
                        <i class="fas fa-arrow-right text-primary me-2"></i>
                        Validar modalidades de enseñanza (presencial/virtual)
                      </li>
                    </ul>
                  </div>
                  
                  <div class="col-md-6">
                    <h6><i class="fas fa-tools me-2"></i>Herramientas Disponibles:</h6>
                    <div class="d-grid gap-2">
                      <button class="btn btn-outline-primary btn-sm" routerLink="/simulator">
                        <i class="fas fa-flask me-2"></i>Usar Simulador de Horarios
                      </button>
                      <button class="btn btn-outline-info btn-sm" routerLink="/schedules">
                        <i class="fas fa-calendar me-2"></i>Ver Horarios Completos
                      </button>
                      <button class="btn btn-outline-success btn-sm" routerLink="/reports">
                        <i class="fas fa-file-pdf me-2"></i>Generar Reporte de Conflictos
                      </button>
                      <button class="btn btn-outline-warning btn-sm" routerLink="/data-upload">
                        <i class="fas fa-upload me-2"></i>Actualizar Datos
                      </button>
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
export class ConflictDetectorComponent implements OnInit {
  conflicts: Conflict[] = [];
  isLoading = false;

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.refreshConflicts();
  }

  refreshConflicts(): void {
    this.isLoading = true;
    
    // Detectar conflictos basados en datos reales de la base de datos
    this.dataService.detectConflicts().subscribe({
      next: (conflicts) => {
        this.conflicts = conflicts;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error detecting conflicts:', error);
        this.conflicts = [];
        this.isLoading = false;
      }
    });
  }

  getTeacherConflictCount(): number {
    return this.conflicts.filter(c => c.type === 'teacher_conflict').length;
  }

  getClassroomConflictCount(): number {
    return this.conflicts.filter(c => c.type === 'classroom_conflict').length;
  }

  getConflictTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'teacher_conflict': 'Docente',
      'classroom_conflict': 'Aula',
      'schedule_conflict': 'Horario'
    };
    return labels[type] || 'Desconocido';
  }

  resolveConflict(conflictId: number): void {
    // Simular resolución de conflicto
    this.conflicts = this.conflicts.filter(c => c.id !== conflictId);
    
    // En una aplicación real, esto actualizaría el backend
    console.log('Conflict resolved:', conflictId);
    
    // Mostrar mensaje de éxito
    // Aquí podrías agregar un toast o notificación
  }

  createSimulation(conflict: Conflict): void {
    // Navegar al simulador con datos del conflicto
    console.log('Creating simulation for conflict:', conflict);
    // En una implementación real, pasarías los datos del conflicto al simulador
  }

  viewSchedules(conflict: Conflict): void {
    // Navegar a la vista de horarios con filtros aplicados
    console.log('Viewing schedules for conflict:', conflict);
    // En una implementación real, aplicarías filtros específicos
  }
}
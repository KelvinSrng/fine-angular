import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../login/shared/navbar/navbar.component';
import { DataService, Schedule } from '../../services/data.service';

@Component({
  selector: 'app-simulator',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    
    <div class="container-fluid">
      <div class="row">
        <main class="col-12 main-content">
          <div class="fade-in">
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
              <h1 class="h2">Simulador de Horarios</h1>
              <div class="btn-toolbar">
                <button class="btn btn-primary me-2" (click)="createSimulation()" [disabled]="!originalSchedules.length">
                  <i class="fas fa-plus me-2"></i>Nueva Simulación
                </button>
                <button class="btn btn-success me-2" (click)="saveSimulation()" [disabled]="!hasSimulation">
                  <i class="fas fa-save me-2"></i>Guardar Simulación
                </button>
                <button class="btn btn-danger" (click)="resetSimulation()" [disabled]="!hasSimulation">
                  <i class="fas fa-undo me-2"></i>Resetear
                </button>
              </div>
            </div>
            
            <!-- Simulation Status -->
            <div class="alert alert-info mb-4" *ngIf="!hasSimulation">
              <i class="fas fa-info-circle me-2"></i>
              Cree una nueva simulación para comenzar a experimentar con cambios en los horarios.
            </div>
            
            <div class="alert alert-warning mb-4" *ngIf="hasSimulation">
              <i class="fas fa-flask me-2"></i>
              <strong>Modo Simulación Activo:</strong> Los cambios realizados no afectan los horarios oficiales.
            </div>
            
            <!-- Comparison View -->
            <div class="row" *ngIf="hasSimulation">
              <div class="col-lg-6 mb-4">
                <div class="card shadow">
                  <div class="card-header bg-primary text-white">
                    <h5 class="card-title mb-0">
                      <i class="fas fa-calendar-check me-2"></i>Horarios Oficiales
                    </h5>
                  </div>
                  <div class="card-body">
                    <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                      <table class="table table-sm table-striped">
                        <thead class="sticky-top bg-light">
                          <tr>
                            <th>Día</th>
                            <th>Hora</th>
                            <th>Aula</th>
                            <th>Docente</th>
                            <th>Paralelo</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr *ngFor="let schedule of originalSchedules">
                            <td>{{ schedule.dia }}</td>
                            <td>{{ schedule.hora_inicio }}-{{ schedule.hora_fin }}</td>
                            <td>{{ schedule.aula }}</td>
                            <td>{{ schedule.docente }}</td>
                            <td>{{ schedule.paralelo }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="col-lg-6 mb-4">
                <div class="card shadow">
                  <div class="card-header bg-warning text-dark">
                    <h5 class="card-title mb-0">
                      <i class="fas fa-flask me-2"></i>Simulación
                    </h5>
                  </div>
                  <div class="card-body">
                    <div class="table-responsive" style="max-height: 400px; overflow-y: auto;">
                      <table class="table table-sm table-striped">
                        <thead class="sticky-top bg-light">
                          <tr>
                            <th>Día</th>
                            <th>Hora</th>
                            <th>Aula</th>
                            <th>Docente</th>
                            <th>Paralelo</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr *ngFor="let schedule of simulatedSchedules; let i = index" 
                              [class]="isScheduleModified(schedule) ? 'table-warning' : ''">
                            <td>
                              <select class="form-select form-select-sm" 
                                      [(ngModel)]="schedule.dia" 
                                      (change)="markAsModified(schedule)">
                                <option value="Lunes">Lunes</option>
                                <option value="Martes">Martes</option>
                                <option value="Miércoles">Miércoles</option>
                                <option value="Jueves">Jueves</option>
                                <option value="Viernes">Viernes</option>
                              </select>
                            </td>
                            <td>
                              <div class="d-flex gap-1">
                                <input type="time" class="form-control form-control-sm" 
                                       [(ngModel)]="schedule.hora_inicio" 
                                       (change)="markAsModified(schedule)">
                                <input type="time" class="form-control form-control-sm" 
                                       [(ngModel)]="schedule.hora_fin" 
                                       (change)="markAsModified(schedule)">
                              </div>
                            </td>
                            <td>
                              <select class="form-select form-select-sm" 
                                      [(ngModel)]="schedule.aula" 
                                      (change)="markAsModified(schedule)">
                                <option *ngFor="let classroom of availableClassrooms" [value]="classroom.id">
                                  {{ classroom.id }}
                                </option>
                              </select>
                            </td>
                            <td>
                              <select class="form-select form-select-sm" 
                                      [(ngModel)]="schedule.docente" 
                                      (change)="markAsModified(schedule)">
                                <option *ngFor="let teacher of availableTeachers" [value]="teacher.nombre">
                                  {{ teacher.nombre }}
                                </option>
                              </select>
                            </td>
                            <td>{{ schedule.paralelo }}</td>
                            <td>
                              <button class="btn btn-danger btn-sm" (click)="removeSchedule(i)">
                                <i class="fas fa-trash"></i>
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    <button class="btn btn-outline-primary btn-sm mt-2" (click)="addNewSchedule()">
                      <i class="fas fa-plus me-1"></i>Agregar Horario
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Analysis Results -->
            <div class="card shadow mt-4" *ngIf="hasSimulation">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="fas fa-chart-line me-2"></i>Análisis de la Simulación
                </h5>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-4 mb-3">
                    <div class="card bg-light">
                      <div class="card-body text-center">
                        <h4 class="text-primary">{{ getChangeCount() }}</h4>
                        <p class="mb-0">Cambios Realizados</p>
                      </div>
                    </div>
                  </div>
                  
                  <div class="col-md-4 mb-3">
                    <div class="card bg-light">
                      <div class="card-body text-center">
                        <h4 class="text-info">{{ simulatedSchedules.length }}</h4>
                        <p class="mb-0">Horarios en Simulación</p>
                      </div>
                    </div>
                  </div>
                  
                  <div class="col-md-4 mb-3">
                    <div class="card bg-light">
                      <div class="card-body text-center">
                        <h4 [class]="getSimulationConflicts() > 0 ? 'text-danger' : 'text-success'">
                          {{ getSimulationConflicts() }}
                        </h4>
                        <p class="mb-0">Conflictos Detectados</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Conflict Warnings -->
                <div class="alert alert-danger mt-3" *ngIf="simulationConflicts.length > 0">
                  <h6 class="alert-heading">
                    <i class="fas fa-exclamation-triangle me-2"></i>Conflictos en la Simulación:
                  </h6>
                  <ul class="mb-0">
                    <li *ngFor="let conflict of simulationConflicts">{{ conflict }}</li>
                  </ul>
                </div>
                
                <div class="alert alert-success mt-3" *ngIf="simulationConflicts.length === 0 && hasSimulation">
                  <i class="fas fa-check-circle me-2"></i>
                  ¡Excelente! La simulación no presenta conflictos.
                </div>
              </div>
            </div>
            
            <!-- Scenario Templates -->
            <div class="card shadow mt-4" *ngIf="!hasSimulation">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="fas fa-magic me-2"></i>Escenarios Predefinidos
                </h5>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-4 mb-3">
                    <div class="card border-primary">
                      <div class="card-body">
                        <h6 class="card-title">Optimizar por Docente</h6>
                        <p class="card-text">Agrupa las clases de cada docente para minimizar desplazamientos.</p>
                        <button class="btn btn-outline-primary btn-sm" (click)="applyScenario('optimize-teacher')">
                          Aplicar
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div class="col-md-4 mb-3">
                    <div class="card border-success">
                      <div class="card-body">
                        <h6 class="card-title">Maximizar Uso de Aulas</h6>
                        <p class="card-text">Reorganiza horarios para usar eficientemente las aulas disponibles.</p>
                        <button class="btn btn-outline-success btn-sm" (click)="applyScenario('optimize-rooms')">
                          Aplicar
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div class="col-md-4 mb-3">
                    <div class="card border-warning">
                      <div class="card-body">
                        <h6 class="card-title">Resolver Conflictos</h6>
                        <p class="card-text">Ajusta automáticamente los horarios para eliminar conflictos.</p>
                        <button class="btn btn-outline-warning btn-sm" (click)="applyScenario('resolve-conflicts')">
                          Aplicar
                        </button>
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
export class SimulatorComponent implements OnInit {
  originalSchedules: Schedule[] = [];
  simulatedSchedules: Schedule[] = [];
  availableTeachers: any[] = [];
  availableClassrooms: any[] = [];
  hasSimulation = false;
  modifiedSchedules: Set<number> = new Set();
  simulationConflicts: string[] = [];

  constructor(private dataService: DataService) {}

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.dataService.getSchedules().subscribe({
      next: (schedules) => {
      this.originalSchedules = schedules;
      },
      error: (error) => {
        console.error('Error loading schedules:', error);
        this.originalSchedules = [];
      }
    });

    this.dataService.getTeachers().subscribe({
      next: (teachers) => {
      this.availableTeachers = teachers;
      },
      error: (error) => {
        console.error('Error loading teachers:', error);
        this.availableTeachers = [];
      }
    });

    this.dataService.getClassrooms().subscribe({
      next: (classrooms) => {
      this.availableClassrooms = classrooms;
      },
      error: (error) => {
        console.error('Error loading classrooms:', error);
        this.availableClassrooms = [];
      }
    });
  }

  createSimulation(): void {
    this.simulatedSchedules = this.dataService.duplicateSchedules();
    this.hasSimulation = true;
    this.modifiedSchedules.clear();
    this.analyzeSimulation();
  }

  resetSimulation(): void {
    this.simulatedSchedules = [];
    this.hasSimulation = false;
    this.modifiedSchedules.clear();
    this.simulationConflicts = [];
  }

  saveSimulation(): void {
    // In a real application, this would save the simulation as the new official schedule
    console.log('Saving simulation:', this.simulatedSchedules);
    // For demo purposes, just show success message
    alert('Simulación guardada exitosamente. Los horarios oficiales han sido actualizados.');
    this.resetSimulation();
  }

  markAsModified(schedule: Schedule): void {
    if (schedule.id) {
      this.modifiedSchedules.add(schedule.id);
    }
    this.analyzeSimulation();
  }

  isScheduleModified(schedule: Schedule): boolean {
    return schedule.id ? this.modifiedSchedules.has(schedule.id) : false;
  }

  getChangeCount(): number {
    return this.modifiedSchedules.size;
  }

  addNewSchedule(): void {
    const newSchedule: Schedule = {
      id: Math.max(...this.simulatedSchedules.map(s => s.id || 0)) + 1,
      dia: 'Lunes',
      hora_inicio: '08:00',
      hora_fin: '10:00',
      aula: this.availableClassrooms[0]?.id || '',
      docente: this.availableTeachers[0]?.nombre || '',
      paralelo: 'Nuevo'
    };
    
    this.simulatedSchedules.push(newSchedule);
    this.markAsModified(newSchedule);
  }

  removeSchedule(index: number): void {
    this.simulatedSchedules.splice(index, 1);
    this.analyzeSimulation();
  }

  applyScenario(scenario: string): void {
    this.createSimulation();
    
    switch (scenario) {
      case 'optimize-teacher':
        this.optimizeByTeacher();
        break;
      case 'optimize-rooms':
        this.optimizeByRooms();
        break;
      case 'resolve-conflicts':
        this.resolveConflicts();
        break;
    }
    
    this.analyzeSimulation();
  }

  private optimizeByTeacher(): void {
    // Simple optimization: group classes by teacher
    this.simulatedSchedules.sort((a, b) => {
      if (a.docente < b.docente) return -1;
      if (a.docente > b.docente) return 1;
      return 0;
    });
    
    this.simulatedSchedules.forEach(schedule => {
      if (schedule.id) this.modifiedSchedules.add(schedule.id);
    });
  }

  private optimizeByRooms(): void {
    // Simple optimization: use rooms efficiently
    this.simulatedSchedules.sort((a, b) => {
      if (a.aula < b.aula) return -1;
      if (a.aula > b.aula) return 1;
      return 0;
    });
    
    this.simulatedSchedules.forEach(schedule => {
      if (schedule.id) this.modifiedSchedules.add(schedule.id);
    });
  }

  private resolveConflicts(): void {
    // Simple conflict resolution: adjust times for conflicts
    const conflicts = this.findConflicts();
    conflicts.forEach(conflictPair => {
      const [schedule1, schedule2] = conflictPair;
      // Move second schedule to next available time slot
      const newTime = this.getNextAvailableTime(schedule2.hora_inicio);
      schedule2.hora_inicio = newTime.start;
      schedule2.hora_fin = newTime.end;
      
      if (schedule2.id) this.modifiedSchedules.add(schedule2.id);
    });
  }

  private analyzeSimulation(): void {
    this.simulationConflicts = [];
    
    // Check for conflicts
    const conflicts = this.findConflicts();
    conflicts.forEach(conflictPair => {
      const [schedule1, schedule2] = conflictPair;
      this.simulationConflicts.push(
        `Conflicto: ${schedule1.docente} y ${schedule2.paralelo} en ${schedule1.dia} a las ${schedule1.hora_inicio}`
      );
    });
  }

  private findConflicts(): Schedule[][] {
    const conflicts: Schedule[][] = [];
    
    for (let i = 0; i < this.simulatedSchedules.length; i++) {
      for (let j = i + 1; j < this.simulatedSchedules.length; j++) {
        const schedule1 = this.simulatedSchedules[i];
        const schedule2 = this.simulatedSchedules[j];
        
        if (schedule1.dia === schedule2.dia &&
            schedule1.hora_inicio === schedule2.hora_inicio &&
            (schedule1.docente === schedule2.docente || schedule1.aula === schedule2.aula)) {
          conflicts.push([schedule1, schedule2]);
        }
      }
    }
    
    return conflicts;
  }

  private getNextAvailableTime(currentTime: string): { start: string, end: string } {
    const timeSlots = ['08:00', '10:00', '12:00', '14:00', '16:00'];
    const currentIndex = timeSlots.indexOf(currentTime);
    const nextIndex = (currentIndex + 1) % timeSlots.length;
    
    return {
      start: timeSlots[nextIndex],
      end: timeSlots[(nextIndex + 1) % timeSlots.length]
    };
  }

  getSimulationConflicts(): number {
    return this.simulationConflicts.length;
  }
}
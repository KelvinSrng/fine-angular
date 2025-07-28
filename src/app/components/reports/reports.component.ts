import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../login/shared/navbar/navbar.component';
import { DataService, Schedule, Teacher, Classroom } from '../../services/data.service';
import { PdfService } from '../../services/pdf.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    
    <div class="container-fluid">
      <div class="row">
        <main class="col-12 main-content">
          <div class="fade-in">
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
              <h1 class="h2">Generación de Reportes</h1>
            </div>
            
            <!-- Report Configuration -->
            <div class="row">
              <div class="col-lg-4 mb-4">
                <div class="card shadow">
                  <div class="card-header">
                    <h5 class="card-title mb-0">
                      <i class="fas fa-cog me-2"></i>Configuración del Reporte
                    </h5>
                  </div>
                  <div class="card-body">
                    <div class="mb-3">
                      <label for="reportType" class="form-label">Tipo de Reporte</label>
                      <select class="form-select" id="reportType" [(ngModel)]="reportConfig.type">
                        <option value="complete">Reporte Completo</option>
                        <option value="by-teacher">Por Docente</option>
                        <option value="by-classroom">Por Aula</option>
                        <option value="by-parallel">Por Paralelo</option>
                        <option value="conflicts">Solo Conflictos</option>
                      </select>
                    </div>
                    
                    <div class="mb-3" *ngIf="reportConfig.type === 'by-teacher'">
                      <label for="teacherSelect" class="form-label">Seleccionar Docente</label>
                      <select class="form-select" id="teacherSelect" [(ngModel)]="reportConfig.teacherId">
                        <option value="">Todos los docentes</option>
                        <option *ngFor="let teacher of teachers" [value]="teacher.id">{{ teacher.nombre }}</option>
                      </select>
                    </div>
                    
                    <div class="mb-3" *ngIf="reportConfig.type === 'by-classroom'">
                      <label for="classroomSelect" class="form-label">Seleccionar Aula</label>
                      <select class="form-select" id="classroomSelect" [(ngModel)]="reportConfig.classroomId">
                        <option value="">Todas las aulas</option>
                        <option *ngFor="let classroom of classrooms" [value]="classroom.id">{{ classroom.id }}</option>
                      </select>
                    </div>
                    
                    <div class="mb-3" *ngIf="reportConfig.type === 'by-parallel'">
                      <label for="parallelSelect" class="form-label">Seleccionar Paralelo</label>
                      <select class="form-select" id="parallelSelect" [(ngModel)]="reportConfig.parallelId">
                        <option value="">Todos los paralelos</option>
                        <option *ngFor="let parallel of uniqueParallels" [value]="parallel">{{ parallel }}</option>
                      </select>
                    </div>
                    
                    <div class="mb-3">
                      <label for="reportFormat" class="form-label">Formato</label>
                      <select class="form-select" id="reportFormat" [(ngModel)]="reportConfig.format">
                        <option value="pdf">PDF</option>
                        <option value="html">Vista HTML</option>
                      </select>
                    </div>
                    
                    <div class="mb-3">
                      <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="includeStats" [(ngModel)]="reportConfig.includeStats">
                        <label class="form-check-label" for="includeStats">
                          Incluir estadísticas
                        </label>
                      </div>
                      
                      <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="includeConflicts" [(ngModel)]="reportConfig.includeConflicts">
                        <label class="form-check-label" for="includeConflicts">
                          Incluir conflictos detectados
                        </label>
                      </div>
                    </div>
                    
                    <div class="d-grid gap-2">
                      <button class="btn btn-primary" (click)="generateReport()" [disabled]="isGenerating">
                        <span class="spinner-border spinner-border-sm me-2" *ngIf="isGenerating"></span>
                        <i class="fas fa-file-pdf me-2" *ngIf="!isGenerating"></i>
                        {{ isGenerating ? 'Generando...' : 'Generar Reporte' }}
                      </button>
                      
                      <button class="btn btn-outline-info" (click)="previewReport()">
                        <i class="fas fa-eye me-2"></i>Vista Previa
                      </button>
                    </div>
                  </div>
                </div>
                
                <!-- Quick Reports -->
                <div class="card shadow mt-4">
                  <div class="card-header">
                    <h5 class="card-title mb-0">
                      <i class="fas fa-lightning-bolt me-2"></i>Reportes Rápidos
                    </h5>
                  </div>
                  <div class="card-body">
                    <div class="d-grid gap-2">
                      <button class="btn btn-outline-primary btn-sm" (click)="generateQuickReport('daily')">
                        <i class="fas fa-calendar-day me-2"></i>Horarios del Día
                      </button>
                      <button class="btn btn-outline-success btn-sm" (click)="generateQuickReport('weekly')">
                        <i class="fas fa-calendar-week me-2"></i>Horarios Semanales
                      </button>
                      <button class="btn btn-outline-warning btn-sm" (click)="generateQuickReport('conflicts')">
                        <i class="fas fa-exclamation-triangle me-2"></i>Solo Conflictos
                      </button>
                      <button class="btn btn-outline-info btn-sm" (click)="generateQuickReport('summary')">
                        <i class="fas fa-chart-bar me-2"></i>Resumen Ejecutivo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Preview Area -->
              <div class="col-lg-8 mb-4">
                <div class="card shadow">
                  <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="card-title mb-0">
                      <i class="fas fa-eye me-2"></i>Vista Previa del Reporte
                    </h5>
                    <div class="btn-group btn-group-sm">
                      <button class="btn btn-outline-secondary" (click)="refreshPreview()">
                        <i class="fas fa-sync-alt"></i>
                      </button>
                      <button class="btn btn-outline-primary" (click)="downloadPreview()" *ngIf="showPreview">
                        <i class="fas fa-download"></i>
                      </button>
                    </div>
                  </div>
                  <div class="card-body" id="reportPreview">
                    <div *ngIf="!showPreview" class="text-center py-5 text-muted">
                      <i class="fas fa-file-alt fa-3x mb-3"></i>
                      <h5>Vista Previa del Reporte</h5>
                      <p>Configure las opciones y haga clic en "Vista Previa" para ver el reporte.</p>
                    </div>
                    
                    <div *ngIf="showPreview" class="report-content">
                      <!-- Report Header -->
                      <div class="text-center mb-4">
                        <h2>{{ reportTitle }}</h2>
                        <p class="text-muted">{{ reportSubtitle }}</p>
                        <hr>
                        <div class="row text-center">
                          <div class="col-md-4">
                            <strong>Generado por:</strong><br>
                            {{ currentUser?.name }}
                          </div>
                          <div class="col-md-4">
                            <strong>Fecha:</strong><br>
                            {{ currentDate }}
                          </div>
                          <div class="col-md-4">
                            <strong>Hora:</strong><br>
                            {{ currentTime }}
                          </div>
                        </div>
                        <hr>
                      </div>
                      
                      <!-- Statistics -->
                      <div *ngIf="reportConfig.includeStats" class="mb-4">
                        <h4>Estadísticas Generales</h4>
                        <div class="row">
                          <div class="col-md-3 mb-3">
                            <div class="card bg-primary text-white">
                              <div class="card-body text-center">
                                <h3>{{ reportData.schedules.length }}</h3>
                                <p class="mb-0">Horarios</p>
                              </div>
                            </div>
                          </div>
                          <div class="col-md-3 mb-3">
                            <div class="card bg-success text-white">
                              <div class="card-body text-center">
                                <h3>{{ getUniqueTeachersCount() }}</h3>
                                <p class="mb-0">Docentes</p>
                              </div>
                            </div>
                          </div>
                          <div class="col-md-3 mb-3">
                            <div class="card bg-info text-white">
                              <div class="card-body text-center">
                                <h3>{{ getUniqueClassroomsCount() }}</h3>
                                <p class="mb-0">Aulas</p>
                              </div>
                            </div>
                          </div>
                          <div class="col-md-3 mb-3">
                            <div class="card bg-warning text-white">
                              <div class="card-body text-center">
                                <h3>{{ reportData.conflicts.length }}</h3>
                                <p class="mb-0">Conflictos</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Schedules Table -->
                      <div class="mb-4">
                        <h4>{{ getSchedulesTableTitle() }}</h4>
                        <div class="table-responsive">
                          <table class="table table-striped table-bordered">
                            <thead class="table-dark">
                              <tr>
                                <th>Día</th>
                                <th>Horario</th>
                                <th>Aula</th>
                                <th>Docente</th>
                                <th>Paralelo</th>
                                <th>Programa</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr *ngFor="let schedule of reportData.schedules">
                                <td>{{ schedule.dia }}</td>
                                <td>{{ schedule.hora_inicio }} - {{ schedule.hora_fin }}</td>
                                <td>{{ schedule.aula }}</td>
                                <td>{{ schedule.docente }}</td>
                                <td>{{ schedule.paralelo }}</td>
                                <td>{{ schedule.programa || 'N/A' }}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      <!-- Conflicts -->
                      <div *ngIf="reportConfig.includeConflicts && reportData.conflicts.length > 0" class="mb-4">
                        <h4 class="text-danger">Conflictos Detectados</h4>
                        <div class="alert alert-danger">
                          <ul class="mb-0">
                            <li *ngFor="let conflict of reportData.conflicts">{{ conflict.message }}</li>
                          </ul>
                        </div>
                      </div>
                      
                      <!-- Footer -->
                      <div class="text-center mt-5 pt-4 border-top">
                        <small class="text-muted">
                          Sistema de Distribución de Carga Horaria - 
                          Generado el {{ currentDate }} a las {{ currentTime }}
                        </small>
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
export class ReportsComponent implements OnInit {
  reportConfig = {
    type: 'complete',
    teacherId: '',
    classroomId: '',
    parallelId: '',
    format: 'pdf',
    includeStats: true,
    includeConflicts: true
  };

  teachers: Teacher[] = [];
  classrooms: Classroom[] = [];
  uniqueParallels: string[] = [];
  schedules: Schedule[] = [];
  
  reportData = {
    schedules: [] as Schedule[],
    conflicts: [] as any[]
  };
  
  showPreview = false;
  isGenerating = false;
  reportTitle = '';
  reportSubtitle = '';
  currentUser: any;
  currentDate = '';
  currentTime = '';

  constructor(
    private dataService: DataService,
    private pdfService: PdfService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.currentUser = this.authService.getCurrentUser();
    this.updateDateTime();
  }

  private loadData(): void {
    this.dataService.getTeachers().subscribe({
      next: (teachers) => {
      this.teachers = teachers;
      },
      error: (error) => {
        console.error('Error loading teachers:', error);
        this.teachers = [];
      }
    });

    this.dataService.getClassrooms().subscribe({
      next: (classrooms) => {
      this.classrooms = classrooms;
      },
      error: (error) => {
        console.error('Error loading classrooms:', error);
        this.classrooms = [];
      }
    });

    this.dataService.getSchedules().subscribe({
      next: (schedules) => {
      this.schedules = schedules;
      this.uniqueParallels = [...new Set(schedules.map(s => s.paralelo))];
      },
      error: (error) => {
        console.error('Error loading schedules:', error);
        this.schedules = [];
        this.uniqueParallels = [];
      }
    });
  }

  private updateDateTime(): void {
    const now = new Date();
    this.currentDate = now.toLocaleDateString('es-ES');
    this.currentTime = now.toLocaleTimeString('es-ES');
  }

  previewReport(): void {
    this.updateDateTime();
    this.prepareReportData();
    this.showPreview = true;
  }

  generateReport(): void {
    this.isGenerating = true;
    this.updateDateTime();
    this.prepareReportData();

    setTimeout(() => {
      if (this.reportConfig.format === 'pdf') {
        this.pdfService.generateSchedulePDF(this.reportData.schedules, this.reportTitle);
      } else {
        // For HTML format, just show the preview
        this.showPreview = true;
      }
      this.isGenerating = false;
    }, 2000);
  }

  generateQuickReport(type: string): void {
    switch (type) {
      case 'daily':
        this.reportConfig.type = 'complete';
        this.reportTitle = 'Horarios Diarios';
        break;
      case 'weekly':
        this.reportConfig.type = 'complete';
        this.reportTitle = 'Horarios Semanales';
        break;
      case 'conflicts':
        this.reportConfig.type = 'conflicts';
        this.reportTitle = 'Reporte de Conflictos';
        break;
      case 'summary':
        this.reportConfig.type = 'complete';
        this.reportConfig.includeStats = true;
        this.reportTitle = 'Resumen Ejecutivo';
        break;
    }
    
    this.generateReport();
  }

  refreshPreview(): void {
    if (this.showPreview) {
      this.previewReport();
    }
  }

  downloadPreview(): void {
    this.pdfService.generateReportFromElement('reportPreview', this.reportTitle);
  }

  private prepareReportData(): void {
    let filteredSchedules = [...this.schedules];

    // Apply filters based on report type
    switch (this.reportConfig.type) {
      case 'by-teacher':
        if (this.reportConfig.teacherId) {
          const selectedTeacher = this.teachers.find(t => t.id.toString() === this.reportConfig.teacherId);
          if (selectedTeacher) {
            filteredSchedules = filteredSchedules.filter(s => s.docente === selectedTeacher.nombre);
            this.reportTitle = `Horarios de ${selectedTeacher.nombre}`;
          }
        } else {
          this.reportTitle = 'Horarios por Docente';
        }
        break;
        
      case 'by-classroom':
        if (this.reportConfig.classroomId) {
          filteredSchedules = filteredSchedules.filter(s => s.aula === this.reportConfig.classroomId);
          this.reportTitle = `Horarios del Aula ${this.reportConfig.classroomId}`;
        } else {
          this.reportTitle = 'Horarios por Aula';
        }
        break;
        
      case 'by-parallel':
        if (this.reportConfig.parallelId) {
          filteredSchedules = filteredSchedules.filter(s => s.paralelo === this.reportConfig.parallelId);
          this.reportTitle = `Horarios del Paralelo ${this.reportConfig.parallelId}`;
        } else {
          this.reportTitle = 'Horarios por Paralelo';
        }
        break;
        
      case 'conflicts':
        this.reportTitle = 'Reporte de Conflictos';
        // For conflicts report, we might want to highlight conflicted schedules
        break;
        
      default:
        this.reportTitle = 'Reporte Completo de Horarios';
    }

    this.reportSubtitle = `Sistema de Distribución de Carga Horaria`;
    this.reportData.schedules = filteredSchedules;

    // Load conflicts if needed
    if (this.reportConfig.includeConflicts) {
      this.dataService.detectConflicts().subscribe(conflicts => {
        this.reportData.conflicts = conflicts;
      });
    }
  }

  getSchedulesTableTitle(): string {
    switch (this.reportConfig.type) {
      case 'by-teacher':
        return 'Horarios del Docente';
      case 'by-classroom':
        return 'Ocupación del Aula';
      case 'by-parallel':
        return 'Horarios del Paralelo';
      default:
        return 'Horarios Programados';
    }
  }

  getUniqueTeachersCount(): number {
    return new Set(this.reportData.schedules.map(s => s.docente)).size;
  }

  getUniqueClassroomsCount(): number {
    return new Set(this.reportData.schedules.map(s => s.aula)).size;
  }
}
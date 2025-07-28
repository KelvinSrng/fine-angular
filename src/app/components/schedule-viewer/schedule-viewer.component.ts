import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../login/shared/navbar/navbar.component';
import { DataService, Schedule, Teacher, Classroom } from '../../services/data.service';
import { PdfService } from '../../services/pdf.service';
import { ApiService } from '../../services/api.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-schedule-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>

    <div class="container-fluid">
      <div class="row">
        <main class="col-12 main-content">
          <div class="fade-in">
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
              <div>
                <h1 class="h2">Visualización de Horarios</h1>
                <div class="alert alert-info mt-2" *ngIf="allSchedules.length > 0">
                  <i class="fas fa-info-circle me-2"></i>
                  <strong *ngIf="isShowingAssignments">Mostrando asignaciones reales</strong>
                  <strong *ngIf="!isShowingAssignments">Mostrando componentes generados</strong>
                  <span class="ms-2">({{ allSchedules.length }} horarios)</span>
                </div>
              </div>
              <div class="btn-toolbar mb-2 mb-md-0">
                <button class="btn btn-success me-2" (click)="exportToPDF()" [disabled]="filteredSchedules.length === 0">
                  <i class="fas fa-file-pdf me-2"></i>Exportar PDF
                </button>
                <button class="btn btn-primary me-2" (click)="refreshData()">
                  <i class="fas fa-sync-alt me-2"></i>Actualizar
                </button>
                <button class="btn btn-info" (click)="refreshDataFromAssignments()">
                  <i class="fas fa-calendar-check me-2"></i>Cargar Asignaciones
                </button>
              </div>
            </div>
            
            <!-- Loading State -->
            <div class="text-center py-4" *ngIf="isLoading">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
              </div>
              <p class="mt-2">Cargando horarios desde la base de datos...</p>
            </div>
            
            <!-- Filters -->
            <div class="card shadow mb-4" *ngIf="!isLoading">
              <div class="card-header">
                <h5 class="card-title mb-0">Filtros de Búsqueda</h5>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-3 mb-3">
                    <label for="docenteFilter" class="form-label">Filtrar por Docente</label>
                    <select class="form-select" id="docenteFilter" [(ngModel)]="filters.docente" (change)="applyFilters()">
                      <option value="">Todos los docentes</option>
                      <option *ngFor="let docente of uniqueDocentes" [value]="docente">{{ docente }}</option>
                    </select>
                  </div>

                  <div class="col-md-3 mb-3">
                    <label for="aulaFilter" class="form-label">Filtrar por Aula</label>
                    <select class="form-select" id="aulaFilter" [(ngModel)]="filters.aula" (change)="applyFilters()">
                      <option value="">Todas las aulas</option>
                      <option *ngFor="let aula of uniqueAulas" [value]="aula">{{ aula }}</option>
                    </select>
                  </div>
                  
                  <div class="col-md-3 mb-3">
                    <label for="paraleloFilter" class="form-label">Filtrar por Paralelo</label>
                    <select class="form-select" id="paraleloFilter" [(ngModel)]="filters.paralelo" (change)="applyFilters()">
                      <option value="">Todos los paralelos</option>
                      <option *ngFor="let paralelo of uniqueParalelos" [value]="paralelo">{{ paralelo }}</option>
                    </select>
                  </div>
                  
                  <div class="col-md-3 mb-3">
                    <label for="diaFilter" class="form-label">Filtrar por Día</label>
                    <select class="form-select" id="diaFilter" [(ngModel)]="filters.dia" (change)="applyFilters()">
                      <option value="">Todos los días</option>
                      <option *ngFor="let dia of weekDays" [value]="dia">{{ dia }}</option>
                    </select>
                  </div>
                </div>
                
                <div class="row">
                  <div class="col-md-3 mb-3">
                    <label for="registrosPorPagina" class="form-label">Registros por página:</label>
                    <select id="registrosPorPagina" class="form-select" [(ngModel)]="registrosPorPagina" (change)="cambiarPagina(1)">
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                  <div class="col-md-9 d-flex align-items-end">
                    <button class="btn btn-secondary me-2" (click)="clearFilters()">
                      <i class="fas fa-times me-2"></i>Limpiar Filtros
                    </button>
                    <span class="text-muted ms-2" *ngIf="filteredSchedules.length > 0">
                      Mostrando {{ (paginaActual - 1) * registrosPorPagina + 1 }} - 
                      {{ Math.min(paginaActual * registrosPorPagina, filteredSchedules.length) }} 
                      de {{ filteredSchedules.length }} horarios
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Mensaje cuando no hay filtros aplicados -->
            <div class="card shadow" *ngIf="!isLoading && filteredSchedules.length === 0 && allSchedules.length > 0">
              <div class="card-body text-center py-5">
                <i class="fas fa-filter fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">No hay horarios mostrados</h5>
                <p class="text-muted">Utiliza los filtros de arriba para ver los horarios disponibles.</p>
                <div class="mt-3">
                  <button class="btn btn-primary" (click)="showAllSchedules()">
                    <i class="fas fa-eye me-2"></i>Ver todos los horarios
                  </button>
                </div>
              </div>
            </div>

            <!-- Mensaje cuando no hay datos cargados -->
            <div class="card shadow" *ngIf="!isLoading && allSchedules.length === 0">
              <div class="card-body text-center py-5">
                <i class="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">No hay horarios disponibles</h5>
                <p class="text-muted">No se encontraron horarios en la base de datos.</p>
                <div class="mt-3">
                  <button class="btn btn-primary" (click)="refreshData()">
                    <i class="fas fa-sync-alt me-2"></i>Recargar datos
                  </button>
                </div>
              </div>
            </div>

            <!-- Schedule Table -->
            <div class="card shadow" id="scheduleTable" *ngIf="!isLoading && schedulesPaginados.length > 0">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="fas fa-calendar-alt me-2"></i>Horarios Programados
                </h5>
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-striped table-hover">
                    <thead class="table-dark">
                      <tr>
                        <th (click)="sortBy('dia')" style="cursor: pointer;">
                          Día
                          <i class="fas fa-sort ms-1" *ngIf="sortColumn !== 'dia'"></i>
                          <i class="fas fa-sort-up ms-1" *ngIf="sortColumn === 'dia' && sortDirection === 'asc'"></i>
                          <i class="fas fa-sort-down ms-1" *ngIf="sortColumn === 'dia' && sortDirection === 'desc'"></i>
                        </th>
                        <th (click)="sortBy('hora_inicio')" style="cursor: pointer;">
                          Horario
                          <i class="fas fa-sort ms-1" *ngIf="sortColumn !== 'hora_inicio'"></i>
                          <i class="fas fa-sort-up ms-1" *ngIf="sortColumn === 'hora_inicio' && sortDirection === 'asc'"></i>
                          <i class="fas fa-sort-down ms-1" *ngIf="sortColumn === 'hora_inicio' && sortDirection === 'desc'"></i>
                        </th>
                        <th (click)="sortBy('aula')" style="cursor: pointer;">
                          Aula
                          <i class="fas fa-sort ms-1" *ngIf="sortColumn !== 'aula'"></i>
                          <i class="fas fa-sort-up ms-1" *ngIf="sortColumn === 'aula' && sortDirection === 'asc'"></i>
                          <i class="fas fa-sort-down ms-1" *ngIf="sortColumn === 'aula' && sortDirection === 'desc'"></i>
                        </th>
                        <th (click)="sortBy('docente')" style="cursor: pointer;">
                          Docente
                          <i class="fas fa-sort ms-1" *ngIf="sortColumn !== 'docente'"></i>
                          <i class="fas fa-sort-up ms-1" *ngIf="sortColumn === 'docente' && sortDirection === 'asc'"></i>
                          <i class="fas fa-sort-down ms-1" *ngIf="sortColumn === 'docente' && sortDirection === 'desc'"></i>
                        </th>
                        <th (click)="sortBy('paralelo')" style="cursor: pointer;">
                          Paralelo
                          <i class="fas fa-sort ms-1" *ngIf="sortColumn !== 'paralelo'"></i>
                          <i class="fas fa-sort-up ms-1" *ngIf="sortColumn === 'paralelo' && sortDirection === 'asc'"></i>
                          <i class="fas fa-sort-down ms-1" *ngIf="sortColumn === 'paralelo' && sortDirection === 'desc'"></i>
                        </th>
                        <th>Componente</th>
                        <th>Modalidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let schedule of schedulesPaginados">
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
                        <td>
                          <span class="badge" [class]="getModalityBadgeClass(schedule.modalidad)">
                            {{ schedule.modalidad || 'N/A' }}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Paginación -->
            <nav *ngIf="totalPaginas > 1" class="d-flex justify-content-center mt-3">
              <ul class="pagination">
                <li class="page-item" [class.disabled]="paginaActual === 1">
                  <a class="page-link" (click)="cambiarPagina(paginaActual - 1)" style="cursor: pointer;">Anterior</a>
                </li>
                <li class="page-item" *ngFor="let pagina of obtenerPaginas()" [class.active]="pagina === paginaActual">
                  <a class="page-link" (click)="cambiarPagina(pagina)" style="cursor: pointer;">{{ pagina }}</a>
                </li>
                <li class="page-item" [class.disabled]="paginaActual === totalPaginas">
                  <a class="page-link" (click)="cambiarPagina(paginaActual + 1)" style="cursor: pointer;">Siguiente</a>
                </li>
              </ul>
            </nav>
            
            <!-- Schedule Calendar View -->
            <div class="card shadow mt-4" *ngIf="!isLoading && filteredSchedules.length > 0">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="fas fa-calendar me-2"></i>Vista de Calendario Semanal
                </h5>
              </div>
              <div class="card-body">
                <!-- Color Legend -->
                <div class="mb-3">
                  <h6>Leyenda de Componentes:</h6>
                  <div class="d-flex flex-wrap gap-2">
                    <span *ngFor="let componente of uniqueComponentes" 
                          class="badge text-white px-3 py-2"
                          [style.background-color]="getComponentColor(componente)">
                      {{ componente }}
                    </span>
                  </div>
                </div>
                
                <div class="table-responsive">
                  <table class="table table-bordered">
                    <thead class="table-dark">
                      <tr>
                        <th style="width: 100px;">Hora</th>
                        <th *ngFor="let day of weekDays">{{ day }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let hour of timeSlots">
                        <td class="fw-bold text-center bg-light">{{ hour }}</td>
                        <td *ngFor="let day of weekDays"
                            [ngStyle]="getTdStyle(day, hour)"
                            style="min-height: 80px; vertical-align: top;">
                          <span [innerHTML]="getScheduleForSlot(day, hour)"></span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Mensaje cuando no hay datos -->
            <div class="card shadow mt-4" *ngIf="!isLoading && filteredSchedules.length === 0 && allSchedules.length === 0">
              <div class="card-body text-center py-5">
                <i class="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">No hay horarios disponibles</h5>
                <p class="text-muted">No se encontraron horarios en la base de datos.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  `
})
export class ScheduleViewerComponent implements OnInit {
  allSchedules: Schedule[] = [];
  filteredSchedules: Schedule[] = [];
  teachers: Teacher[] = [];
  classrooms: Classroom[] = [];
  uniqueParalelos: string[] = [];
  uniqueComponentes: string[] = [];
  uniqueAulas: string[] = [];
  uniqueDocentes: string[] = [];
  componentColors: Map<string, string> = new Map();
    isLoading = true;
  isShowingAssignments = false;

  filters = {
    aula: '',
    docente: '',
    paralelo: '',
    dia: '',
    componente: ''
  };
  
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

  // Paginación
  paginaActual: number = 1;
  registrosPorPagina: number = 10;
  schedulesPaginados: Schedule[] = [];
  Math = Math;

  // Agregar propiedades para el archivo de asignaciones


  constructor(
    private dataService: DataService,
    private pdfService: PdfService,
    private apiService: ApiService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    console.log('=== ngOnInit() INICIADO ===');
    this.loadData();
  }

  private loadData(): void {
    console.log('=== LLAMANDO loadData() ===');
    this.isLoading = true;
    
    // Cargar datos auxiliares (docentes, aulas) primero
    this.loadAuxiliaryData();
    
    // Intentar cargar horarios desde asignaciones primero
    this.dataService.getSchedulesFromAssignments().subscribe({
      next: (schedules: Schedule[]) => {
        console.log('=== loadData() - Schedules recibidos ===');
        console.log('Total schedules en loadData():', schedules.length);
        const docentesUnicos = [...new Set(schedules.map((s: Schedule) => s.docente))];
        console.log('Docentes únicos en loadData():', docentesUnicos);
        console.log('Total docentes en loadData():', docentesUnicos.length);
        this.processSchedules(schedules);
      },
      error: (error: any) => {
        console.error('Error loading schedules:', error);
        this.isLoading = false;
      }
    });
  }

  private loadSchedulesFromComponents(): void {
    this.dataService.getSchedulesWithDetails().subscribe({
      next: (schedules) => {
        this.processSchedules(schedules);
      },
      error: (error) => {
        console.error('Error loading schedules:', error);
        this.processSchedules([]);
      }
    });
  }

  private processSchedules(schedules: Schedule[]): void {
    console.log('=== PROCESANDO HORARIOS EN COMPONENTE ===');
    console.log('Total schedules recibidos:', schedules.length);
    
    // Mostrar docentes únicos en los horarios
    const docentesUnicos = [...new Set(schedules.map(s => s.docente))];
    console.log('Docentes únicos en horarios:', docentesUnicos);
    console.log('Total de docentes únicos:', docentesUnicos.length);
    
    // Mostrar algunos ejemplos de horarios
    if (schedules.length > 0) {
      console.log('Ejemplos de horarios:');
      schedules.slice(0, 3).forEach((schedule, index) => {
        console.log(`${index + 1}. ${schedule.docente} - ${schedule.dia} ${schedule.hora_inicio}-${schedule.hora_fin}`);
      });
    }
    
    this.allSchedules = schedules;
    this.filteredSchedules = []; // NO mostrar datos al inicio - solo cuando se aplique un filtro
    this.updateAvailableOptions(schedules);
    
    this.isLoading = false;
    
    // Actualizar paginación inicial
    this.paginaActual = 1;
    this.actualizarPaginacion();
    
    console.log('=== FIN DE PROCESAMIENTO ===');
  }

  private loadAuxiliaryData(): void {
    console.log('Iniciando carga de datos auxiliares...');
    
    // Cargar docentes directamente del API
    this.dataService.getDocentes().subscribe({
      next: (docentes) => {
        console.log('Docentes recibidos del API:', docentes);
        this.uniqueDocentes = docentes.map(d => d.nombres).filter((nombre): nombre is string => !!nombre);
        this.teachers = this.uniqueDocentes.map(nombre => ({ 
          id: 0, 
          nombre, 
          disponibilidad: [], 
          grupos: 0, 
          tipo_contrato: '', 
          modalidad: '' 
        }));
        console.log('Todos los docentes cargados:', this.uniqueDocentes);
        console.log('Total de docentes únicos:', this.uniqueDocentes.length);
      },
      error: (error) => {
        console.error('Error loading docentes:', error);
        this.uniqueDocentes = [];
      }
    });

    // Cargar aulas
    this.dataService.getClassrooms().subscribe({
      next: (classrooms) => {
        this.classrooms = classrooms;
        console.log('Classrooms loaded:', classrooms);
      },
      error: (error) => {
        console.error('Error loading classrooms:', error);
      }
    });
  }

  private generateComponentColors(): void {
    // Paleta de colores vibrantes y contrastantes
    const colors = [
      '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
      '#911eb4', '#46f0f0', '#f032e6', '#bcf60c', '#fabebe',
      '#008080', '#e6beff', '#9a6324', '#fffac8', '#800000',
      '#aaffc3', '#808000', '#ffd8b1', '#000075', '#808080',
      '#ffffff', '#000000', '#ff4500', '#00ced1', '#ff69b4',
      '#7cfc00', '#ff6347', '#4682b4', '#daa520', '#40e0d0',
      '#b22222', '#228b22', '#8a2be2', '#ffb6c1', '#20b2aa',
      '#ff00ff', '#adff2f', '#f0e68c', '#00fa9a', '#ff1493'
    ];
    this.uniqueComponentes.forEach((componente, index) => {
      this.componentColors.set(componente, colors[index % colors.length]);
    });
  }

  getComponentColor(programaParalelo: string): string {
    return this.componentColors.get(programaParalelo) || '#6c757d';
  }

  getComponentColorLight(programa: string): string {
    const color = this.getComponentColor(programa);
    return color + '20'; // Agregar transparencia
  }

  refreshData(): void {
    this.dataService.refreshData();
    setTimeout(() => {
      this.loadData();
    }, 1000); // Dar tiempo para que se actualicen los datos
  }

  refreshDataFromAssignments(): void {
    console.log('=== LLAMANDO refreshDataFromAssignments() ===');
    this.isLoading = true;
    console.log('Refrescando datos desde asignaciones...');
    
    // Cargar datos auxiliares primero
    this.loadAuxiliaryData();
    
    // Forzar carga desde asignaciones
    this.dataService.getSchedulesFromAssignments().subscribe({
      next: (schedules: Schedule[]) => {
        console.log('=== refreshDataFromAssignments() - Schedules recibidos ===');
        console.log('Total schedules en refreshDataFromAssignments():', schedules.length);
        const docentesUnicos = [...new Set(schedules.map((s: Schedule) => s.docente))];
        console.log('Docentes únicos en refreshDataFromAssignments():', docentesUnicos);
        console.log('Total docentes en refreshDataFromAssignments():', docentesUnicos.length);
        this.processSchedules(schedules);
      },
      error: (error: any) => {
        console.error('Error refreshing schedules:', error);
        this.isLoading = false;
      }
    });
  }

  // Ajustar filtros para que funcionen solo sobre las asignaciones reales
  applyFilters(): void {
    const normalize = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    
    // Verificar si hay algún filtro activo
    const hayFiltrosActivos = this.filters.docente || this.filters.aula || this.filters.paralelo || this.filters.dia || this.filters.componente;
    
    if (!hayFiltrosActivos) {
      // Si no hay filtros activos, NO mostrar ningún horario
      this.filteredSchedules = [];
      this.paginaActual = 1;
      this.actualizarPaginacion();
      return;
    }
    
    // Aplicar filtros y actualizar opciones disponibles dinámicamente
    let currentFiltered = this.allSchedules;
    
    // Aplicar filtro de docente primero
    if (this.filters.docente) {
      currentFiltered = currentFiltered.filter(schedule => 
        normalize(schedule.docente) === normalize(this.filters.docente)
      );
      // Actualizar opciones de aula y paralelo basadas en el docente seleccionado
      this.updateAvailableOptionsForFilters(currentFiltered);
    } else {
      // Si no hay filtro de docente, usar todas las opciones
      this.updateAvailableOptionsForFilters(this.allSchedules);
    }
    
    // Aplicar filtro de aula (si existe)
    if (this.filters.aula) {
      currentFiltered = currentFiltered.filter(schedule => 
        normalize(schedule.aula) === normalize(this.filters.aula)
      );
      // Actualizar opciones de paralelo basadas en docente + aula
      this.updateAvailableOptionsForFilters(currentFiltered);
    }
    
    // Aplicar filtro de paralelo (si existe)
    if (this.filters.paralelo) {
      currentFiltered = currentFiltered.filter(schedule => 
        schedule.paralelo === this.filters.paralelo
      );
    }
    
    // Aplicar filtros restantes
    this.filteredSchedules = currentFiltered.filter(schedule => {
      return (!this.filters.dia || normalize(schedule.dia) === normalize(this.filters.dia)) &&
             (!this.filters.componente || schedule.programa === this.filters.componente);
    });
    
    // Actualizar paginación
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  private updateAvailableOptions(schedules: Schedule[]): void {
    // Actualizar paralelos disponibles
    this.uniqueParalelos = [...new Set(schedules.map(s => s.paralelo).filter((p): p is string => p !== undefined && p !== null && p.trim() !== ''))];
    // Actualizar componentes disponibles como nombre+paralelo
    this.uniqueComponentes = [...new Set(schedules.map(s => `${s.programa} ${s.paralelo}`.trim()).filter((p): p is string => p !== undefined && p !== null && p.trim() !== ''))];
    // Actualizar aulas únicas SOLO de las asignaciones reales
    this.uniqueAulas = [...new Set(schedules.map(s => s.aula).filter((a): a is string => !!a))];
    
    // Los docentes ya se cargan en loadAuxiliaryData, no es necesario cargarlos aquí de nuevo
    
    // Actualizar aulas disponibles SOLO de las asignaciones reales
    this.classrooms = this.uniqueAulas.map(numero => ({ id: numero, numero, ubicacion: '', capacidad: 0 }));
  }

  private updateAvailableOptionsForFilters(schedules: Schedule[]): void {
    // Actualizar opciones de filtro basadas en los datos filtrados actualmente
    this.uniqueParalelos = [...new Set(schedules.map(s => s.paralelo).filter((p): p is string => p !== undefined && p !== null && p.trim() !== ''))];
    this.uniqueAulas = [...new Set(schedules.map(s => s.aula).filter((a): a is string => !!a))];
    this.uniqueComponentes = [...new Set(schedules.map(s => `${s.programa} ${s.paralelo}`.trim()).filter((p): p is string => p !== undefined && p !== null && p.trim() !== ''))];
    
    // NO actualizar uniqueDocentes aquí para mantener todos los docentes disponibles
    // Los docentes se mantienen desde updateAvailableOptions
  }

  clearFilters(): void {
    this.filters = { aula: '', docente: '', paralelo: '', dia: '', componente: '' };
    // NO mostrar horarios cuando se limpien los filtros
    this.filteredSchedules = [];
    this.paginaActual = 1;
    this.actualizarPaginacion();
    // Restaurar todas las opciones disponibles
    this.updateAvailableOptions(this.allSchedules);
  }

  showAllSchedules(): void {
    // Mostrar todos los horarios cuando el usuario haga clic en el botón
    this.filteredSchedules = [...this.allSchedules];
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  // Métodos de paginación
  cambiarPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.actualizarPaginacion();
    }
  }

  obtenerPaginas(): number[] {
    const paginas: number[] = [];
    const inicio = Math.max(1, this.paginaActual - 2);
    const fin = Math.min(this.totalPaginas, this.paginaActual + 2);
    
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    
    return paginas;
  }

  get totalPaginas(): number {
    return Math.ceil(this.filteredSchedules.length / this.registrosPorPagina);
  }

  actualizarPaginacion(): void {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;
    this.schedulesPaginados = this.filteredSchedules.slice(inicio, fin);
  }

  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredSchedules.sort((a, b) => {
      const aValue = (a as any)[column];
      const bValue = (b as any)[column];
      
      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  getScheduleForSlot(day: string, hour: string): SafeHtml {
    const normalize = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    
    /* Debug: solo para Lunes en horarios específicos
    if (day === 'Lunes' && (hour === '15:00' || hour === '16:00' || hour === '18:00')) {
      console.log(`=== DEBUG getScheduleForSlot: ${day} ${hour} ===`);
      console.log('filteredSchedules length:', this.filteredSchedules.length);
      console.log('filteredSchedules:', this.filteredSchedules);
    } */
    
    const schedules = this.filteredSchedules.filter(s => {
      if (normalize(s.dia) !== normalize(day)) return false;
      const slotMinutes = this.timeToMinutes(hour);
      const startMinutes = this.timeToMinutes(s.hora_inicio);
      const endMinutes = this.timeToMinutes(s.hora_fin);
      const matches = slotMinutes >= startMinutes && slotMinutes < endMinutes;
      
      // Debug: solo para Lunes en horarios específicos
      if (day === 'Lunes' && (hour === '15:00' || hour === '16:00' || hour === '18:00')) {
        console.log(`Horario ${s.hora_inicio}-${s.hora_fin}: slot=${slotMinutes}, start=${startMinutes}, end=${endMinutes}, matches=${matches}`);
      }
      
      return matches;
    });
    if (schedules.length > 0) {
      let html = '';
      schedules.forEach(schedule => {
        const color = '#1E3250';
        html += `
          <div class="schedule-slot" style="background-color: ${color}; color: #fff; border-radius: 8px; margin-bottom: 8px; padding: 10px 8px; font-size: 1rem; font-weight: 500; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-left: 8px solid #16213a; min-width: 120px; max-width: 220px; word-break: break-word;">
            <div style="font-size: 1.1em; font-weight: bold; margin-bottom: 2px;">${schedule.paralelo}</div>
            <div style="font-size: 0.95em; margin-bottom: 2px;">${schedule.programa || 'N/A'}</div>
            <div style="font-size: 0.9em; margin-bottom: 2px;">${schedule.docente}</div>
            <div style="font-size: 0.9em; margin-bottom: 2px;">Aula: ${schedule.aula}</div>
            <div style="font-size: 0.9em;">${schedule.hora_inicio} - ${schedule.hora_fin}</div>
          </div>
        `;
      });
      return this.sanitizer.bypassSecurityTrustHtml(html);
    }
    return this.sanitizer.bypassSecurityTrustHtml('<div class="schedule-slot-empty" style="min-height: 60px;">&nbsp;</div>');
  }

  private shadeColor(color: string, percent: number): string {
    let R = parseInt(color.substring(1,3),16);
    let G = parseInt(color.substring(3,5),16);
    let B = parseInt(color.substring(5,7),16);
    R = Math.min(255, Math.max(0, R + percent));
    G = Math.min(255, Math.max(0, G + percent));
    B = Math.min(255, Math.max(0, B + percent));
    const rHex = R.toString(16).padStart(2, '0');
    const gHex = G.toString(16).padStart(2, '0');
    const bHex = B.toString(16).padStart(2, '0');
    return `#${rHex}${gHex}${bHex}`;
  }

  getScheduleForSlotOld(day: string, hour: string): string {
    const schedule = this.filteredSchedules.find(s => 
      s.dia === day && s.hora_inicio === hour
    );
    
    if (schedule) {
      const color = this.getComponentColor(schedule.programa || '');
      return `
        <div class="schedule-slot text-white p-2 rounded mb-1" 
             style="font-size: 0.8rem; background-color: ${color};">
          <div class="fw-bold">${schedule.paralelo}</div>
          <div>${schedule.programa || 'N/A'}</div>
          <div><small>${schedule.docente}</small></div>
          <div><small>Aula: ${schedule.aula}</small></div>
        </div>
      `;
    }
    
    return '<div class="schedule-slot-empty" style="min-height: 60px;">&nbsp;</div>';
  }

  getModalityBadgeClass(modalidad?: string): string {
    switch (modalidad?.toLowerCase()) {
      case 'presencial':
        return 'bg-success';
      case 'virtual':
        return 'bg-info';
      case 'hibrida':
        return 'bg-warning';
      default:
        return 'bg-secondary';
    }
  }

  exportToPDF(): void {
    if (this.filteredSchedules.length > 0) {
      this.pdfService.generateSchedulePDF(this.filteredSchedules, 'Horarios_Programados');
    }
  }





  // Método público para refrescar desde otros componentes
  public refreshFromAssignments(): void {
    this.refreshDataFromAssignments();
  }

  getTdStyle(day: string, hour: string): any {
    const schedules = this.filteredSchedules.filter(s => {
      if (s.dia !== day) return false;
      const slotMinutes = this.timeToMinutes(hour);
      const startMinutes = this.timeToMinutes(s.hora_inicio);
      const endMinutes = this.timeToMinutes(s.hora_fin);
      return slotMinutes >= startMinutes && slotMinutes < endMinutes;
    });
    if (schedules.length > 0) {
      // Solo toma el color del primer bloque (o podrías hacer un gradiente si hay varios)
      const colorKey = `${schedules[0].programa} ${schedules[0].paralelo}`.trim();
      const color = this.getComponentColor(colorKey);
      return {
        'background-color': color,
        'color': '#fff'
      };
    }
    return {};
  }
}
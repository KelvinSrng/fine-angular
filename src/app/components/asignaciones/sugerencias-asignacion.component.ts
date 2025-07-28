import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../login/shared/navbar/navbar.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ApiService } from '../../services/api.service';
import { Asignacion, SugerenciaAsignacion, Docente, Componente } from '../../models/api.models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sugerencias-asignacion',
  standalone: true,
  imports: [CommonModule, HttpClientModule, NavbarComponent, FormsModule],
  template: `
    <app-navbar></app-navbar>
    <div class="container mt-4">
      <h2>Sugerencias de Asignación</h2>
      
      <!-- Filtros -->
      <div class="row mb-3">
        <div class="col-md-3">
          <label for="filtroDocente" class="form-label">Filtrar por Docente:</label>
          <select id="filtroDocente" class="form-select" [(ngModel)]="filtroDocente" (change)="aplicarFiltros()">
            <option value="">Todos los docentes</option>
            <option *ngFor="let docente of docentesUnicos" [value]="docente">{{ docente }}</option>
          </select>
        </div>
        <div class="col-md-3">
          <label for="filtroComponente" class="form-label">Filtrar por Componente:</label>
          <select id="filtroComponente" class="form-select" [(ngModel)]="filtroComponente" (change)="aplicarFiltros()">
            <option value="">Todos los componentes</option>
            <option *ngFor="let componente of componentesUnicos" [value]="componente">{{ componente }}</option>
          </select>
        </div>
        <div class="col-md-3">
          <label for="registrosPorPagina" class="form-label">Registros por página:</label>
          <select id="registrosPorPagina" class="form-select" [(ngModel)]="registrosPorPagina" (change)="cambiarPagina(1)">
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
        <div class="col-md-3 d-flex align-items-end">
          <button class="btn btn-secondary" (click)="limpiarFiltros()">Limpiar Filtros</button>
        </div>
      </div>

      <!-- Información de paginación -->
      <div class="row mb-2">
        <div class="col-md-6">
          <small class="text-muted">
            Mostrando {{ (paginaActual - 1) * registrosPorPagina + 1 }} - 
            {{ Math.min(paginaActual * registrosPorPagina, sugerenciasFiltradas.length) }} 
            de {{ sugerenciasFiltradas.length }} sugerencias
          </small>
        </div>
      </div>

      <!-- Tabla de Sugerencias -->
      <table class="table table-bordered table-striped">
        <thead>
          <tr>
            <th>Docente</th>
            <th>Componente</th>
            <th>Modalidad</th>
            <th>Horario</th>
            <th>Aula</th>
            <th>Día</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let sug of sugerenciasPaginadas">
            <td>{{ sug.docente }}</td>
            <td>{{ sug.componente }}</td>
            <td>{{ sug.modalidad }}</td>
            <td>{{ sug.horario }}</td>
            <td>{{ sug.aula }}</td>
            <td>{{ sug.dia }}</td>
            <td>
              <button class="btn btn-success btn-sm" (click)="asignar(sug)">Asignar</button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Paginación -->
      <nav *ngIf="totalPaginas > 1">
        <ul class="pagination justify-content-center">
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

      <h2 class="mt-5">Asignaciones Actuales</h2>
      
      <!-- Filtros para Asignaciones Actuales -->
      <div class="row mb-3">
        <div class="col-md-3">
          <label for="filtroAsignacionDocente" class="form-label">Filtrar por Docente:</label>
          <select id="filtroAsignacionDocente" class="form-select" [(ngModel)]="filtroAsignacionDocente" (change)="aplicarFiltrosAsignaciones()">
            <option value="">Todos los docentes</option>
            <option *ngFor="let docente of docentesAsignacionesUnicos" [value]="docente">{{ docente }}</option>
          </select>
        </div>
        <div class="col-md-3">
          <label for="filtroAsignacionComponente" class="form-label">Filtrar por Componente:</label>
          <select id="filtroAsignacionComponente" class="form-select" [(ngModel)]="filtroAsignacionComponente" (change)="aplicarFiltrosAsignaciones()">
            <option value="">Todos los componentes</option>
            <option *ngFor="let componente of componentesAsignacionesUnicos" [value]="componente">{{ componente }}</option>
          </select>
        </div>
        <div class="col-md-3 d-flex align-items-end">
          <button class="btn btn-secondary" (click)="limpiarFiltrosAsignaciones()">Limpiar Filtros</button>
        </div>
      </div>

      <table class="table table-bordered table-striped">
        <thead>
          <tr>
            <th>Docente</th>
            <th>Componente</th>
            <th>Modalidad</th>
            <th>Horario</th>
            <th>Aula</th>
            <th>Día</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let asignacion of asignacionesFiltradas">
            <td>{{ asignacion.docente?.nombres || '-' }}</td>
            <td>{{ asignacion.componente?.nombre || '-' }} ({{ asignacion.componente?.paralelo || '-' }})</td>
            <td>{{ asignacion.modalidad }}</td>
            <td>{{ asignacion.horario }}</td>
            <td>{{ asignacion.componente?.aula?.numero || '-' }}</td>
            <td>{{ asignacion.dia }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `
})
export class SugerenciasAsignacionComponent implements OnInit {
  sugerencias: SugerenciaAsignacion[] = [];
  asignaciones: Asignacion[] = [];
  
  // Propiedades para filtros de sugerencias
  filtroDocente: string = '';
  filtroComponente: string = '';
  sugerenciasFiltradas: SugerenciaAsignacion[] = [];
  docentesUnicos: string[] = [];
  componentesUnicos: string[] = [];
  
  // Propiedades para paginación
  paginaActual: number = 1;
  registrosPorPagina: number = 10;
  sugerenciasPaginadas: SugerenciaAsignacion[] = [];
  
  // Propiedades para filtros de asignaciones
  filtroAsignacionDocente: string = '';
  filtroAsignacionComponente: string = '';
  asignacionesFiltradas: Asignacion[] = [];
  docentesAsignacionesUnicos: string[] = [];
  componentesAsignacionesUnicos: string[] = [];

  // Propiedad para usar Math en el template
  Math = Math;

  constructor(private http: HttpClient, private api: ApiService) {}

  ngOnInit(): void {
    this.cargarSugerencias();
    this.cargarAsignaciones();
  }

  cargarSugerencias() {
    this.api.getSugerencias().subscribe(sugs => {
      this.sugerencias = sugs;
      this.actualizarFiltrosSugerencias();
      this.aplicarFiltros();
    });
  }

  cargarAsignaciones() {
    this.api.getAsignaciones().subscribe(asigs => {
      this.asignaciones = asigs;
      this.actualizarFiltrosAsignaciones();
      this.aplicarFiltrosAsignaciones();
    });
  }

  actualizarFiltrosSugerencias() {
    this.docentesUnicos = [...new Set(this.sugerencias.map(s => s.docente))].sort();
    this.componentesUnicos = [...new Set(this.sugerencias.map(s => s.componente))].sort();
  }

  actualizarFiltrosAsignaciones() {
    this.docentesAsignacionesUnicos = [...new Set(this.asignaciones.map(a => a.docente?.nombres).filter((n): n is string => !!n))].sort();
    this.componentesAsignacionesUnicos = [...new Set(this.asignaciones.map(a => a.componente?.nombre).filter((n): n is string => !!n))].sort();
  }

  aplicarFiltros() {
    this.sugerenciasFiltradas = this.sugerencias.filter(sug => {
      const cumpleDocente = !this.filtroDocente || sug.docente === this.filtroDocente;
      const cumpleComponente = !this.filtroComponente || sug.componente === this.filtroComponente;
      return cumpleDocente && cumpleComponente;
    });
    this.paginaActual = 1;
    this.actualizarPaginacion();
  }

  aplicarFiltrosAsignaciones() {
    this.asignacionesFiltradas = this.asignaciones.filter(asig => {
      const cumpleDocente = !this.filtroAsignacionDocente || asig.docente?.nombres === this.filtroAsignacionDocente;
      const cumpleComponente = !this.filtroAsignacionComponente || asig.componente?.nombre === this.filtroAsignacionComponente;
      return cumpleDocente && cumpleComponente;
    });
  }

  limpiarFiltros() {
    this.filtroDocente = '';
    this.filtroComponente = '';
    this.aplicarFiltros();
  }

  limpiarFiltrosAsignaciones() {
    this.filtroAsignacionDocente = '';
    this.filtroAsignacionComponente = '';
    this.aplicarFiltrosAsignaciones();
  }

  actualizarPaginacion() {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;
    this.sugerenciasPaginadas = this.sugerenciasFiltradas.slice(inicio, fin);
  }

  cambiarPagina(pagina: number) {
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
    return Math.ceil(this.sugerenciasFiltradas.length / this.registrosPorPagina);
  }

  asignar(sug: SugerenciaAsignacion) {
    this.api.getDocentes().subscribe(docentes => {
      const docente = docentes.find(d => d.nombres === sug.docente);
      this.api.getComponentes().subscribe(componentes => {
        const componente = componentes.find(c => c.nombre === sug.componente);
        if (!docente || !componente) {
          alert('No se encontró el docente o componente');
          return;
        }
        this.api.createAsignacion({
          docente_id: docente.id,
          componente_id: componente.id,
          dia: sug.dia,
          horario: sug.horario,
          modalidad: sug.modalidad
        }).subscribe({
          next: () => {
            alert('Asignación creada');
            this.cargarSugerencias();
            this.cargarAsignaciones();
          },
          error: err => {
            alert('Error al asignar: ' + (err.error?.error || ''));
          }
        });
      });
    });
  }
} 
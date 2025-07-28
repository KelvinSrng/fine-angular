import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../login/shared/navbar/navbar.component';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Asignacion, Docente, Componente } from '../../models/api.models';

@Component({
  selector: 'app-asignaciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="container mt-4">
      <h2>Gestión de Asignaciones</h2>
      <form [formGroup]="asignacionForm" (ngSubmit)="crearAsignacion()" class="mb-4">
        <div class="row g-2">
          <div class="col-md-3">
            <label class="form-label">Docente</label>
            <select class="form-select" formControlName="docente_id">
              <option value="">Seleccione...</option>
              <option *ngFor="let docente of docentes" [value]="docente.id">{{ docente.nombres }}</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Componente</label>
            <select class="form-select" formControlName="componente_id">
              <option value="">Seleccione...</option>
              <option *ngFor="let comp of componentes" [value]="comp.id">{{ comp.nombre }} ({{ comp.paralelo }})</option>
            </select>
          </div>
          <div class="col-md-2">
            <label class="form-label">Día</label>
            <input type="text" class="form-control" formControlName="dia" placeholder="Ej: lunes" />
          </div>
          <div class="col-md-2">
            <label class="form-label">Horario</label>
            <input type="text" class="form-control" formControlName="horario" placeholder="HH:MM - HH:MM" />
          </div>
          <div class="col-md-2">
            <label class="form-label">Modalidad</label>
            <input type="text" class="form-control" formControlName="modalidad" placeholder="presencial" />
          </div>
        </div>
        <button class="btn btn-primary mt-3" type="submit" [disabled]="asignacionForm.invalid">Crear Asignación</button>
      </form>

      <h4>Asignaciones Actuales</h4>
      <table class="table table-bordered table-striped">
        <thead>
          <tr>
            <th>Docente</th>
            <th>Componente</th>
            <th>Día</th>
            <th>Horario</th>
            <th>Modalidad</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let asignacion of asignaciones">
            <td>{{ asignacion.docente?.nombres || '-' }}</td>
            <td>{{ asignacion.componente?.nombre || '-' }} ({{ asignacion.componente?.paralelo || '-' }})</td>
            <td>{{ asignacion.dia }}</td>
            <td>{{ asignacion.horario }}</td>
            <td>{{ asignacion.modalidad }}</td>
            <td>
              <button class="btn btn-danger btn-sm" (click)="eliminarAsignacion(asignacion.id)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  `
})
export class AsignacionesComponent implements OnInit {
  asignaciones: Asignacion[] = [];
  docentes: Docente[] = [];
  componentes: Componente[] = [];
  asignacionForm: FormGroup;

  constructor(private api: ApiService, private fb: FormBuilder) {
    this.asignacionForm = this.fb.group({
      docente_id: ['', Validators.required],
      componente_id: ['', Validators.required],
      dia: ['', Validators.required],
      horario: ['', [Validators.required, Validators.pattern(/^\d{2}:\d{2} - \d{2}:\d{2}$/)]],
      modalidad: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos() {
    this.api.getAsignaciones().subscribe(a => this.asignaciones = a);
    this.api.getDocentes().subscribe(d => this.docentes = d);
    this.api.getComponentes().subscribe(c => this.componentes = c);
  }

  crearAsignacion() {
    if (this.asignacionForm.invalid) return;
    this.api.createAsignacion(this.asignacionForm.value).subscribe({
      next: () => {
        alert('Asignación creada');
        this.asignacionForm.reset();
        this.cargarDatos();
      },
      error: err => {
        alert('Error al crear asignación: ' + (err.error?.error || '')); // muestra mensaje del backend
      }
    });
  }

  eliminarAsignacion(id: number) {
    if (!confirm('¿Eliminar esta asignación?')) return;
    this.api.deleteAsignacion(id).subscribe({
      next: () => {
        this.cargarDatos();
      },
      error: () => {
        alert('Error al eliminar asignación');
      }
    });
  }
} 
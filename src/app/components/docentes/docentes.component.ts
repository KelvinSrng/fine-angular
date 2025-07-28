import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { Docente } from '../../models/api.models';
import { Observable } from 'rxjs';
import { NavbarComponent } from '../login/shared/navbar/navbar.component';

@Component({
  selector: 'app-docentes',
  templateUrl: './docentes.component.html',
  styleUrls: ['./docentes.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NavbarComponent]
})
export class DocentesComponent implements OnInit {
  docentes: Docente[] = [];
  docenteForm: FormGroup;
  isEditing = false;
  editingId: number | null = null;
  loading = false;
  errorMessage = '';
  successMessage = '';

  // Paginación
  paginaActual = 1;
  registrosPorPagina = 10;
  totalDocentes = 0;

  // Filtros
  filtros = {
    nombres: '',
    tipo_contrato: '',
    modalidad: ''
  };

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder
  ) {
    this.docenteForm = this.fb.group({
      nombres: ['', [Validators.required, Validators.minLength(3)]],
      tipo_contrato: ['ocasional', Validators.required],
      modalidad: ['presencial', Validators.required],
      otra_empleadora: [false],
      horas_contrato: [0, [Validators.min(0)]],
      horarios_lunes_viernes: [''],
      horarios_sabado: [''],
      programas: ['']
    });
  }

  ngOnInit(): void {
    this.cargarDocentes();
  }

  cargarDocentes(): void {
    this.loading = true;
    this.apiService.getDocentes().subscribe({
      next: (docentes) => {
        this.docentes = docentes;
        this.totalDocentes = docentes.length;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error cargando docentes:', error);
        this.errorMessage = 'Error al cargar los docentes';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.docenteForm.valid) {
      this.loading = true;
      const docenteData = this.docenteForm.value;

      if (this.isEditing && this.editingId) {
        // Actualizar docente existente
        this.apiService.updateDocente(this.editingId, docenteData).subscribe({
          next: () => {
            this.successMessage = 'Docente actualizado correctamente';
            this.resetForm();
            this.cargarDocentes();
          },
          error: (error: any) => {
            console.error('Error actualizando docente:', error);
            this.errorMessage = 'Error al actualizar el docente';
            this.loading = false;
          }
        });
      } else {
        // Crear nuevo docente
        this.apiService.createDocente(docenteData).subscribe({
          next: () => {
            this.successMessage = 'Docente creado correctamente';
            this.resetForm();
            this.cargarDocentes();
          },
          error: (error: any) => {
            console.error('Error creando docente:', error);
            this.errorMessage = 'Error al crear el docente';
            this.loading = false;
          }
        });
      }
    }
  }

  editarDocente(docente: Docente): void {
    this.isEditing = true;
    this.editingId = docente.id;
    this.docenteForm.patchValue({
      nombres: docente.nombres,
      tipo_contrato: docente.tipo_contrato,
      modalidad: docente.modalidad,
      otra_empleadora: docente.otra_empleadora,
      horas_contrato: docente.horas_contrato || 0,
      horarios_lunes_viernes: docente.horarios_lunes_viernes || '',
      horarios_sabado: docente.horarios_sabado || '',
      programas: docente.programas || ''
    });
  }

  eliminarDocente(id: number): void {
    if (confirm('¿Estás seguro de que quieres eliminar este docente?')) {
      this.loading = true;
      this.apiService.deleteDocente(id).subscribe({
        next: () => {
          this.successMessage = 'Docente eliminado correctamente';
          this.cargarDocentes();
        },
        error: (error: any) => {
          console.error('Error eliminando docente:', error);
          this.errorMessage = 'Error al eliminar el docente';
          this.loading = false;
        }
      });
    }
  }

  resetForm(): void {
    this.isEditing = false;
    this.editingId = null;
    this.docenteForm.reset({
      tipo_contrato: 'ocasional',
      modalidad: 'presencial',
      otra_empleadora: false,
      horas_contrato: 0
    });
    this.loading = false;
  }

  cancelarEdicion(): void {
    this.resetForm();
  }

  // Métodos de paginación
  get docentesPaginados(): Docente[] {
    const inicio = (this.paginaActual - 1) * this.registrosPorPagina;
    const fin = inicio + this.registrosPorPagina;
    return this.docentesFiltrados.slice(inicio, fin);
  }

  cambiarPagina(pagina: number): void {
    this.paginaActual = pagina;
  }

  obtenerPaginas(): number[] {
    const totalPaginas = Math.ceil(this.totalDocentesFiltrados / this.registrosPorPagina);
    const paginas: number[] = [];
    
    for (let i = 1; i <= totalPaginas; i++) {
      paginas.push(i);
    }
    
    return paginas;
  }

  // Métodos de filtrado
  aplicarFiltros(): void {
    this.paginaActual = 1;
  }

  limpiarFiltros(): void {
    this.filtros = {
      nombres: '',
      tipo_contrato: '',
      modalidad: ''
    };
    this.paginaActual = 1;
  }

  // Método para filtrar docentes
  get docentesFiltrados(): Docente[] {
    return this.docentes.filter(docente => {
      const cumpleNombres = !this.filtros.nombres || 
        docente.nombres.toLowerCase().includes(this.filtros.nombres.toLowerCase());
      
      const cumpleTipoContrato = !this.filtros.tipo_contrato || 
        docente.tipo_contrato === this.filtros.tipo_contrato;
      
      const cumpleModalidad = !this.filtros.modalidad || 
        docente.modalidad === this.filtros.modalidad;
      
      return cumpleNombres && cumpleTipoContrato && cumpleModalidad;
    });
  }

  // Getter para el total de docentes filtrados
  get totalDocentesFiltrados(): number {
    return this.docentesFiltrados.length;
  }

  // Métodos de utilidad
  getTipoContratoLabel(tipo: string): string {
    return tipo === 'ocasional' ? 'Ocasional' : 'Contratado';
  }

  getModalidadLabel(modalidad: string): string {
    return modalidad === 'presencial' ? 'Presencial' : 'Virtual';
  }

  // Propiedad para usar Math en el template
  get Math() {
    return Math;
  }
} 
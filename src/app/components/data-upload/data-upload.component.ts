import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavbarComponent } from '../login/shared/navbar/navbar.component';
import { ApiService } from '../../services/api.service';
import { DataService } from '../../services/data.service';

interface SelectedFiles {
  docentes: File | null;
  aulas: File | null;
  componentes: File | null;
}

interface ImportResult {
  success: boolean;
  message: string;
  imported_count?: number;
  errors?: string[];
  failed_rows?: any[];
}
@Component({
  selector: 'app-data-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    
    <div class="container-fluid">
      <div class="row">
        <main class="col-12 main-content">
          <div class="fade-in">
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
              <h1 class="h2">Carga de Datos</h1>
            </div>
            
            <!-- Upload Forms -->
            <div class="row">
              <!-- Docentes Upload -->
              <div class="col-lg-6 mb-4">
                <div class="card shadow">
                  <div class="card-header">
                    <h5 class="card-title mb-0">
                      <i class="fas fa-users me-2"></i>Cargar Docentes
                    </h5>
                  </div>
                  <div class="card-body">
                    <div class="mb-3">
                      <label for="docentesFile" class="form-label">Archivo Excel de Docentes</label>
                      <input 
                        type="file" 
                        class="form-control" 
                        id="docentesFile"
                        accept=".xlsx,.xls"
                        (change)="onFileSelected($event, 'docentes')"
                      >
                      <div class="form-text">Formato esperado: Nombres, Tipo Contrato, Modalidad, etc.</div>
                    </div>
                    
                    <div class="alert alert-info" *ngIf="selectedFiles.docentes">
                      <i class="fas fa-info-circle me-2"></i>
                      Archivo seleccionado: <strong>{{ selectedFiles.docentes.name }}</strong>
                    </div>
                    
                    <button 
                      class="btn btn-primary"
                      [disabled]="!selectedFiles.docentes || isUploading"
                      (click)="uploadData('docentes')"
                    >
                      <span class="spinner-border spinner-border-sm me-2" *ngIf="isUploading"></span>
                      <i class="fas fa-upload me-2" *ngIf="!isUploading"></i>
                      Cargar Docentes
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Aulas Upload -->
              <div class="col-lg-6 mb-4">
                <div class="card shadow">
                  <div class="card-header">
                    <h5 class="card-title mb-0">
                      <i class="fas fa-building me-2"></i>Cargar Aulas
                    </h5>
                  </div>
                  <div class="card-body">
                    <div class="mb-3">
                      <label for="aulasFile" class="form-label">Archivo Excel de Aulas</label>
                      <input 
                        type="file" 
                        class="form-control" 
                        id="aulasFile"
                        accept=".xlsx,.xls,.csv"
                        (change)="onFileSelected($event, 'aulas')"
                      >
                      <div class="form-text">Formato esperado: Número, Piso, Capacidad, Tipo</div>
                    </div>
                    
                    <div class="alert alert-info" *ngIf="selectedFiles.aulas">
                      <i class="fas fa-info-circle me-2"></i>
                      Archivo seleccionado: <strong>{{ selectedFiles.aulas.name }}</strong>
                    </div>
                    
                    <button 
                      class="btn btn-primary"
                      [disabled]="!selectedFiles.aulas || isUploading"
                      (click)="uploadData('aulas')"
                    >
                      <span class="spinner-border spinner-border-sm me-2" *ngIf="isUploading"></span>
                      <i class="fas fa-upload me-2" *ngIf="!isUploading"></i>
                      Cargar Aulas
                    </button>
                  </div>
                </div>
              </div>
              
              <!-- Componentes Upload -->
              <div class="col-lg-6 mb-4">
                <div class="card shadow">
                  <div class="card-header">
                    <h5 class="card-title mb-0">
                      <i class="fas fa-book me-2"></i>Cargar Componentes
                    </h5>
                  </div>
                  <div class="card-body">
                    <div class="mb-3">
                      <label for="componentesFile" class="form-label">Archivo Excel de Componentes</label>
                      <input 
                        type="file" 
                        class="form-control" 
                        id="componentesFile"
                        accept=".xlsx,.xls,.csv"
                        (change)="onFileSelected($event, 'componentes')"
                      >
                      <div class="form-text">Formato esperado: Nombre, Edad Mínima, Edad Máxima, Paralelo</div>
                    </div>
                    
                    <div class="alert alert-info" *ngIf="selectedFiles.componentes">
                      <i class="fas fa-info-circle me-2"></i>
                      Archivo seleccionado: <strong>{{ selectedFiles.componentes.name }}</strong>
                    </div>
                    
                    <button 
                      class="btn btn-primary"
                      [disabled]="!selectedFiles.componentes || isUploading"
                      (click)="uploadData('componentes')"
                    >
                      <span class="spinner-border spinner-border-sm me-2" *ngIf="isUploading"></span>
                      <i class="fas fa-upload me-2" *ngIf="!isUploading"></i>
                      Cargar Componentes
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Upload Progress -->
            <div class="card shadow mt-4" *ngIf="isUploading">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="fas fa-spinner fa-spin me-2"></i>Procesando Archivo...
                </h5>
              </div>
              <div class="card-body">
                <div class="text-center">
                  <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">Cargando...</span>
                  </div>
                  <p>El archivo se está procesando y guardando en la base de datos...</p>
                </div>
              </div>
            </div>
            
            <!-- Success/Error Messages -->
            <div class="alert alert-success alert-dismissible fade show mt-3" *ngIf="successMessage">
              <i class="fas fa-check-circle me-2"></i>{{ successMessage }}
              <button type="button" class="btn-close" (click)="clearMessages()"></button>
            </div>
            
            <div class="alert alert-danger alert-dismissible fade show mt-3" *ngIf="errorMessage">
              <i class="fas fa-exclamation-circle me-2"></i>{{ errorMessage }}
              <button type="button" class="btn-close" (click)="clearMessages()"></button>
            </div>
            
            <!-- Import Results -->
            <div class="card shadow mt-4" *ngIf="lastImportResult">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="fas fa-chart-bar me-2"></i>Resultado de la Importación
                </h5>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-4 mb-3">
                    <div class="card bg-light">
                      <div class="card-body text-center">
                        <h4 class="text-success">{{ lastImportResult.imported_count || 0 }}</h4>
                        <p class="mb-0">Registros Importados</p>
                      </div>
                    </div>
                  </div>
                  
                  <div class="col-md-4 mb-3">
                    <div class="card bg-light">
                      <div class="card-body text-center">
                        <h4 class="text-warning">{{ lastImportResult.errors?.length || 0 }}</h4>
                        <p class="mb-0">Errores</p>
                      </div>
                    </div>
                  </div>
                  
                  <div class="col-md-4 mb-3">
                    <div class="card bg-light">
                      <div class="card-body text-center">
                        <h4 class="text-info">{{ lastImportResult.failed_rows?.length || 0 }}</h4>
                        <p class="mb-0">Filas Fallidas</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="alert alert-warning mt-3" *ngIf="lastImportResult.errors && lastImportResult.errors.length > 0">
                  <h6 class="alert-heading">Errores encontrados:</h6>
                  <ul class="mb-0">
                    <li *ngFor="let error of lastImportResult.errors">{{ error }}</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <!-- Instructions -->
            <div class="card shadow mt-4">
              <div class="card-header">
                <h5 class="card-title mb-0">
                  <i class="fas fa-info-circle me-2"></i>Instrucciones de Uso
                </h5>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-4">
                    <h6><i class="fas fa-users me-2 text-primary"></i>Docentes</h6>
                    <ul class="small">
                      <li>Nombres (requerido)</li>
                      <li>Tipo Contrato (ocasional/contratado)</li>
                      <li>Modalidad</li>
                      <li>Horas Contrato</li>
                      <li>Horarios Lunes-Viernes</li>
                      <li>Horarios Sábado</li>
                    </ul>
                  </div>
                  
                  <div class="col-md-4">
                    <h6><i class="fas fa-building me-2 text-success"></i>Aulas</h6>
                    <ul class="small">
                      <li>Número (requerido)</li>
                      <li>Ubicación</li>
                      <li>Capacidad</li>
                    </ul>
                  </div>
                  
                  <div class="col-md-4">
                    <h6><i class="fas fa-book me-2 text-info"></i>Componentes</h6>
                    <ul class="small">
                      <li>Nombre (requerido)</li>
                      <li>Paralelo</li>
                      <li>Aula ID</li>
                      <li>Horario</li>
                      <li>Modalidad</li>
                      <li>Capacidad Ofertada</li>
                    </ul>
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
export class DataUploadComponent {
  selectedFiles: SelectedFiles = {
    docentes: null,
    aulas: null,
    componentes: null
  };
  
  isUploading = false;
  successMessage = '';
  errorMessage = '';
  lastImportResult: ImportResult | null = null;

  constructor(
    private apiService: ApiService,
    private dataService: DataService
  ) {}

  onFileSelected(event: any, type: keyof SelectedFiles): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFiles[type] = file;
      this.clearMessages();
    }
  }

  uploadData(type: keyof SelectedFiles): void {
    const file = this.selectedFiles[type];
    if (!file) return;

    this.isUploading = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.lastImportResult = null;

    let uploadObservable;
    
    switch (type) {
      case 'docentes':
        uploadObservable = this.apiService.importDocentes(file);
        break;
      case 'aulas':
        uploadObservable = this.apiService.importAulas(file);
        break;
      case 'componentes':
        uploadObservable = this.apiService.importComponentes(file);
        break;
      default:
        this.isUploading = false;
        this.errorMessage = 'Tipo de archivo no válido.';
        return;
    }

    uploadObservable.subscribe({
      next: (result: ImportResult) => {
        this.isUploading = false;
        this.lastImportResult = result;
        
        if (result.success) {
          this.successMessage = `${this.getTypeLabel(type)} cargados exitosamente. ${result.imported_count || 0} registros importados.`;
          
          // Limpiar el archivo seleccionado
          this.selectedFiles[type] = null;
          const fileInput = document.getElementById(`${type}File`) as HTMLInputElement;
          if (fileInput) fileInput.value = '';
          
          // Refrescar los datos en el sistema
          this.dataService.refreshData();
        } else {
          this.errorMessage = result.message || `Error al cargar ${this.getTypeLabel(type).toLowerCase()}.`;
        }
      },
      error: (error: any) => {
        this.isUploading = false;
        this.errorMessage = error.message || `Error al cargar ${this.getTypeLabel(type).toLowerCase()}.`;
        console.error('Upload error:', error);
      }
    });
  }

  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  private getTypeLabel(type: keyof SelectedFiles): string {
    const labels: Record<keyof SelectedFiles, string> = {
      docentes: 'Docentes',
      aulas: 'Aulas',
      componentes: 'Componentes'
    };
    return labels[type];
  }
}
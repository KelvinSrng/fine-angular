import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { Componente, Aula, Asignacion, SugerenciaAsignacion, ImportResult, Docente } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private httpService: HttpService) {}

  // COMPONENTES
  getComponentes(): Observable<Componente[]> {
    return this.httpService.get<Componente[]>('/componentes');
  }

  createComponente(componente: Partial<Componente>): Observable<Componente> {
    return this.httpService.post<Componente>('/componentes', componente);
  }

  updateComponente(id: number, componente: Partial<Componente>): Observable<Componente> {
    return this.httpService.put<Componente>(`/componentes/${id}`, componente);
  }

  // AULAS
  getAulas(): Observable<Aula[]> {
    return this.httpService.get<Aula[]>('/aulas');
  }

  createAula(aula: Partial<Aula>): Observable<Aula> {
    return this.httpService.post<Aula>('/aulas', aula);
  }

  updateAula(id: number, aula: Partial<Aula>): Observable<Aula> {
    return this.httpService.put<Aula>(`/aulas/${id}`, aula);
  }

  // ASIGNACIONES
  getAsignaciones(): Observable<Asignacion[]> {
    return this.httpService.get<Asignacion[]>('/asignaciones');
  }


  createAsignacion(asignacion: Partial<Asignacion>): Observable<Asignacion> {
    return this.httpService.post<Asignacion>('/asignaciones', asignacion);
  }


  deleteAsignacion(id: number): Observable<void> {
    return this.httpService.delete<void>(`/asignaciones/${id}`);
  }

  // IMPORTACIONES
  importarAulas(file: File): Observable<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.httpService.uploadFile<ImportResult>('/importar/aulas', formData);
  }

  importAulas(file: File): Observable<ImportResult> {
    const formData = new FormData();
    formData.append('archivo', file);
    return this.httpService.uploadFile<ImportResult>('/importar/aulas', formData);
  }

  importComponentes(file: File): Observable<ImportResult> {
    const formData = new FormData();
    formData.append('archivo', file);
    return this.httpService.uploadFile<ImportResult>('/importar/componentes', formData);
  }
  importDocentes(file: File): Observable<ImportResult> {
    const formData = new FormData();
    formData.append('archivo', file);
    return this.httpService.uploadFile<ImportResult>('/importar/docentes', formData);
  }

  importarAsignaciones(file: File): Observable<ImportResult> {
    const formData = new FormData();
    formData.append('archivo', file);
    return this.httpService.uploadFile<ImportResult>('/importar/asignaciones', formData);
  }

  // DOCENTES
  getDocentes(): Observable<Docente[]> {
    return this.httpService.get<Docente[]>('/docentes');
  }

  createDocente(docente: Partial<Docente>): Observable<Docente> {
    return this.httpService.post<Docente>('/docentes', docente);
  }

  updateDocente(id: number, docente: Partial<Docente>): Observable<Docente> {
    return this.httpService.put<Docente>(`/docentes/${id}`, docente);
  }

  deleteDocente(id: number): Observable<void> {
    return this.httpService.delete<void>(`/docentes/${id}`);
  }

  // SUGERENCIAS
  getSugerencias(): Observable<SugerenciaAsignacion[]> {
    return this.httpService.get<SugerenciaAsignacion[]>('/asignaciones/sugerencias');
  }
}
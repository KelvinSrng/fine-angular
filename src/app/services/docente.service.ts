import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http.service';
import { Docente } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class DocenteService {
  constructor(private httpService: HttpService) {}

  getDocentes(): Observable<Docente[]> {
    return this.httpService.get<Docente[]>('/docentes');
  }

  createDocente(docente: Partial<Docente>): Observable<Docente> {
    return this.httpService.post<Docente>('/docentes', docente);
  }

  updateDocente(id: number, docente: Partial<Docente>): Observable<Docente> {
    return this.httpService.put<Docente>(`/docentes/${id}`, docente);
  }

  getDocente(id: number): Observable<Docente> {
    return this.httpService.get<Docente>(`/docentes/${id}`);
  }

  deleteDocente(id: number): Observable<void> {
    return this.httpService.delete<void>(`/docentes/${id}`);
  }

  importDocentes(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.httpService.uploadFile('/importar/docentes', formData);
  }
}
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private getFormHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    let headers = new HttpHeaders({
      'Accept': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ha ocurrido un error inesperado';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = error.error.message;
    } else {
      // Error del lado del servidor
      if (error.status === 401) {
        errorMessage = 'No autorizado. Por favor, inicie sesión nuevamente.';
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user');
        window.location.href = '/login';
      } else if (error.status === 403) {
        errorMessage = 'No tiene permisos para realizar esta acción.';
      } else if (error.status === 422) {
        // Errores de validación
        if (error.error.errors) {
          const validationErrors = Object.values(error.error.errors).flat();
          errorMessage = validationErrors.join(', ');
        } else {
          errorMessage = error.error.message || 'Error de validación';
        }
      } else if (error.status === 500) {
        errorMessage = 'Error interno del servidor. Contacte al administrador.';
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }
    }

    return throwError(() => new Error(errorMessage));
  }

  get<T>(endpoint: string): Observable<T> {
    return this.http.get<ApiResponse<T>>(`${this.apiUrl}${endpoint}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data || response as any),
      catchError(this.handleError)
    );
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<ApiResponse<T>>(`${this.apiUrl}${endpoint}`, data, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data || response as any),
      catchError(this.handleError)
    );
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<ApiResponse<T>>(`${this.apiUrl}${endpoint}`, data, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data || response as any),
      catchError(this.handleError)
    );
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<ApiResponse<T>>(`${this.apiUrl}${endpoint}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data || response as any),
      catchError(this.handleError)
    );
  }

  uploadFile<T>(endpoint: string, formData: FormData): Observable<T> {
    return this.http.post<ApiResponse<T>>(`${this.apiUrl}${endpoint}`, formData, {
      headers: this.getFormHeaders()
    }).pipe(
      map(response => response.data || response as any),
      catchError(this.handleError)
    );
  }
}
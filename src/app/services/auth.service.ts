import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, map, catchError, of } from 'rxjs';
import { HttpService } from './http.service';
import { User, LoginResponse } from '../models/api.models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private router: Router,
    private httpService: HttpService
  ) {
    // Verificar si el usuario ya está logueado
    const user = localStorage.getItem('current_user');
    const token = localStorage.getItem('auth_token');
    if (user && token) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  login(email: string, password: string): Observable<boolean> {
    return this.httpService.post<LoginResponse>('/login', { email, password })
      .pipe(
        tap(response => {
          // Guardar token y usuario en localStorage
          localStorage.setItem('auth_token', response.token);
          localStorage.setItem('current_user', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }),
        map(() => true),
        catchError((error: any) => {
          console.error('Login error:', error);
          return of(false);
        })
      );
  }

  logout(): void {
    // Llamar al endpoint de logout si existe
    this.httpService.post('/logout', {}).subscribe({
      next: () => {
        this.clearAuthData();
      },
      error: () => {
        // Limpiar datos locales aunque falle el logout en el servidor
        this.clearAuthData();
      }
    });
  }

  private clearAuthData(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    const user = this.currentUserSubject.value;
    return !!(token && user);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user?.rol === role;
  }

  canAccessCoordinatorFeatures(): boolean {
    return this.hasRole('coordinador_academico') || this.hasRole('rrhh');
  }
}
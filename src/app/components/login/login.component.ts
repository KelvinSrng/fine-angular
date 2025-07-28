import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container d-flex align-items-center justify-content-center">
      <div class="login-card shadow-lg" style="width: 100%; max-width: 450px;">
        <div class="card-body p-5">
          <div class="text-center mb-5">
            <i class="fas fa-book fa-3x mb-3" style="color: var(--primary-color);"></i>
            <h2 class="card-title mb-3" style="color: var(--primary-color); font-weight: 800;">Sistema de Gestión de Horarios</h2>
            <p class="text-muted">Ingrese sus credenciales para continuar</p>
          </div>
          
          <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
            <div class="mb-4">
              <label for="email" class="form-label fw-semibold">Correo Electrónico</label>
              <input
                type="email"
                class="form-control"
                id="email"
                name="email"
                [(ngModel)]="credentials.email"
                required
                email
                #emailInput="ngModel"
                [class.is-invalid]="emailInput.invalid && emailInput.touched"
                placeholder="correo@ejemplo.com"
              >
              <div class="invalid-feedback" *ngIf="emailInput.invalid && emailInput.touched">
                Por favor ingrese un correo válido
              </div>
            </div>
            
            <div class="mb-4">
              <label for="password" class="form-label fw-semibold">Contraseña</label>
              <input
                type="password"
                class="form-control"
                id="password"
                name="password"
                [(ngModel)]="credentials.password"
                required
                minlength="6"
                #passwordInput="ngModel"
                [class.is-invalid]="passwordInput.invalid && passwordInput.touched"
                placeholder="••••••"
              >
              <div class="invalid-feedback" *ngIf="passwordInput.invalid && passwordInput.touched">
                La contraseña debe tener al menos 6 caracteres
              </div>
            </div>
            
            <div class="alert alert-danger" *ngIf="errorMessage">
              <i class="fas fa-exclamation-circle me-2"></i>
              {{ errorMessage }}
            </div>
            
            <button
              type="submit"
              class="btn btn-primary w-100 py-3 mb-4"
              [disabled]="loginForm.invalid || isLoading"
            >
              <span class="spinner-border spinner-border-sm me-2" *ngIf="isLoading"></span>
              <i class="fas fa-sign-in-alt me-2" *ngIf="!isLoading"></i>
              {{ isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  credentials = {
    email: '',
    password: ''
  };
  
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.credentials.email || !this.credentials.password) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.credentials.email, this.credentials.password)
      .subscribe({
        next: (success) => {
          this.isLoading = false;
          if (success) {
            this.router.navigate(['/dashboard']);
          } else {
            this.errorMessage = 'Credenciales incorrectas o error de conexión.';
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.message || 'Error al iniciar sesión.';
          console.error('Login error:', error);
        }
      });
  }
}
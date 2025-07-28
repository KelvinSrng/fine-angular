import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (!user) {
          this.router.navigate(['/login']);
          return false;
        }

        const requiredRoles = route.data['roles'] as string[];
        
        if (!requiredRoles || requiredRoles.length === 0) {
          return true;
        }

        if (requiredRoles.includes(user.rol)) {
          return true;
        }

        // Si no tiene el rol requerido, redirigir al dashboard
        this.router.navigate(['/dashboard']);
        return false;
      })
    );
  }
} 
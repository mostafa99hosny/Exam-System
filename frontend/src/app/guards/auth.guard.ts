import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const token = this.authService.getToken();
    const requiredRoles = route.data['roles'] as string[];

    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    const userRole = JSON.parse(atob(token.split('.')[1])).user.role;
    if (requiredRoles && !requiredRoles.includes(userRole)) {
      this.router.navigate(['/login']);
      return false;
    }

    return true;
  }
}
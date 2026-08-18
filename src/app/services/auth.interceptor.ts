import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

// Adjunta el token a todas las peticiones hacia la API y centraliza el
// manejo de sesión expirada (401 -> logout + redirección al login).
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  let request = req;
  const token = authService.getToken();
  if (token && req.url.startsWith(environment.apiUrl)) {
    request = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const esLogin = req.url.includes('/users/login');
      if (error.status === 401 && !esLogin) {
        authService.logout();
        router.navigate(['/authentication/login']);
      }
      return throwError(() => error);
    })
  );
};

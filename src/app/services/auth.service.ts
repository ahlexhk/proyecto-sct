import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

const apiUrl = `${environment.apiUrl}/users`; // URL del backend

export interface SessionUser {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  cargo: string;
  rol?: 'tecnico' | 'operador';
}

interface LoginResponse {
  token: string;
  user: SessionUser;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authState = new BehaviorSubject<boolean>(this.hasValidToken());
  authState$ = this.authState.asObservable();
  private userSubject = new BehaviorSubject<any>(null);
  public user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const user = localStorage.getItem('user');
    if (user) {
      this.userSubject.next(JSON.parse(user));
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Un usuario está logueado solo si su token existe y no ha expirado.
  isLoggedIn(): boolean {
    return this.hasValidToken();
  }

  isAuthenticated(): boolean {
    const isAuth = this.hasValidToken();
    this.authState.next(isAuth);
    return isAuth;
  }

  getUser(): SessionUser | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  esTecnico(): boolean {
    return this.getUser()?.rol === 'tecnico';
  }

  register(user: any): Observable<any> {
    return this.http.post(`${apiUrl}/register`, user)
      .pipe(
        catchError(error => {
          if (error.error && error.error.error === 'El DNI ya está registrado') {
            return throwError(() => ({ error: 'El DNI ya está registrado' }));
          }
          return throwError(() => error);
        })
      );
  }

  login(credentials: { dni: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${apiUrl}/login`, credentials)
      .pipe(
        map(response => {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          this.userSubject.next(response.user);
          this.authState.next(true);
          return response;
        })
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.userSubject.next(null);
    this.authState.next(false);
  }

  // Mantenido por compatibilidad; el authInterceptor ya adjunta el token
  // automáticamente a todas las peticiones hacia la API.
  getHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  // Decodifica el payload del JWT y verifica su expiración localmente.
  private hasValidToken(): boolean {
    const token = localStorage.getItem('token');
    if (!token) {
      return false;
    }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }
}

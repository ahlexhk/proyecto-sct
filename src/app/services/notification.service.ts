import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subscription, timer } from 'rxjs';
import { switchMap, filter } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';

export interface NotificationEvent {
  id: number;
  incident_id: number;
  tipo: 'creacion' | 'comentario' | 'cambio_estado' | 'asignacion';
  estado_nuevo: string | null;
  comentario: string | null;
  created_at: string;
  titulo: string;
  prioridad: string;
  estado: string;
  autor: string;
}

interface NotificationsResponse {
  pendientes: number;
  eventos: NotificationEvent[];
  serverTime: string;
}

const POLL_INTERVAL_MS = 30_000;
const MAX_EVENTOS = 20;

// Consulta periódicamente la actividad de incidencias para avisar a los
// técnicos cuando entra una solicitud de soporte o cambia una incidencia.
@Injectable({
  providedIn: 'root'
})
export class NotificationService implements OnDestroy {
  private pendientesSubject = new BehaviorSubject<number>(0);
  pendientes$ = this.pendientesSubject.asObservable();

  private eventosSubject = new BehaviorSubject<NotificationEvent[]>([]);
  eventos$ = this.eventosSubject.asObservable();

  private noLeidosSubject = new BehaviorSubject<number>(0);
  noLeidos$ = this.noLeidosSubject.asObservable();

  private lastCheck: string | null = null;
  private pollSub: Subscription | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) { }

  // Inicia el sondeo (idempotente): lo llama el header al montarse.
  start(): void {
    if (this.pollSub) {
      return;
    }
    this.pollSub = timer(0, POLL_INTERVAL_MS).pipe(
      filter(() => this.authService.isLoggedIn()),
      switchMap(() => {
        const url = this.lastCheck
          ? `${environment.apiUrl}/incidents/notifications?since=${encodeURIComponent(this.lastCheck)}`
          : `${environment.apiUrl}/incidents/notifications`;
        return this.http.get<NotificationsResponse>(url);
      })
    ).subscribe({
      next: (res) => this.procesar(res),
      error: () => { /* silencioso: reintenta en el próximo ciclo */ }
    });
  }

  marcarLeidas(): void {
    this.noLeidosSubject.next(0);
  }

  refrescarAhora(): void {
    // Fuerza una consulta inmediata (p. ej. tras crear una incidencia)
    if (!this.authService.isLoggedIn()) {
      return;
    }
    const url = this.lastCheck
      ? `${environment.apiUrl}/incidents/notifications?since=${encodeURIComponent(this.lastCheck)}`
      : `${environment.apiUrl}/incidents/notifications`;
    this.http.get<NotificationsResponse>(url).subscribe({
      next: (res) => this.procesar(res),
      error: () => { }
    });
  }

  private procesar(res: NotificationsResponse): void {
    // Aviso al entrar: en la primera consulta de la sesión se informa
    // cuántas incidencias siguen pendientes de atención.
    if (this.lastCheck === null && res.pendientes > 0) {
      const s = res.pendientes === 1 ? '' : 's';
      this.snackBar.open(
        `Tienes ${res.pendientes} incidencia${s} de soporte pendiente${s}`,
        'Cerrar',
        { duration: 8000 }
      );
      this.noLeidosSubject.next(res.pendientes);
    }

    this.pendientesSubject.next(res.pendientes);

    if (res.eventos.length > 0) {
      const acumulados = [...res.eventos, ...this.eventosSubject.value].slice(0, MAX_EVENTOS);
      this.eventosSubject.next(acumulados);
      this.noLeidosSubject.next(this.noLeidosSubject.value + res.eventos.length);

      // Aviso inmediato cuando entra una nueva solicitud de soporte
      const nuevas = res.eventos.filter((e) => e.tipo === 'creacion');
      if (nuevas.length === 1) {
        this.snackBar.open(`Nueva incidencia: ${nuevas[0].titulo}`, 'Cerrar', { duration: 6000 });
      } else if (nuevas.length > 1) {
        this.snackBar.open(`${nuevas.length} nuevas incidencias de soporte`, 'Cerrar', { duration: 6000 });
      }
    }

    this.lastCheck = res.serverTime;
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }
}

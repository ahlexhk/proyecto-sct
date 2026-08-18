import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export type PrioridadIncidencia = 'baja' | 'media' | 'alta' | 'critica';
export type EstadoIncidencia = 'abierta' | 'en_proceso' | 'en_espera' | 'resuelta' | 'cerrada';

export interface Incident {
  id: number;
  titulo: string;
  descripcion: string;
  prioridad: PrioridadIncidencia;
  estado: EstadoIncidencia;
  solicitante: string;
  ubicacion: string;
  equipment_id: number | null;
  bienNacional: string | null;
  tipoEquipo: string | null;
  creado_por: number;
  creadoPor: string;
  asignado_a: number | null;
  asignadoA: string | null;
  created_at: string;
  updated_at: string;
  resuelto_at: string | null;
  historial?: IncidentUpdate[];
  fotos?: IncidentPhoto[];
}

export interface IncidentPhoto {
  id: number;
  original_name: string;
  url: string;
  subidaPor: string;
  created_at: string;
}

export interface IncidentUpdate {
  id: number;
  tipo: 'creacion' | 'comentario' | 'cambio_estado' | 'asignacion';
  estado_anterior: EstadoIncidencia | null;
  estado_nuevo: EstadoIncidencia | null;
  comentario: string | null;
  created_at: string;
  autor: string;
}

export interface IncidentStats {
  abiertas: number;
  enProceso: number;
  enEspera: number;
  resueltas: number;
  cerradas: number;
  criticasAbiertas: number;
  resueltasHoy: number;
  tiempoPromedioHoras: number | string | null;
}

export const ETIQUETA_ESTADO_INCIDENCIA: Record<EstadoIncidencia, string> = {
  abierta: 'Abierta',
  en_proceso: 'En proceso',
  en_espera: 'En espera',
  resuelta: 'Resuelta',
  cerrada: 'Cerrada',
};

export const ETIQUETA_PRIORIDAD: Record<PrioridadIncidencia, string> = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  critica: 'Crítica',
};

@Injectable({
  providedIn: 'root'
})
export class IncidentService {
  private apiUrl = `${environment.apiUrl}/incidents`;

  constructor(private http: HttpClient) { }

  createIncident(incident: {
    titulo: string;
    descripcion: string;
    prioridad: string;
    solicitante: string;
    ubicacion: string;
    bienNacional?: string | null;
  }): Observable<any> {
    return this.http.post(this.apiUrl, incident);
  }

  getIncidents(filtros: { estado?: string; prioridad?: string; asignado?: 'me' } = {}): Observable<Incident[]> {
    let params = new HttpParams();
    if (filtros.estado) params = params.set('estado', filtros.estado);
    if (filtros.prioridad) params = params.set('prioridad', filtros.prioridad);
    if (filtros.asignado) params = params.set('asignado', filtros.asignado);
    return this.http.get<Incident[]>(this.apiUrl, { params });
  }

  getIncident(id: number): Observable<Incident> {
    return this.http.get<Incident>(`${this.apiUrl}/${id}`);
  }

  getStats(): Observable<IncidentStats> {
    return this.http.get<IncidentStats>(`${this.apiUrl}/stats`);
  }

  updateIncident(id: number, cambios: {
    estado?: string;
    prioridad?: string;
    asignarme?: boolean;
    comentario?: string;
  }): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, cambios);
  }

  uploadPhotos(id: number, fotos: File[]): Observable<any> {
    const formData = new FormData();
    for (const foto of fotos) {
      formData.append('fotos', foto);
    }
    return this.http.post(`${this.apiUrl}/${id}/photos`, formData);
  }
}

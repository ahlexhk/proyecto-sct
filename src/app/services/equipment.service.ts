import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface Equipment {
  id: number;
  bienNacional: string;
  tipoEquipo: string;
  numeroSerie: string;
  estado: 'operativo' | 'reparacion' | 'inoperativo';
  ubicacion: string;
  asignacion: string;
  caracteristicas: string;
  ultimoMotivo?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class EquipmentService {
  private apiUrl = `${environment.apiUrl}/equipments`; // URL del backend

  constructor(private http: HttpClient) { }

  addEquipment(equipment: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/add`, equipment).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 400 && error.error?.error) {
          return throwError(() => new Error(error.error.error));
        }
        return throwError(() => new Error('Ocurrió un error al agregar el equipo'));
      })
    );
  }

  // Buscar un equipo por Bien Nacional
  getEquipmentByBienNacional(bienNacional: string): Observable<Equipment> {
    const params = new HttpParams().set('bienNacional', bienNacional.trim());
    return this.http.get<Equipment>(`${this.apiUrl}/search`, { params }).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          return throwError(() => new Error('Equipo no encontrado.'));
        } else if (error.status === 0) {
          return throwError(() => new Error('No se pudo conectar al servidor.'));
        }
        return throwError(() => new Error('Error al buscar el equipo.'));
      })
    );
  }

  // El backend obtiene el usuario desde el token; no hace falta enviarlo.
  updateEquipmentStatus(id: number, changes: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/status`, changes);
  }
}

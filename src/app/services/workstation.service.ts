import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface WorkstationEquipment {
  id: number;
  bienNacional: string;
  tipoEquipo: string;
  estado: 'operativo' | 'reparacion' | 'inoperativo';
}

export interface Workstation {
  id: number;
  nombre: string;
  ubicacion: string;
  responsable: string;
  descripcion: string | null;
  created_at: string;
  updated_at: string;
  equipos: WorkstationEquipment[];
}

@Injectable({
  providedIn: 'root'
})
export class WorkstationService {
  private apiUrl = `${environment.apiUrl}/workstations`;

  constructor(private http: HttpClient) { }

  getWorkstations(): Observable<Workstation[]> {
    return this.http.get<Workstation[]>(this.apiUrl);
  }

  createWorkstation(puesto: { nombre: string; ubicacion: string; responsable: string; descripcion?: string | null }): Observable<any> {
    return this.http.post(this.apiUrl, puesto);
  }

  deleteWorkstation(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  linkEquipment(id: number, bienNacional: string, mover = false): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/equipments`, { bienNacional, mover });
  }

  unlinkEquipment(id: number, equipmentId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}/equipments/${equipmentId}`);
  }
}

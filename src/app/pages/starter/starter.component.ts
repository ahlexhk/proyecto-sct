import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MaterialModule } from '../../material.module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Equipment, EquipmentHistory, EquipmentService } from '../../services/equipment.service';
import {
  ETIQUETA_ESTADO_INCIDENCIA,
  ETIQUETA_PRIORIDAD,
  Incident,
  IncidentService,
  IncidentStats,
} from '../../services/incident.service';
import { AuthService } from '../../services/auth.service';

const ETIQUETAS: Record<string, string> = {
  reubicacion: 'Reubicación',
  reparacion: 'Reparación',
  reasignacion: 'Reasignación',
  entrega: 'Entrega',
  esperaEntrega: 'Espera por Entrega',
  esperaPieza: 'Espera por Pieza',
  desincorporacion: 'Desincorporación',
  inoperativo: 'Inoperativo',
  operativo: 'Operativo',
};

@Component({
  selector: 'app-starter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MaterialModule,
  ],
  templateUrl: './starter.component.html',
  styleUrls: ['./starter.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class StarterComponent implements OnInit {
  // Búsqueda de equipos
  bienNacional: string = '';
  equipoEncontrado: Equipment | null = null;
  error: string = '';
  buscando = false;

  // Hoja de vida del equipo (solo con sesión)
  historial: EquipmentHistory | null = null;
  cargandoHistorial = false;

  // Panel de soporte (solo con sesión)
  stats: IncidentStats | null = null;
  pendientes: Incident[] = [];
  cargandoSoporte = false;

  etiquetaEstadoIncidencia: Record<string, string> = ETIQUETA_ESTADO_INCIDENCIA;
  etiquetaPrioridad: Record<string, string> = ETIQUETA_PRIORIDAD;

  constructor(
    private equipmentService: EquipmentService,
    private incidentService: IncidentService,
    public authService: AuthService
  ) { }

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.cargarPanelSoporte();
    }
  }

  cargarPanelSoporte(): void {
    this.cargandoSoporte = true;
    this.incidentService.getStats().subscribe({
      next: (stats) => (this.stats = stats),
      error: () => { },
    });
    this.incidentService.getIncidents().subscribe({
      next: (incidents) => {
        this.cargandoSoporte = false;
        // Las pendientes primero (el backend ya ordena por estado y prioridad)
        this.pendientes = incidents
          .filter((i) => i.estado !== 'resuelta' && i.estado !== 'cerrada')
          .slice(0, 5);
      },
      error: () => {
        this.cargandoSoporte = false;
      },
    });
  }

  tiempoPromedio(): string {
    const horas = Number(this.stats?.tiempoPromedioHoras);
    if (!horas || isNaN(horas)) {
      return '—';
    }
    return horas < 1 ? '< 1 h' : `${horas.toFixed(1)} h`;
  }

  buscarEquipo() {
    this.equipoEncontrado = null;
    this.historial = null;
    this.error = '';

    if (!this.bienNacional || !this.bienNacional.trim()) {
      this.error = 'Por favor, ingrese un Bien Nacional válido.';
      return;
    }

    this.buscando = true;
    this.equipmentService.getEquipmentByBienNacional(this.bienNacional).subscribe({
      next: (data) => {
        this.buscando = false;
        this.equipoEncontrado = data;
        // Con sesión activa se carga la hoja de vida completa del equipo
        if (this.authService.isLoggedIn()) {
          this.cargarHistorial(data.bienNacional);
        }
      },
      error: (error) => {
        this.buscando = false;
        this.error = error.message ?? 'Error al buscar el equipo. Por favor, intente nuevamente.';
      }
    });
  }

  cargarHistorial(bienNacional: string): void {
    this.cargandoHistorial = true;
    this.equipmentService.getEquipmentHistory(bienNacional).subscribe({
      next: (historial) => {
        this.cargandoHistorial = false;
        this.historial = historial;
      },
      error: () => {
        this.cargandoHistorial = false;
      }
    });
  }

  formatearMotivo(motivo: string | null | undefined): string {
    if (!motivo) {
      return '—';
    }
    return ETIQUETAS[motivo] ?? motivo;
  }

  onKeyPress = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      this.buscarEquipo();
    }
  };
}

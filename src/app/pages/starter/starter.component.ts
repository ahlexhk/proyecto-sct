import { Component, ViewEncapsulation } from '@angular/core';
import { MaterialModule } from '../../material.module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { Equipment, EquipmentService } from '../../services/equipment.service';

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
export class StarterComponent {
  bienNacional: string = '';
  equipoEncontrado: Equipment | null = null;
  error: string = '';
  buscando = false;

  constructor(private equipmentService: EquipmentService) { }

  buscarEquipo() {
    this.equipoEncontrado = null;
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
      },
      error: (error) => {
        this.buscando = false;
        this.error = error.message ?? 'Error al buscar el equipo. Por favor, intente nuevamente.';
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

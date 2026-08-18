import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Equipment, EquipmentService } from 'src/app/services/equipment.service';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Estado que corresponde a cada motivo de cambio.
const ESTADO_POR_MOTIVO: Record<string, 'operativo' | 'reparacion' | 'inoperativo'> = {
  reparacion: 'reparacion',
  entrega: 'operativo',
  esperaEntrega: 'operativo',
  esperaPieza: 'inoperativo',
  reubicacion: 'operativo',
  reasignacion: 'operativo',
  desincorporacion: 'inoperativo',
};

const ETIQUETA_ESTADO: Record<string, string> = {
  operativo: 'Operativo',
  reparacion: 'Reparación',
  inoperativo: 'Inoperativo',
};

@Component({
  selector: 'app-equipment-control',
  templateUrl: './equipment-control.component.html',
  styleUrls: ['./equipment-control.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatProgressSpinnerModule
  ]
})
export class EquipmentControlComponent {
  editForm = new FormGroup({
    bienNacional: new FormControl('', Validators.required),
    estado: new FormControl('', Validators.required),
    ubicacion: new FormControl('', [Validators.required, Validators.maxLength(255)]),
    asignacion: new FormControl('', [Validators.required, Validators.maxLength(255)]),
    motivo: new FormControl('', Validators.required),
    observacion: new FormControl('', Validators.required),
    caracteristicas: new FormControl('', Validators.required)
  });

  equipment: Equipment | null = null;
  buscando = false;
  guardando = false;

  constructor(
    private equipmentService: EquipmentService,
    private snackBar: MatSnackBar
  ) {
    // El estado se deriva del motivo seleccionado y queda bloqueado
    // para mantener la coherencia del historial de reportes.
    this.editForm.get('motivo')?.valueChanges.subscribe((motivo) => {
      this.actualizarEstadoSegunMotivo(motivo);
    });
  }

  actualizarEstadoSegunMotivo(motivo: string | null) {
    const estadoControl = this.editForm.get('estado');
    const estado = motivo ? ESTADO_POR_MOTIVO[motivo] : undefined;
    if (estado) {
      estadoControl?.setValue(estado);
      estadoControl?.disable();
    } else {
      estadoControl?.enable();
    }
  }

  etiquetaEstado(estado: string | undefined | null): string {
    return estado ? (ETIQUETA_ESTADO[estado] ?? estado) : '—';
  }

  searchEquipment() {
    const bienNacional = this.editForm.get('bienNacional')?.value;
    if (!bienNacional || !bienNacional.trim()) {
      this.snackBar.open('El campo Bien Nacional es requerido', 'Cerrar', { duration: 5000 });
      return;
    }
    this.buscando = true;
    this.equipmentService.getEquipmentByBienNacional(bienNacional).subscribe({
      next: (response) => {
        this.buscando = false;
        this.equipment = response;
        this.editForm.patchValue({
          estado: response.estado,
          ubicacion: response.ubicacion,
          asignacion: response.asignacion,
          caracteristicas: response.caracteristicas
        });
      },
      error: (error) => {
        this.buscando = false;
        this.snackBar.open(error.message ?? 'Equipo no encontrado', 'Cerrar', { duration: 5000 });
      }
    });
  }

  resetSearch() {
    this.equipment = null;
    this.editForm.reset();
    this.editForm.get('estado')?.enable();
  }

  onSubmit() {
    if (!this.equipment) {
      return;
    }
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.snackBar.open('Completa el motivo y la observación del cambio', 'Cerrar', { duration: 5000 });
      return;
    }

    this.guardando = true;
    const changes = this.editForm.getRawValue(); // incluye el estado deshabilitado
    this.equipmentService.updateEquipmentStatus(this.equipment.id, changes).subscribe({
      next: () => {
        this.guardando = false;
        this.snackBar.open('Cambios guardados exitosamente', 'Cerrar', { duration: 5000 });
        this.resetSearch();
      },
      error: () => {
        this.guardando = false;
        this.snackBar.open('Error al guardar los cambios', 'Cerrar', { duration: 5000 });
      }
    });
  }
}

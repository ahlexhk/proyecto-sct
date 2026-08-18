import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EquipmentService } from 'src/app/services/equipment.service';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-equipment',
  standalone: true,
  imports: [
    MatSnackBarModule,
    MatCardModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './equipment.component.html',
  styleUrl: './equipment.component.scss'
})
export class AppEquipmentComponent {
  guardando = false;

  equipmentForm = new FormGroup({
    bienNacional: new FormControl('', [Validators.required, Validators.maxLength(255)]),
    tipoEquipo: new FormControl('', [Validators.required, Validators.maxLength(255)]),
    numeroSerie: new FormControl('', [Validators.required, Validators.maxLength(255)]),
    estado: new FormControl('', Validators.required),
    ubicacion: new FormControl('', [Validators.required, Validators.maxLength(255)]),
    asignacion: new FormControl('', [Validators.required, Validators.maxLength(255)]),
    caracteristicas: new FormControl('', Validators.required)
  });

  constructor(
    private equipmentService: EquipmentService,
    private snackBar: MatSnackBar
  ) {}

  onSubmit() {
    if (this.equipmentForm.invalid) {
      this.equipmentForm.markAllAsTouched();
      this.snackBar.open('Por favor, completa todos los campos requeridos', 'Cerrar', { duration: 5000 });
      return;
    }

    this.guardando = true;
    this.equipmentService.addEquipment(this.equipmentForm.value).subscribe({
      next: () => {
        this.guardando = false;
        this.snackBar.open('Equipo agregado exitosamente', 'Cerrar', { duration: 5000 });
        this.equipmentForm.reset();
      },
      error: (error) => {
        this.guardando = false;
        this.snackBar.open(error.message, 'Cerrar', { duration: 5000 });
      }
    });
  }
}

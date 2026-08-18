import { Component } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { EquipmentService } from 'src/app/services/equipment.service';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Todos los productos del inventario llevan su propio Bien Nacional:
// la PC, el monitor, el teclado, el mouse, las cornetas, la impresora…
export const TIPOS_EQUIPO = [
  'PC de escritorio',
  'Laptop',
  'Monitor',
  'Teclado',
  'Mouse',
  'Cornetas',
  'Impresora',
  'Escáner',
  'Router / Red',
  'Regulador / UPS',
  'Teléfono',
  'Proyector',
];

// Tipos que llevan especificaciones estructuradas
const TIPOS_CON_SPECS = ['PC de escritorio', 'Laptop'];

@Component({
  selector: 'app-equipment',
  standalone: true,
  imports: [
    CommonModule,
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
  tiposEquipo = TIPOS_EQUIPO;

  // Aviso en vivo si el Bien Nacional ya está registrado
  bnDuplicado: string | null = null;
  verificandoBn = false;

  equipmentForm = new FormGroup({
    bienNacional: new FormControl('', [Validators.required, Validators.maxLength(255)]),
    tipoEquipo: new FormControl('', Validators.required),
    tipoEquipoOtro: new FormControl(''),
    numeroSerie: new FormControl('', [Validators.required, Validators.maxLength(255)]),
    estado: new FormControl('', Validators.required),
    ubicacion: new FormControl('', [Validators.required, Validators.maxLength(255)]),
    asignacion: new FormControl('', [Validators.required, Validators.maxLength(255)]),
    // Especificaciones estructuradas (solo PC de escritorio / Laptop)
    procesador: new FormControl(''),
    memoriaRam: new FormControl(''),
    almacenamiento: new FormControl(''),
    sistemaOperativo: new FormControl(''),
    caracteristicas: new FormControl('')
  });

  constructor(
    private equipmentService: EquipmentService,
    private snackBar: MatSnackBar
  ) {
    // El campo "Otro" y las especificaciones cambian según el tipo elegido
    this.equipmentForm.get('tipoEquipo')?.valueChanges.subscribe(() => {
      this.equipmentForm.get('tipoEquipoOtro')?.setValue('');
    });

    // Aviso en vivo: mientras se escribe el BN se comprueba si ya existe
    // en el inventario, antes de intentar guardar.
    this.equipmentForm.get('bienNacional')?.valueChanges
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((valor) => this.verificarBnDuplicado((valor ?? '').trim()));
  }

  private verificarBnDuplicado(bn: string): void {
    this.bnDuplicado = null;
    if (!bn) {
      this.verificandoBn = false;
      return;
    }
    this.verificandoBn = true;
    this.equipmentService.getEquipmentByBienNacional(bn).subscribe({
      next: (equipo) => {
        this.verificandoBn = false;
        this.bnDuplicado = `Ya está registrado como "${equipo.tipoEquipo}" en ${equipo.ubicacion}`;
      },
      error: () => {
        // No existe: el BN está libre
        this.verificandoBn = false;
        this.bnDuplicado = null;
      }
    });
  }

  esOtroTipo(): boolean {
    return this.equipmentForm.get('tipoEquipo')?.value === 'Otro';
  }

  esPc(): boolean {
    const tipo = this.equipmentForm.get('tipoEquipo')?.value ?? '';
    return TIPOS_CON_SPECS.includes(tipo);
  }

  // Para las PCs, las características se arman desde los campos estructurados
  private construirCaracteristicas(): string {
    const v = this.equipmentForm.value;
    if (this.esPc()) {
      const partes = [
        v.procesador ? `Procesador: ${v.procesador.trim()}` : null,
        v.memoriaRam ? `RAM: ${v.memoriaRam.trim()}` : null,
        v.almacenamiento ? `Almacenamiento: ${v.almacenamiento.trim()}` : null,
        v.sistemaOperativo ? `SO: ${v.sistemaOperativo.trim()}` : null,
        v.caracteristicas?.trim() ? `Otros: ${v.caracteristicas.trim()}` : null,
      ].filter(Boolean);
      return partes.join(' | ');
    }
    return v.caracteristicas?.trim() ?? '';
  }

  onSubmit() {
    if (this.equipmentForm.invalid) {
      this.equipmentForm.markAllAsTouched();
      this.snackBar.open('Por favor, completa todos los campos requeridos', 'Cerrar', { duration: 5000 });
      return;
    }
    if (this.bnDuplicado) {
      this.snackBar.open('Ese Bien Nacional ya está registrado en el inventario', 'Cerrar', { duration: 5000 });
      return;
    }

    const v = this.equipmentForm.value;
    const tipoEquipo = this.esOtroTipo() ? (v.tipoEquipoOtro ?? '').trim() : v.tipoEquipo;
    if (!tipoEquipo) {
      this.snackBar.open('Indica el tipo de equipo', 'Cerrar', { duration: 5000 });
      return;
    }

    const caracteristicas = this.construirCaracteristicas();
    if (!caracteristicas) {
      this.snackBar.open(
        this.esPc() ? 'Completa las especificaciones de la PC' : 'Las características son requeridas',
        'Cerrar', { duration: 5000 }
      );
      return;
    }

    this.guardando = true;
    this.equipmentService.addEquipment({
      bienNacional: v.bienNacional,
      tipoEquipo,
      numeroSerie: v.numeroSerie,
      estado: v.estado,
      ubicacion: v.ubicacion,
      asignacion: v.asignacion,
      caracteristicas
    }).subscribe({
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

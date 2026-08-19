import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Workstation, WorkstationService } from 'src/app/services/workstation.service';
import { EquipmentService } from 'src/app/services/equipment.service';

// Estado de la validación en vivo del BN a vincular
type EstadoValidacionBn =
  | { tipo: 'vacio' }
  | { tipo: 'verificando' }
  | { tipo: 'valido'; detalle: string }
  | { tipo: 'invalido'; detalle: string };

@Component({
  selector: 'app-workstations',
  standalone: true,
  templateUrl: './workstations.component.html',
  styleUrls: ['./workstations.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
  ],
})
export class WorkstationsComponent implements OnInit {
  puestos: Workstation[] = [];
  cargando = false;

  // Alta de puesto
  mostrandoFormulario = false;
  guardando = false;
  puestoForm = new FormGroup({
    nombre: new FormControl('', [Validators.required, Validators.maxLength(255)]),
    ubicacion: new FormControl('', [Validators.required, Validators.maxLength(255)]),
    responsable: new FormControl('', [Validators.required, Validators.maxLength(255)]),
    descripcion: new FormControl(''),
  });

  // Puesto expandido y vinculación de equipos
  expandido: number | null = null;
  bnControl = new FormControl('');
  validacionBn: EstadoValidacionBn = { tipo: 'vacio' };
  vinculando = false;

  // Edición de los datos del puesto
  editando = false;
  guardandoEdicion = false;
  editForm = new FormGroup({
    nombre: new FormControl('', [Validators.required, Validators.maxLength(255)]),
    ubicacion: new FormControl('', [Validators.required, Validators.maxLength(255)]),
    responsable: new FormControl('', [Validators.required, Validators.maxLength(255)]),
    descripcion: new FormControl(''),
  });

  constructor(
    private workstationService: WorkstationService,
    private equipmentService: EquipmentService,
    private snackBar: MatSnackBar,
    private router: Router
  ) { }

  // Abre el formulario de incidencias con los datos del puesto precargados
  reportarIncidencia(puesto: Workstation): void {
    this.router.navigate(['/ui-components/incidents'], {
      queryParams: { puesto: puesto.id }
    });
  }

  ngOnInit(): void {
    this.cargar();

    // Validación en vivo: mientras se escribe el BN se verifica contra el
    // inventario y se avisa de inmediato si el dato no va.
    this.bnControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((valor) => this.validarBn(valor ?? ''));
  }

  cargar(): void {
    this.cargando = true;
    this.workstationService.getWorkstations().subscribe({
      next: (puestos) => {
        this.cargando = false;
        this.puestos = puestos;
      },
      error: () => {
        this.cargando = false;
        this.snackBar.open('Error al cargar los puestos de trabajo', 'Cerrar', { duration: 5000 });
      },
    });
  }

  toggleFormulario(): void {
    this.mostrandoFormulario = !this.mostrandoFormulario;
    if (!this.mostrandoFormulario) {
      this.puestoForm.reset();
    }
  }

  crearPuesto(): void {
    if (this.puestoForm.invalid) {
      this.puestoForm.markAllAsTouched();
      return;
    }
    this.guardando = true;
    const v = this.puestoForm.value;
    this.workstationService.createWorkstation({
      nombre: v.nombre!,
      ubicacion: v.ubicacion!,
      responsable: v.responsable!,
      descripcion: v.descripcion || null,
    }).subscribe({
      next: () => {
        this.guardando = false;
        this.snackBar.open('Puesto de trabajo creado', 'Cerrar', { duration: 4000 });
        this.toggleFormulario();
        this.cargar();
      },
      error: (error) => {
        this.guardando = false;
        this.snackBar.open(error.error?.error ?? 'Error al crear el puesto', 'Cerrar', { duration: 5000 });
      },
    });
  }

  toggleExpandir(puesto: Workstation): void {
    this.expandido = this.expandido === puesto.id ? null : puesto.id;
    this.bnControl.setValue('');
    this.validacionBn = { tipo: 'vacio' };
    this.editando = false;
  }

  iniciarEdicion(puesto: Workstation): void {
    this.editando = true;
    this.editForm.setValue({
      nombre: puesto.nombre,
      ubicacion: puesto.ubicacion,
      responsable: puesto.responsable,
      descripcion: puesto.descripcion ?? '',
    });
  }

  cancelarEdicion(): void {
    this.editando = false;
  }

  guardarEdicion(puesto: Workstation): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }
    this.guardandoEdicion = true;
    const v = this.editForm.value;
    this.workstationService.updateWorkstation(puesto.id, {
      nombre: v.nombre!,
      ubicacion: v.ubicacion!,
      responsable: v.responsable!,
      descripcion: v.descripcion || null,
    }).subscribe({
      next: () => {
        this.guardandoEdicion = false;
        this.editando = false;
        this.snackBar.open('Datos del puesto actualizados', 'Cerrar', { duration: 4000 });
        this.cargar();
      },
      error: (error) => {
        this.guardandoEdicion = false;
        this.snackBar.open(error.error?.error ?? 'Error al actualizar el puesto', 'Cerrar', { duration: 5000 });
      },
    });
  }

  private validarBn(valor: string): void {
    const bn = valor.trim();
    if (!bn) {
      this.validacionBn = { tipo: 'vacio' };
      return;
    }
    this.validacionBn = { tipo: 'verificando' };
    this.equipmentService.getEquipmentByBienNacional(bn).subscribe({
      next: (equipo) => {
        // Avisar también si ya está vinculado a un puesto
        const puestoActual = (equipo as any).puesto;
        if (puestoActual) {
          const esEste = this.puestos.find((p) => p.id === this.expandido)?.nombre === puestoActual;
          this.validacionBn = esEste
            ? { tipo: 'invalido', detalle: 'Ese equipo ya está vinculado a este puesto' }
            : { tipo: 'invalido', detalle: `Ya pertenece al puesto "${puestoActual}" (se puede mover)` };
        } else {
          this.validacionBn = { tipo: 'valido', detalle: `${equipo.tipoEquipo} — ${equipo.ubicacion}` };
        }
      },
      error: () => {
        this.validacionBn = { tipo: 'invalido', detalle: 'Ese Bien Nacional no está registrado en el inventario' };
      },
    });
  }

  vincular(puesto: Workstation, mover = false): void {
    const bn = (this.bnControl.value ?? '').trim();
    if (!bn) {
      this.snackBar.open('Escribe el Bien Nacional a vincular', 'Cerrar', { duration: 4000 });
      return;
    }
    this.vinculando = true;
    this.workstationService.linkEquipment(puesto.id, bn, mover).subscribe({
      next: (res) => {
        this.vinculando = false;
        this.snackBar.open(res.message ?? 'Equipo vinculado', 'Cerrar', { duration: 4000 });
        this.bnControl.setValue('');
        this.validacionBn = { tipo: 'vacio' };
        this.cargar();
      },
      error: (error) => {
        this.vinculando = false;
        if (error.status === 409) {
          // Ya pertenece a otro puesto: se ofrece moverlo explícitamente
          const detalle = error.error?.error ?? 'El equipo pertenece a otro puesto';
          const ref = this.snackBar.open(detalle, 'Mover aquí', { duration: 8000 });
          ref.onAction().subscribe(() => this.vincular(puesto, true));
        } else {
          this.snackBar.open(error.error?.error ?? 'Error al vincular el equipo', 'Cerrar', { duration: 5000 });
        }
      },
    });
  }

  desvincular(puesto: Workstation, equipmentId: number): void {
    this.workstationService.unlinkEquipment(puesto.id, equipmentId).subscribe({
      next: () => {
        this.snackBar.open('Equipo desvinculado', 'Cerrar', { duration: 4000 });
        this.cargar();
      },
      error: (error) => {
        this.snackBar.open(error.error?.error ?? 'Error al desvincular', 'Cerrar', { duration: 5000 });
      },
    });
  }

  eliminarPuesto(puesto: Workstation): void {
    const confirmado = window.confirm(
      `¿Eliminar el puesto "${puesto.nombre}"? Sus ${puesto.equipos.length} equipo(s) quedarán desvinculados (no se borran del inventario).`
    );
    if (!confirmado) {
      return;
    }
    this.workstationService.deleteWorkstation(puesto.id).subscribe({
      next: (res) => {
        this.snackBar.open(res.message ?? 'Puesto eliminado', 'Cerrar', { duration: 4000 });
        this.cargar();
      },
      error: (error) => {
        this.snackBar.open(error.error?.error ?? 'Error al eliminar el puesto', 'Cerrar', { duration: 5000 });
      },
    });
  }

  etiquetaEstado(estado: string): string {
    return estado === 'operativo' ? 'Operativo' : estado === 'reparacion' ? 'Reparación' : 'Inoperativo';
  }
}

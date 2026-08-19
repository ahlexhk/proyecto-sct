import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TablerIconsModule } from 'angular-tabler-icons';
import {
  ETIQUETA_ESTADO_INCIDENCIA,
  ETIQUETA_PRIORIDAD,
  Incident,
  IncidentService,
} from 'src/app/services/incident.service';
import { NotificationService } from 'src/app/services/notification.service';
import { AuthService } from 'src/app/services/auth.service';
import { EquipmentService } from 'src/app/services/equipment.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-incidents',
  standalone: true,
  templateUrl: './incidents.component.html',
  styleUrls: ['./incidents.component.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TablerIconsModule,
  ],
})
export class IncidentsComponent implements OnInit {
  incidents: Incident[] = [];
  cargando = false;

  // Filtros
  filtroEstado = '';
  filtroPrioridad = '';
  soloMias = false;

  // Alta de incidencia
  mostrandoFormulario = false;
  guardando = false;
  incidentForm = new FormGroup({
    titulo: new FormControl('', [Validators.required, Validators.maxLength(255)]),
    descripcion: new FormControl('', Validators.required),
    prioridad: new FormControl('media', Validators.required),
    solicitante: new FormControl('', [Validators.required, Validators.maxLength(255)]),
    ubicacion: new FormControl('', [Validators.required, Validators.maxLength(255)]),
    bienNacional: new FormControl(''),
  });

  // Detalle seleccionado
  seleccionada: Incident | null = null;
  cargandoDetalle = false;
  actualizando = false;
  accionForm = new FormGroup({
    estado: new FormControl(''),
    comentario: new FormControl(''),
  });

  etiquetaEstado = ETIQUETA_ESTADO_INCIDENCIA;
  etiquetaPrioridad = ETIQUETA_PRIORIDAD;

  // Fotos adjuntas
  fotosSeleccionadas: File[] = [];
  subiendoFotos = false;

  // Validación en vivo del Bien Nacional del formulario de alta
  bnEstado: 'vacio' | 'verificando' | 'valido' | 'invalido' = 'vacio';
  bnDetalle = '';

  constructor(
    private incidentService: IncidentService,
    private notificationService: NotificationService,
    private equipmentService: EquipmentService,
    public authService: AuthService,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.cargar();

    // El sistema gira alrededor del Bien Nacional: al escribirlo se
    // verifica en vivo contra el inventario y se avisa si no existe.
    this.incidentForm.get('bienNacional')?.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((valor) => this.validarBnIncidencia((valor ?? '').trim()));
  }

  private validarBnIncidencia(bn: string): void {
    if (!bn) {
      this.bnEstado = 'vacio';
      this.bnDetalle = '';
      return;
    }
    this.bnEstado = 'verificando';
    this.equipmentService.getEquipmentByBienNacional(bn).subscribe({
      next: (equipo) => {
        this.bnEstado = 'valido';
        this.bnDetalle = `${equipo.tipoEquipo} — ${equipo.ubicacion}`;
      },
      error: () => {
        this.bnEstado = 'invalido';
        this.bnDetalle = 'Ese Bien Nacional no está registrado en el inventario';
      },
    });
  }

  cargar(): void {
    this.cargando = true;
    this.incidentService.getIncidents({
      estado: this.filtroEstado || undefined,
      prioridad: this.filtroPrioridad || undefined,
      asignado: this.soloMias ? 'me' : undefined,
    }).subscribe({
      next: (incidents) => {
        this.cargando = false;
        this.incidents = incidents;
      },
      error: () => {
        this.cargando = false;
        this.snackBar.open('Error al cargar las incidencias', 'Cerrar', { duration: 5000 });
      },
    });
  }

  cambiarFiltroEstado(estado: string): void {
    this.filtroEstado = this.filtroEstado === estado ? '' : estado;
    this.cargar();
  }

  toggleSoloMias(): void {
    this.soloMias = !this.soloMias;
    this.cargar();
  }

  toggleFormulario(): void {
    this.mostrandoFormulario = !this.mostrandoFormulario;
    if (!this.mostrandoFormulario) {
      this.incidentForm.reset({ prioridad: 'media' });
    }
  }

  crearIncidencia(): void {
    if (this.incidentForm.invalid) {
      this.incidentForm.markAllAsTouched();
      this.snackBar.open('Completa los campos requeridos de la incidencia', 'Cerrar', { duration: 5000 });
      return;
    }
    if (this.bnEstado === 'invalido') {
      this.snackBar.open('El Bien Nacional indicado no existe en el inventario. Corrígelo o déjalo vacío.', 'Cerrar', { duration: 6000 });
      return;
    }
    this.guardando = true;
    const valores = this.incidentForm.value;
    this.incidentService.createIncident({
      titulo: valores.titulo!,
      descripcion: valores.descripcion!,
      prioridad: valores.prioridad!,
      solicitante: valores.solicitante!,
      ubicacion: valores.ubicacion!,
      bienNacional: valores.bienNacional || null,
    }).subscribe({
      next: () => {
        this.guardando = false;
        this.snackBar.open('Incidencia registrada exitosamente', 'Cerrar', { duration: 5000 });
        this.toggleFormulario();
        this.cargar();
        this.notificationService.refrescarAhora();
      },
      error: (error) => {
        this.guardando = false;
        this.snackBar.open(error.error?.error ?? 'Error al registrar la incidencia', 'Cerrar', { duration: 5000 });
      },
    });
  }

  verDetalle(incident: Incident): void {
    if (this.seleccionada?.id === incident.id) {
      this.seleccionada = null;
      return;
    }
    this.cargandoDetalle = true;
    this.seleccionada = incident;
    this.accionForm.reset({ estado: '', comentario: '' });
    this.incidentService.getIncident(incident.id).subscribe({
      next: (detalle) => {
        this.cargandoDetalle = false;
        this.seleccionada = detalle;
      },
      error: () => {
        this.cargandoDetalle = false;
        this.snackBar.open('Error al cargar el detalle', 'Cerrar', { duration: 5000 });
      },
    });
  }

  tomarIncidencia(): void {
    if (!this.seleccionada) return;
    this.aplicarCambios({ asignarme: true, estado: this.seleccionada.estado === 'abierta' ? 'en_proceso' : undefined });
  }

  actualizarIncidencia(): void {
    if (!this.seleccionada) return;
    const { estado, comentario } = this.accionForm.value;
    if (!estado && !comentario?.trim()) {
      this.snackBar.open('Selecciona un estado o escribe un comentario', 'Cerrar', { duration: 5000 });
      return;
    }
    this.aplicarCambios({
      estado: estado || undefined,
      comentario: comentario?.trim() || undefined,
    });
  }

  private aplicarCambios(cambios: { estado?: string; asignarme?: boolean; comentario?: string }): void {
    if (!this.seleccionada) return;
    this.actualizando = true;
    const id = this.seleccionada.id;
    this.incidentService.updateIncident(id, cambios).subscribe({
      next: () => {
        this.actualizando = false;
        this.snackBar.open('Incidencia actualizada', 'Cerrar', { duration: 4000 });
        this.accionForm.reset({ estado: '', comentario: '' });
        this.cargar();
        this.notificationService.refrescarAhora();
        // Recargar el detalle abierto
        this.incidentService.getIncident(id).subscribe({
          next: (detalle) => (this.seleccionada = detalle),
        });
      },
      error: (error) => {
        this.actualizando = false;
        this.snackBar.open(error.error?.error ?? 'Error al actualizar la incidencia', 'Cerrar', { duration: 5000 });
      },
    });
  }

  esFinalizada(incident: Incident): boolean {
    return incident.estado === 'resuelta' || incident.estado === 'cerrada';
  }

  onFotosSeleccionadas(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.fotosSeleccionadas = Array.from(input.files ?? []).slice(0, 3);
  }

  subirFotos(): void {
    if (!this.seleccionada || this.fotosSeleccionadas.length === 0) {
      return;
    }
    this.subiendoFotos = true;
    const id = this.seleccionada.id;
    this.incidentService.uploadPhotos(id, this.fotosSeleccionadas).subscribe({
      next: (res) => {
        this.subiendoFotos = false;
        this.fotosSeleccionadas = [];
        this.snackBar.open(res.message ?? 'Fotos adjuntadas', 'Cerrar', { duration: 4000 });
        this.incidentService.getIncident(id).subscribe({
          next: (detalle) => (this.seleccionada = detalle),
        });
      },
      error: (error) => {
        this.subiendoFotos = false;
        this.snackBar.open(error.error?.error ?? 'Error al subir las fotos', 'Cerrar', { duration: 5000 });
      },
    });
  }
}

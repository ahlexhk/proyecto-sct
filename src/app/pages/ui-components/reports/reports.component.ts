import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ReportsService } from 'src/app/services/reports.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatTableModule,
    MatCardModule,
    MatProgressSpinnerModule
  ]
})
export class ReportsComponent {
  reportForm = new FormGroup({
    fechaInicio: new FormControl('', Validators.required),
    fechaFin: new FormControl('', Validators.required)
  });

  cargando = false;

  // Datos de los reportes
  reparadosData: any = null;
  tiempoReparacionData: any = null;
  reubicadosData: any = null;
  retirosReparacionData: any = null;

  // Columnas para las tablas
  displayedColumnsReparados: string[] = ['totalReparados'];
  displayedColumnsTiempoReparacion: string[] = ['tiempoPromedio'];
  displayedColumnsReubicados: string[] = ['equipo', 'ubicacionAnterior', 'ubicacionNueva'];
  displayedColumnsRetirosReparacion: string[] = ['ubicacion', 'totalRetiros'];

  // Historial completo del período (usado para las descargas)
  reportesCompletos: any[] = [];

  constructor(
    private reportsService: ReportsService,
    private snackBar: MatSnackBar
  ) { }

  // Formatea la fecha al formato YYYY-MM-DD HH:mm:ss
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  formatDatepdf(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Ajusta la fecha fin al final del día para incluir el día completo
  private rangoSeleccionado(): { inicio: string; fin: string } | null {
    const fechaInicio = this.reportForm.get('fechaInicio')?.value;
    const fechaFin = this.reportForm.get('fechaFin')?.value;
    if (!fechaInicio || !fechaFin) {
      return null;
    }
    const fin = new Date(fechaFin);
    fin.setHours(23, 59, 59);
    return {
      inicio: this.formatDate(new Date(fechaInicio)),
      fin: this.formatDate(fin)
    };
  }

  generarReporte() {
    if (!this.reportForm.valid) {
      this.snackBar.open('Las fechas de inicio y fin son requeridas', 'Cerrar', { duration: 5000 });
      return;
    }
    const rango = this.rangoSeleccionado();
    if (!rango) {
      this.snackBar.open('Las fechas de inicio y fin son requeridas', 'Cerrar', { duration: 5000 });
      return;
    }

    this.cargando = true;

    // Una sola carga coordinada: los cuatro reportes + el historial completo
    forkJoin({
      reparados: this.reportsService.getReporteReparados(rango.inicio, rango.fin).pipe(catchError(() => of(null))),
      tiempoReparacion: this.reportsService.getTiempoReparacion(rango.inicio, rango.fin).pipe(catchError(() => of(null))),
      reubicados: this.reportsService.getReporteReubicados(rango.inicio, rango.fin),
      retiros: this.reportsService.getRetirosReparacion(rango.inicio, rango.fin),
      completos: this.reportsService.getReportesCompletos(rango.inicio, rango.fin)
    }).subscribe((res) => {
      this.cargando = false;

      this.reparadosData = res.reparados && !res.reparados.mensaje ? [res.reparados] : [];
      this.tiempoReparacionData = res.tiempoReparacion && !res.tiempoReparacion.mensaje ? [res.tiempoReparacion] : [];
      this.reubicadosData = res.reubicados && !res.reubicados.mensaje ? res.reubicados : [];
      this.retirosReparacionData = res.retiros && !res.retiros.mensaje ? res.retiros : [];
      this.reportesCompletos = res.completos && !res.completos.mensaje ? res.completos : [];

      if (this.reportesCompletos.length === 0) {
        this.snackBar.open('No se encontraron reportes en el período seleccionado', 'Cerrar', { duration: 5000 });
      }
    });
  }

  descargarPDF() {
    const fechaInicio = this.reportForm.get('fechaInicio')?.value;
    const fechaFin = this.reportForm.get('fechaFin')?.value;
    if (!fechaInicio || !fechaFin) {
      this.snackBar.open('Las fechas de inicio y fin son requeridas', 'Cerrar', { duration: 5000 });
      return;
    }
    const inicio = this.formatDatepdf(new Date(fechaInicio));
    const fin = this.formatDatepdf(new Date(fechaFin));

    const doc = new jsPDF('l', 'mm', 'a4');

    doc.setFontSize(16);
    doc.text(`Reporte completo — ${inicio} a ${fin}`, 10, 16);

    const reportesTableData = this.reportesCompletos.map((reporte, index) => [
      index + 1,
      reporte.bienNacional,
      reporte.estado_anterior,
      reporte.estado_nuevo,
      reporte.ubicacion_anterior,
      reporte.ubicacion_nueva,
      reporte.motivo,
      reporte.observacion,
      reporte.registradoPor ?? '',
      new Date(reporte.created_at).toLocaleString(),
    ]);

    const reportesTableColumns = [
      '#', 'Bien Nacional', 'Estado Anterior', 'Estado Nuevo',
      'Ubicación Anterior', 'Ubicación Nueva', 'Motivo', 'Observación',
      'Registrado por', 'Fecha',
    ];

    (doc as any).autoTable({
      head: [reportesTableColumns],
      body: reportesTableData,
      startY: 24,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    const resumenTableData = [];
    if (this.reparadosData && this.reparadosData.length > 0) {
      resumenTableData.push(['Equipos Reparados', this.reparadosData[0].totalReparados]);
    }
    if (this.tiempoReparacionData && this.tiempoReparacionData.length > 0) {
      resumenTableData.push(['Tiempo Promedio de Reparación', `${Number(this.tiempoReparacionData[0].tiempoPromedio).toFixed(2)} horas`]);
    }

    if (resumenTableData.length > 0) {
      (doc as any).autoTable({
        head: [['Resumen', 'Valor']],
        body: resumenTableData,
        startY: (doc as any).lastAutoTable.finalY + 10,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillColor: [41, 128, 185] },
      });
    }

    doc.save(`reporte-completo_${inicio}_${fin}.pdf`);
  }

  descargarExcel() {
    const fechaInicio = this.reportForm.get('fechaInicio')?.value;
    const fechaFin = this.reportForm.get('fechaFin')?.value;
    if (!fechaInicio || !fechaFin) {
      this.snackBar.open('Las fechas de inicio y fin son requeridas', 'Cerrar', { duration: 5000 });
      return;
    }

    const inicio = this.formatDatepdf(new Date(fechaInicio));
    const fin = this.formatDatepdf(new Date(fechaFin));

    const wsData: any[] = [];

    wsData.push(['Reportes Completos']);
    wsData.push([
      'Bien Nacional', 'Estado Anterior', 'Estado Nuevo',
      'Ubicación Anterior', 'Ubicación Nueva', 'Motivo',
      'Observación', 'Registrado por', 'Fecha'
    ]);

    this.reportesCompletos.forEach((reporte) => {
      wsData.push([
        reporte.bienNacional,
        reporte.estado_anterior,
        reporte.estado_nuevo,
        reporte.ubicacion_anterior,
        reporte.ubicacion_nueva,
        reporte.motivo,
        reporte.observacion,
        reporte.registradoPor ?? '',
        new Date(reporte.created_at).toLocaleString()
      ]);
    });

    wsData.push([]);

    if (this.reparadosData && this.reparadosData.length > 0) {
      wsData.push(['Resumen de Equipos Reparados']);
      wsData.push(['Total Reparados']);
      wsData.push([this.reparadosData[0].totalReparados]);
      wsData.push([]);
    }

    if (this.tiempoReparacionData && this.tiempoReparacionData.length > 0) {
      wsData.push(['Resumen de Tiempo Promedio de Reparación']);
      wsData.push(['Tiempo Promedio (horas)']);
      wsData.push([this.tiempoReparacionData[0].tiempoPromedio]);
      wsData.push([]);
    }

    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(wsData);
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    XLSX.writeFile(wb, `reporte-completo_${inicio}_${fin}.xlsx`);
  }
}

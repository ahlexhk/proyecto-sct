import {
  Component,
  Output,
  EventEmitter,
  Input,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { AuthService } from 'src/app/services/auth.service';
import { NotificationService } from 'src/app/services/notification.service';
import { ThemeService } from 'src/app/services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule, NgScrollbarModule, TablerIconsModule, MaterialModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent implements OnInit {

  constructor(
    private router: Router,
    public authService: AuthService,
    public notificationService: NotificationService,
    public themeService: ThemeService
  ) { }

  @Input() showToggle = true;
  @Input() toggleChecked = false;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleMobileFilterNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

  ngOnInit(): void {
    // Sondeo de notificaciones de incidencias (solo actúa con sesión activa)
    this.notificationService.start();
  }

  abrirIncidencia(): void {
    this.notificationService.marcarLeidas();
    this.router.navigate(['/ui-components/incidents']);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/dashboard']);
  }

  getUserInitials(): string {
    const user = this.authService.getUser();
    if (user) {
      return (user.nombre?.charAt(0) ?? '') + (user.apellido?.charAt(0) ?? '');
    }
    return 'UA';
  }

  getUserName(): string {
    const user = this.authService.getUser();
    return user ? `${user.nombre} ${user.apellido}` : '';
  }

  getUserCargo(): string {
    return this.authService.getUser()?.cargo ?? '';
  }

  descripcionEvento(tipo: string): string {
    switch (tipo) {
      case 'creacion': return 'Nueva incidencia';
      case 'asignacion': return 'Incidencia tomada';
      case 'cambio_estado': return 'Cambio de estado';
      case 'comentario': return 'Nuevo comentario';
      default: return 'Actividad';
    }
  }
}

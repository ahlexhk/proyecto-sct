import {
  Component,
  HostBinding,
  Input,
  OnInit,
  OnChanges,
  Output,
  EventEmitter,
  ChangeDetectorRef,
} from '@angular/core';
import { NavItem } from './nav-item';
import { Router, NavigationEnd } from '@angular/router';
import { NavService } from '../../../../services/nav.service';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { TranslateModule } from '@ngx-translate/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/services/auth.service';
import { ChangeDetectionStrategy } from '@angular/core';
import { filter } from 'rxjs/operators';


@Component({
  selector: 'app-nav-item',
  standalone: true,
  imports: [TranslateModule, TablerIconsModule, MaterialModule, CommonModule],
  templateUrl: './nav-item.component.html',
  styleUrls: [],
  animations: [
    trigger('indicatorRotate', [
      state('collapsed', style({ transform: 'rotate(0deg)' })),
      state('expanded', style({ transform: 'rotate(180deg)' })),
      transition(
        'expanded <=> collapsed',
        animate('225ms cubic-bezier(0.4,0.0,0.2,1)')
      ),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppNavItemComponent implements OnInit {
  @Output() toggleMobileLink: any = new EventEmitter<void>();
  @Output() notify: EventEmitter<boolean> = new EventEmitter<boolean>();

  expanded: boolean = false; // Estado de expansión para este ítem
  disabled: boolean = false;
  twoLines: boolean = false;
  @HostBinding('attr.aria-expanded') ariaExpanded = this.expanded;
  @Input() item: NavItem | any;
  @Input() depth: number;
  isAuthenticated: boolean;
  isActive: boolean = false; // Estado de activación para este ítem

  constructor(
    public navService: NavService,
    public router: Router,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    if (this.depth === undefined) {
      this.depth = 0;
    }
  }

  ngOnInit(): void {
    // Verificar la ruta actual al inicializar el componente
    this.checkActiveRoute(this.router.url);
  
    // Suscribirse a los cambios de ruta (solo eventos NavigationEnd)
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      )
      .subscribe((event: NavigationEnd) => {
        this.checkActiveRoute(event.url);
      });
  
    // Suscribirse al estado de autenticación
    this.authService.authState$.subscribe((state) => {
      this.isAuthenticated = state;
      this.cdr.detectChanges(); // Forzar la detección de cambios
    });
  }
  // Verificar si la ruta actual coincide con la ruta del ítem
  checkActiveRoute(url: string): void {
    if (this.item.route) {
      this.isActive = url.startsWith(`/${this.item.route}`);
      this.expanded = this.isActive; // Expandir si el ítem está activo
      this.ariaExpanded = this.expanded;
      this.cdr.detectChanges(); // Forzar la detección de cambios
    }
  }

  isUiComponentRelated(item: NavItem | any): boolean {
    return ['Ui Components', 'Soporte técnico', 'Inventario'].includes(item.navCap)
      || (item.route && item.route.startsWith('/ui-components/'));
  }

  isAuthRelated(item: NavItem | any): boolean {
    return ['Auth', 'Cuenta'].includes(item.navCap)
      || (item.route && (item.route === '/authentication/login' || item.route === '/authentication/register'));
  }

  isMenuItemActive(item: NavItem | any): boolean {
    return this.isActive && (!this.isUiComponentRelated(item) || this.isAuthenticated);
  }

  onItemSelected(item: NavItem): void {
    if (!item.children || !item.children.length) {
      this.router.navigate([item.route]);
    }
    if (item.children && item.children.length) {
      this.expanded = !this.expanded; // Alternar estado de expansión
    }
    window.scroll({ top: 0, left: 0, behavior: 'smooth' });
    if (!this.expanded && window.innerWidth < 1024) {
      this.notify.emit();
    }
  }

  onSubItemSelected(item: NavItem): void {
    if (!item.children || !item.children.length) {
      if (this.expanded && window.innerWidth < 1024) {
        this.notify.emit();
      }
    }
  }
}
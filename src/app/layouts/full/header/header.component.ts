import {
  Component,
  Output,
  EventEmitter,
  Input,
  ViewEncapsulation,
} from '@angular/core';
import { TablerIconsModule } from 'angular-tabler-icons';
import { MaterialModule } from 'src/app/material.module';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgScrollbarModule } from 'ngx-scrollbar';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule, NgScrollbarModule, TablerIconsModule, MaterialModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent {

  constructor(
    private router: Router,
    public authService: AuthService
  ) { }

  @Input() showToggle = true;
  @Input() toggleChecked = false;
  @Output() toggleMobileNav = new EventEmitter<void>();
  @Output() toggleMobileFilterNav = new EventEmitter<void>();
  @Output() toggleCollapsed = new EventEmitter<void>();

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
}

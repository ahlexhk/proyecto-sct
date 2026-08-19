import { Component } from '@angular/core';

import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MaterialModule } from 'src/app/material.module';
import { ThemeService } from 'src/app/services/theme.service';

@Component({
  selector: 'app-blank',
  templateUrl: './blank.component.html',
  styleUrls: [],
  standalone: true,
  imports: [RouterOutlet, MaterialModule, CommonModule],
})
export class BlankComponent {
  // Instancia el servicio de tema para que el login también respete claro/oscuro
  constructor(private themeService: ThemeService) {}
}

import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-branding',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="branding">
      <a [routerLink]="['/']">
        <img
          src="/assets/images/logos/fnns-logo.png"
          class="align-middle m-2 branding-logo"
          alt="logo"
        />
      </a>
    </div>
  `,
  styles: [`
    .branding-logo {
      max-width: 150px;
      height: auto;
      display: block;
      margin: 12px auto;
    }
  `],
})
export class BrandingComponent {
  constructor() {}
}

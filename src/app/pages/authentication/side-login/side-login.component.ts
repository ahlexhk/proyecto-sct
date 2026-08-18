import { Component } from '@angular/core';
import { FormGroup, FormControl, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../material.module';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from 'src/app/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-side-login',
  standalone: true,
  imports: [RouterModule, MaterialModule, FormsModule, ReactiveFormsModule, MatButtonModule],
  templateUrl: './side-login.component.html',
})
export class AppSideLoginComponent {
  constructor(
    private router: Router,
    private authService: AuthService,
    private _snackBar: MatSnackBar
  ) { }

  form = new FormGroup({
    dni: new FormControl('', [Validators.required, Validators.minLength(7)]),
    password: new FormControl('', [Validators.required]),
  });

  get f() {
    return this.form.controls;
  }

  enviando = false;

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const credentials = {
      dni: this.form.value.dni as string,
      password: this.form.value.password as string
    };
    this.enviando = true;
    // El AuthService ya guarda el token y el usuario al iniciar sesión
    this.authService.login(credentials).subscribe({
      next: () => {
        this.enviando = false;
        this.router.navigate(['/']);
      },
      error: (error) => {
        this.enviando = false;
        const mensaje = error?.status === 401
          ? 'DNI o contraseña incorrectos.'
          : error?.status === 429
            ? 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
            : 'Ha ocurrido un error. Vuelve a intentarlo más tarde.';
        this._snackBar.open(mensaje, 'Cerrar', { duration: 5000 });
      }
    });
  }
}
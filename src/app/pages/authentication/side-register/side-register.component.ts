import { Component, OnInit } from '@angular/core';
import {
    FormGroup,
    FormControl,
    Validators,
    FormsModule,
    ReactiveFormsModule,
    AbstractControl,
    ValidationErrors,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../../material.module';
import { AuthService } from 'src/app/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorMessagesComponent } from 'src/app/error-messages/error-messages.component';

// Validador personalizado para evitar espacios al inicio o final, o multiples espacios.
function noWhitespace(control: AbstractControl): ValidationErrors | null {
    if (control.value && typeof control.value === 'string') {
        const trimmedValue = control.value.trim();
        if (trimmedValue !== control.value || /\s{2,}/.test(control.value)) {
            return { whitespace: true };
        }
    }
    return null;
}

@Component({
    selector: 'app-side-register',
    standalone: true,
    imports: [RouterModule, MaterialModule, FormsModule, ReactiveFormsModule, ErrorMessagesComponent],
    templateUrl: './side-register.component.html',
})
export class AppSideRegisterComponent implements OnInit {
    form: FormGroup;

    constructor(
        private router: Router,
        private authService: AuthService,
        private _snackBar: MatSnackBar
    ) {
        this.form = new FormGroup({
            nombre: new FormControl('', [Validators.required, noWhitespace, Validators.maxLength(50)]),
            apellido: new FormControl('', [Validators.required, noWhitespace, Validators.maxLength(50)]),
            dni: new FormControl('', [
                Validators.required,
                noWhitespace,
                Validators.minLength(7),
                Validators.maxLength(8),
                Validators.pattern('^[0-9]*$'),
            ]),
            cargo: new FormControl('', [Validators.required, noWhitespace, Validators.maxLength(50)]),
            rol: new FormControl('operador', [Validators.required]),
            password: new FormControl('', [Validators.required, noWhitespace, Validators.minLength(6)]),
        });
    }

    get f() {
        return this.form.controls;
    }

    // Función para convertir a mayúsculas
    convertToUpperCase(control: AbstractControl | null) {
        if (control && control instanceof FormControl && control.value && typeof control.value === 'string') {
            control.setValue(control.value.toUpperCase(), { emitEvent: false });
        }
    }

    ngOnInit(): void {
        ['nombre', 'apellido'].forEach((controlName) => {
            const control = this.form.get(controlName);
            if (control instanceof FormControl) {
                control.valueChanges.subscribe(() => {
                    this.convertToUpperCase(control);
                });
            }
        });
    }

    submit() {
        if (this.form.valid) {
            const newUser = {
                nombre: this.form.value.nombre as string,
                apellido: this.form.value.apellido as string,
                dni: this.form.value.dni as string,
                cargo: this.form.value.cargo as string,
                rol: this.form.value.rol as string,
                password: this.form.value.password as string,
            };

            this.authService.register(newUser).subscribe(
                (response) => {
                    this._snackBar.open('Registro exitoso. Por favor, inicia sesión.', 'Cerrar', { duration: 5000 });
                    this.router.navigate(['/authentication/login']);
                },
                (error) => {
                    console.error('Error en el registro:', error);
                    let errorMessage = 'Error al registrarse. Por favor, inténtalo de nuevo.';

                    if (error.error === 'El DNI ya está registrado') {
                        errorMessage = 'El DNI ya está registrado.';
                    } else if (error.error === 'El email ya está registrado') {
                        errorMessage = 'El email ya está registrado.';
                    }

                    this._snackBar.open(errorMessage, 'Cerrar', { duration: 5000 });
                }
            );
        }
    }
}
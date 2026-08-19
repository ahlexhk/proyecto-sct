import { effect, Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'sct-theme';

// Tema claro/oscuro persistido. Por defecto respeta la preferencia
// del sistema operativo (prefers-color-scheme). La clase se aplica en
// <html> para que los estilos de Material y los propios apliquen global.
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  readonly isDark = signal<boolean>(this.temaInicial());

  constructor() {
    effect(() => {
      const html = document.documentElement;
      html.classList.toggle('dark-theme', this.isDark());
      html.classList.toggle('light-theme', !this.isDark());
      html.style.colorScheme = this.isDark() ? 'dark' : 'light';
    });
  }

  private temaInicial(): boolean {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (guardado === 'dark') return true;
    if (guardado === 'light') return false;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }

  toggle(): void {
    this.isDark.update((v) => !v);
    localStorage.setItem(STORAGE_KEY, this.isDark() ? 'dark' : 'light');
  }
}

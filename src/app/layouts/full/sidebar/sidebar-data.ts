import { NavItem } from './nav-item/nav-item';

export const navItems: NavItem[] = [
  {
    navCap: 'Inicio',
  },
  {
    displayName: 'Consulta de equipos',
    iconName: 'search',
    bgcolor: 'primary',
    route: '/dashboard',
  },
  {
    navCap: 'Soporte técnico',
  },
  {
    displayName: 'Incidencias',
    iconName: 'alert-circle',
    bgcolor: 'primary',
    route: '/ui-components/incidents',
  },
  {
    navCap: 'Inventario',
  },
  {
    displayName: 'Registro de equipos',
    iconName: 'clipboard-plus',
    bgcolor: 'primary',
    route: '/ui-components/equipmentRegister',
  },
  {
    displayName: 'Control de equipos',
    iconName: 'adjustments',
    bgcolor: 'primary',
    route: '/ui-components/control',
  },
  {
    displayName: 'Puestos de trabajo',
    iconName: 'device-desktop',
    bgcolor: 'primary',
    route: '/ui-components/workstations',
  },
  {
    displayName: 'Reportes',
    iconName: 'report-analytics',
    bgcolor: 'primary',
    route: '/ui-components/reports',
  },

  {
    navCap: 'Cuenta',
  },
  {
    displayName: 'Iniciar sesión',
    iconName: 'lock',
    bgcolor: 'accent',
    route: '/authentication/login',
  },
  {
    displayName: 'Registrarse',
    iconName: 'user-plus',
    bgcolor: 'warning',
    route: '/authentication/register',
  },
];

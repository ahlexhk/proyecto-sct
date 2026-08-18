import { Routes } from '@angular/router';

// ui

import { ReportsComponent } from './reports/reports.component';
import { AppEquipmentComponent } from './equipment/equipment.component';
import { EquipmentControlComponent } from './equipment-control/equipment-control.component';
import { IncidentsComponent } from './incidents/incidents.component';

export const UiComponentsRoutes: Routes = [
  {
    path: '',
    children: [

      {
        path: 'incidents',
        component: IncidentsComponent,
      },
      {
        path: 'reports',
        component: ReportsComponent,
      },
      {
        path: 'equipmentRegister',
        component: AppEquipmentComponent,
      },
      {
        path: 'control',
        component: EquipmentControlComponent,
      },
    ],
  },
];

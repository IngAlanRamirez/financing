import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/differ/pages/differ.component').then((m) => m.DifferComponent),
  },
  {
    path: 'products/differed/:id',
    loadComponent: () => import('./features/differed/pages/differed.component').then((m) => m.DifferedComponent),
  },
  {
    path: 'products/simulator',
    loadComponent: () => import('./features/simulator/pages/simulator.component').then((m) => m.SimulatorComponent),
  },
  {
    path: 'products/ticket',
    loadComponent: () => import('./features/ticket/pages/ticket.component').then((m) => m.TicketComponent),
  },
  {
    path: '**',
    loadComponent: () => import('./shared/pages/page-not-found.component').then((m) => m.PageNotFoundComponent),
  },
];

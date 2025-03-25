import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'purchases',
    loadComponent: () => import('./features/purchases/purchases.component'),
  },
  {
    path: 'not-found-purchases',
    loadComponent: () => import('./features/not-found-purchases/not-found-purchases.component'),
  }

];

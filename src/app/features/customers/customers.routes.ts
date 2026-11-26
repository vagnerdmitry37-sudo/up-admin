import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./customers-page/customers-page').then((m) => m.CustomersPage),
  },
  {
    path: 'editor',
    title: 'Editor',
    loadComponent: () =>
      import('./customers-edit-page/customers-edit-page').then((m) => m.CustomersEditPage),
  },
];

export default routes;

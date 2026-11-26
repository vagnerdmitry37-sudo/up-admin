import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./orders-page/orders-page').then((m) => m.OrdersPage),
  },
  {
    path: 'editor',
    title: 'Editor',
    loadComponent: () =>
      import('./orders-edit-page/orders-edit-page').then((m) => m.OrdersEditPage),
  },
];

export default routes;

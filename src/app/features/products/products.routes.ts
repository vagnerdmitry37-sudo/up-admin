import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./products-page/products-page').then((m) => m.ProductsPage),
  },
  {
    path: 'editor',
    title: 'Editor',
    loadComponent: () =>
      import('./products-edit-page/products-edit-page').then((m) => m.ProductsEditPage),
  },
];

export default routes;

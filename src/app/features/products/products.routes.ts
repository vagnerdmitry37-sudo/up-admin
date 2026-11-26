import { AppRoute } from '@core/app-route';

const routes: AppRoute[] = [
  {
    path: '',
    title: 'Products · UP',
    loadComponent: () => import('./products-page/products-page').then((m) => m.ProductsPage),
  },
  {
    path: 'editor',
    title: 'Edit products · UP',
    data: { editPage: true },
    loadComponent: () =>
      import('./products-edit-page/products-edit-page').then((m) => m.ProductsEditPage),
  },
];

export default routes;

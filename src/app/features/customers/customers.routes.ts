import { AppRoute } from '@core/app-route';

const routes: AppRoute[] = [
  {
    path: '',
    title: 'Customers · UP',
    loadComponent: () => import('./customers-page/customers-page').then((m) => m.CustomersPage),
  },
  {
    path: 'editor',
    title: 'Edit customers · UP',
    data: { editPage: true },
    loadComponent: () =>
      import('./customers-edit-page/customers-edit-page').then((m) => m.CustomersEditPage),
  },
];

export default routes;

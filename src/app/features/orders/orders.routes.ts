import { AppRoute } from '@core/app-route';

const routes: AppRoute[] = [
  {
    path: '',
    title: 'Orders · UP',
    loadComponent: () => import('./orders-page/orders-page').then((m) => m.OrdersPage),
  },
  {
    path: 'editor',
    title: 'Edit orders · UP',
    data: { editPage: true },
    loadComponent: () =>
      import('./orders-edit-page/orders-edit-page').then((m) => m.OrdersEditPage),
  },
];

export default routes;

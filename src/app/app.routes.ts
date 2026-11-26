import { AppRoute } from '@core/app-route';
import { authGuard } from '@features/auth/auth.guard';
import { guestGuard } from '@features/auth/guest.guard';

export const routes: AppRoute[] = [
  {
    path: 'login',
    title: 'Log in · UP',
    canMatch: [guestGuard],
    loadComponent: () => import('@features/auth/login-page/login-page').then((m) => m.LoginPage),
  },
  {
    path: '',
    canMatch: [authGuard],
    loadComponent: () => import('@layout/shell').then((m) => m.Shell),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'products',
      },
      {
        path: 'orders',
        data: { heading: 'Orders' },
        loadChildren: () => import('@features/orders/orders.routes'),
      },
      {
        path: 'customers',
        data: { heading: 'Customers' },
        loadChildren: () => import('@features/customers/customers.routes'),
      },
      {
        path: 'products',
        data: { heading: 'Products' },
        loadChildren: () => import('@features/products/products.routes'),
      },
      {
        path: '**',
        title: 'Page not found · UP',
        loadComponent: () =>
          import('@features/not-found/not-found-page').then((m) => m.NotFoundPage),
      },
    ],
  },
];

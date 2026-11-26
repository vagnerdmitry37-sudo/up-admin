import { Routes } from '@angular/router';
import { authGuard } from '@features/auth/auth.guard';
import { guestGuard } from '@features/auth/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Log in',
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
        title: 'Orders',
        loadChildren: () => import('@features/orders/orders.routes'),
      },
      {
        path: 'customers',
        title: 'Customers',
        loadChildren: () => import('@features/customers/customers.routes'),
      },
      {
        path: 'products',
        title: 'Products',
        loadChildren: () => import('@features/products/products.routes'),
      },
      {
        path: '**',
        title: 'Page not found',
        loadComponent: () =>
          import('@features/not-found/not-found-page').then((m) => m.NotFoundPage),
      },
    ],
  },
];

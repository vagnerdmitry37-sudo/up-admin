import { Routes } from '@angular/router';
import { OpenngIcons } from '@openng/optimus-ui/api';
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
        data: { icon: OpenngIcons.RECEIPT },
        loadChildren: () => import('@features/orders/orders.routes'),
      },
      {
        path: 'customers',
        title: 'Customers',
        data: { icon: OpenngIcons.USERS },
        loadChildren: () => import('@features/customers/customers.routes'),
      },
      {
        path: 'products',
        title: 'Products',
        data: { icon: OpenngIcons.BOX },
        loadChildren: () => import('@features/products/products.routes'),
      },
      {
        path: '**',
        title: 'Page not found',
        data: { icon: OpenngIcons.QUESTION_CIRCLE },
        loadComponent: () =>
          import('@features/not-found/not-found-page').then((m) => m.NotFoundPage),
      },
    ],
  },
];

import { Routes } from '@angular/router';
import { authGuard } from '@features/auth/auth.guard';
import { guestGuard } from '@features/auth/guest.guard';

export const routes: Routes = [
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
        title: 'UP',
        loadComponent: () => import('@features/home/home-page').then((m) => m.HomePage),
      },
      {
        path: 'orders',
        title: 'Orders · UP',
        loadComponent: () => import('@features/orders/orders-page').then((m) => m.OrdersPage),
      },
      {
        path: 'settings',
        title: 'Settings · UP',
        loadComponent: () => import('@features/settings/settings-page').then((m) => m.SettingsPage),
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

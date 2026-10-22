import { Routes } from '@angular/router';
import { RouteCancel } from '@core/edit-actions.service';
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
        path: 'products',
        title: 'Products · UP',
        loadComponent: () =>
          import('@features/products/products-page/products-page').then((m) => m.ProductsPage),
      },
      {
        path: 'products/new',
        title: 'New product · UP',
        data: { cancel: { action: 'create', url: '/products' } satisfies RouteCancel },
        loadComponent: () =>
          import('@features/products/new-product-page/new-product-page').then(
            (m) => m.NewProductPage,
          ),
      },
      {
        path: 'products/:id/edit',
        title: 'Edit product · UP',
        data: { cancel: { action: 'edit', url: '/products' } satisfies RouteCancel },
        loadComponent: () =>
          import('@features/products/edit-product-page/edit-product-page').then(
            (m) => m.EditProductPage,
          ),
      },
      {
        path: 'profile',
        title: 'Profile · UP',
        loadComponent: () =>
          import('@features/profile/profile-page/profile-page').then((m) => m.ProfilePage),
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

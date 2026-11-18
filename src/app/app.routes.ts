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
        redirectTo: 'products',
      },
      {
        path: 'orders',
        title: 'Orders · UP',
        loadComponent: () =>
          import('@features/orders/orders-page/orders-page').then((m) => m.OrdersPage),
      },
      {
        path: 'edit-orders-page',
        title: 'Edit orders · UP',
        loadComponent: () =>
          import('@features/orders/edit-orders-page/edit-orders-page').then(
            (m) => m.EditOrdersPage,
          ),
      },
      {
        path: 'customers',
        title: 'Customers · UP',
        loadComponent: () =>
          import('@features/customers/customers-page/customers-page').then(
            (m) => m.CustomersPage,
          ),
      },
      {
        path: 'edit-customers-page',
        title: 'Edit customers · UP',
        loadComponent: () =>
          import('@features/customers/edit-customers-page/edit-customers-page').then(
            (m) => m.EditCustomersPage,
          ),
      },
      {
        path: 'products',
        title: 'Products · UP',
        loadComponent: () =>
          import('@features/products/products-page/products-page').then((m) => m.ProductsPage),
      },
      {
        path: 'edit-products-page',
        title: 'Edit products · UP',
        loadComponent: () =>
          import('@features/products/edit-products-page/edit-products-page').then(
            (m) => m.EditProductsPage,
          ),
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

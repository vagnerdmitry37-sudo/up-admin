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
        path: 'order',
        title: 'Edit orders · UP',
        loadComponent: () =>
          import('@features/orders/edit-order-page/edit-order-page').then(
            (m) => m.EditOrderPage,
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
        path: 'customer',
        title: 'Edit customers · UP',
        loadComponent: () =>
          import('@features/customers/edit-customer-page/edit-customer-page').then(
            (m) => m.EditCustomerPage,
          ),
      },
      {
        path: 'products',
        title: 'Products · UP',
        loadComponent: () =>
          import('@features/products/products-page/products-page').then((m) => m.ProductsPage),
      },
      {
        path: 'product/:id',
        title: 'Edit products · UP',
        loadComponent: () =>
          import('@features/products/edit-product-page/edit-product-page').then(
            (m) => m.EditProductPage,
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

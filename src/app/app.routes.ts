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
      // test
      {
        path: 'products-test',
        title: 'Order Items · UP',
        loadComponent: () =>
          import('@tests/features/products/products-page/products-page').then((m) => m.ProductsPage),
      },
      {
        path: 'product-test',
        title: 'Product · UP',
        loadComponent: () =>
          import('@tests/features/products/product-page/product-page').then((m) => m.ProductPage),
      },
      {
        path: 'orders-test',
        title: 'Orders · UP',
        loadComponent: () =>
          import('@tests/features/orders/orders-page/orders-page').then((m) => m.OrdersPage),
      },
      {
        path: 'order-test',
        title: 'Order Items · UP',
        loadComponent: () =>
          import('@tests/features/orders/order-page/order-page').then((m) => m.OrderPage),
      },
      // test
      {
        path: 'orders/new',
        title: 'New order · UP',
        loadComponent: () =>
          import('@features/orders/order-page/order-page').then((m) => m.OrderPage),
      },
      {
        path: 'orders/:ids/edit',
        title: 'Edit orders · UP',
        loadComponent: () =>
          import('@features/orders/edit-order-page/edit-order-page').then((m) => m.EditOrderPage),
      },
      {
        path: 'orders/:id',
        pathMatch: 'full',
        redirectTo: 'orders/:id/edit',
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
        loadComponent: () =>
          import('@features/products/new-product-page/new-product-page').then(
            (m) => m.NewProductPage,
          ),
      },
      {
        path: 'products/:ids/edit',
        title: 'Edit products · UP',
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

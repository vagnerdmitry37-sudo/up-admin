import { Route } from '@angular/router';
import { authGuard } from '@features/auth/auth.guard';
import { guestGuard } from '@features/auth/guest.guard';

export interface AppRouteData {
  heading: string;
  editPage?: boolean;
}

interface AppRoute extends Route {
  data?: Partial<AppRouteData>;
  children?: AppRoute[];
}

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
        children: [
          {
            path: '',
            title: 'Orders · UP',
            loadComponent: () =>
              import('@features/orders-test/orders-page/orders-page').then(
                (m) => m.OrdersPageTest,
              ),
          },
          {
            path: 'editor',
            title: 'Edit orders · UP',
            data: { editPage: true },
            loadComponent: () =>
              import('@features/orders-test/orders-edit-page/orders-edit-page').then(
                (m) => m.OrdersEditPage,
              ),
          },
        ],
      },
      {
        path: 'edit-order-items-page/:orderId',
        title: 'Edit order items · UP',
        data: { heading: 'Order items', editPage: true },
        loadComponent: () =>
          import('@features/orders/edit-order-items-page/edit-order-items-page').then(
            (m) => m.EditOrderItemsPage,
          ),
      },
      {
        path: 'customers',
        data: { heading: 'Customers' },
        children: [
          {
            path: '',
            title: 'Customers · UP',
            loadComponent: () =>
              import('@features/customers/customers-page/customers-page').then(
                (m) => m.CustomersPage,
              ),
          },
          {
            path: 'editor',
            title: 'Edit customers · UP',
            data: { editPage: true },
            loadComponent: () =>
              import('@features/customers/edit-customers-page/edit-customers-page').then(
                (m) => m.EditCustomersPage,
              ),
          },
        ],
      },
      {
        path: 'products',
        data: { heading: 'Products' },
        children: [
          {
            path: '',
            title: 'Products · UP',
            loadComponent: () =>
              import('@features/products-test/products-page/products-page').then(
                (m) => m.ProductsPageTest,
              ),
          },
          {
            path: 'editor',
            title: 'Edit products · UP',
            data: { editPage: true },
            loadComponent: () =>
              import('@features/products-test/products-edit-page/products-edit-page').then(
                (m) => m.ProductsEditPage,
              ),
          },
        ],
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

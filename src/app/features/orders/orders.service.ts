import { Injectable, inject } from '@angular/core';
import { ApiClient } from '@core/api-client';
import { API_BASE_URL } from '@core/api-base-url';
import {
  CreateOrderRequest,
  CustomersPageResponse,
  Order,
  OrdersPageResponse,
  ProductSortField,
  ProductsPageResponse,
  UpdateOrderRequest,
} from '@core/api/models';
import { firstValueFrom, map } from 'rxjs';

const MAX_PRODUCT_OPTIONS = 20;
const MAX_CUSTOMER_OPTIONS = 20;

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly api = inject(ApiClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly url = `${this.apiBaseUrl}/orders`;

  list = (first: number, rows: number) =>
    this.api.get<OrdersPageResponse>(this.url, { params: { first, rows } });

  get = (ids: string[]) => this.api.get<Order[]>(`${this.url}/by-ids`, { params: { ids } });

  create = (request: CreateOrderRequest) => firstValueFrom(this.api.post<Order>(this.url, request));

  update = (requests: UpdateOrderRequest[]) =>
    firstValueFrom(this.api.put<Order[]>(this.url, requests));

  delete = (ids: string[]) => firstValueFrom(this.api.delete<void>(this.url, { params: { ids } }));

  searchCustomers = (query: string) =>
    this.api
      .get<CustomersPageResponse>(`${this.apiBaseUrl}/customers`, {
        params: { globalFilter: query, rows: MAX_CUSTOMER_OPTIONS },
      })
      .pipe(map((page) => page.items));

  searchProducts = (query: string) =>
    this.api
      .get<ProductsPageResponse>(`${this.apiBaseUrl}/products`, {
        params: {
          globalFilter: query,
          rows: MAX_PRODUCT_OPTIONS,
          sortField: 'Name' satisfies ProductSortField,
        },
      })
      .pipe(map((page) => page.items));
}

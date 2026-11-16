import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '@core/api-base-url';
import {
  CreateOrderItemRequest,
  CreateOrderRequest,
  Order,
  OrdersPageResponse,
  ProductSortField,
  ProductsPageResponse,
  UpdateOrderCustomerRequest,
} from '@core/api/models';
import { firstValueFrom, map } from 'rxjs';

const MAX_PRODUCT_OPTIONS = 200;

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly httpClient = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly url = `${this.apiBaseUrl}/orders`;

  list = (first: number, rows: number) =>
    this.httpClient.get<OrdersPageResponse>(this.url, { params: { first, rows } });

  get = (id: string) => this.httpClient.get<Order>(`${this.url}/${id}`);

  create = (request: CreateOrderRequest) =>
    firstValueFrom(this.httpClient.post<Order>(this.url, request));

  createItem = (orderId: string, request: CreateOrderItemRequest) =>
    firstValueFrom(this.httpClient.post<Order>(`${this.url}/${orderId}/items`, request));

  updateCustomer = (orderId: string, request: UpdateOrderCustomerRequest) =>
    firstValueFrom(this.httpClient.put<Order>(`${this.url}/${orderId}/customer`, request));

  getProducts = () =>
    this.httpClient
      .get<ProductsPageResponse>(`${this.apiBaseUrl}/products`, {
        params: { rows: MAX_PRODUCT_OPTIONS, sortField: 'Name' satisfies ProductSortField },
      })
      .pipe(map((page) => page.items));
}

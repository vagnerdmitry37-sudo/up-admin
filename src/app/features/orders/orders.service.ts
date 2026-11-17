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
  UpdateOrderItemRequest,
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

  get = (ids: string[]) => this.httpClient.get<Order[]>(`${this.url}/by-ids`, { params: { ids } });

  create = (request: CreateOrderRequest) =>
    firstValueFrom(this.httpClient.post<Order>(this.url, request));

  createItem = (orderId: string, request: CreateOrderItemRequest) =>
    firstValueFrom(this.httpClient.post<Order>(`${this.url}/${orderId}/items`, request));

  updateItem = (orderId: string, itemId: string, request: UpdateOrderItemRequest) =>
    firstValueFrom(this.httpClient.put<Order>(`${this.url}/${orderId}/items/${itemId}`, request));

  deleteItems = (orderId: string, ids: string[]) =>
    firstValueFrom(
      this.httpClient.delete<Order>(`${this.url}/${orderId}/items`, { params: { ids } }),
    );

  updateCustomer = (orderId: string, request: UpdateOrderCustomerRequest) =>
    firstValueFrom(this.httpClient.put<Order>(`${this.url}/${orderId}/customer`, request));

  delete = (ids: string[]) =>
    firstValueFrom(this.httpClient.delete<void>(this.url, { params: { ids } }));

  getProducts = () =>
    this.httpClient
      .get<ProductsPageResponse>(`${this.apiBaseUrl}/products`, {
        params: { rows: MAX_PRODUCT_OPTIONS, sortField: 'Name' satisfies ProductSortField },
      })
      .pipe(map((page) => page.items));
}

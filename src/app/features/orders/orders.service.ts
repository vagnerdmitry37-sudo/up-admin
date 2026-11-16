import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '@core/api-base-url';
import {
  CreateOrderRequest,
  Order,
  OrdersPageResponse,
  ProductSortField,
  ProductsPageResponse,
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

  create = (request: CreateOrderRequest) =>
    firstValueFrom(this.httpClient.post<Order>(this.url, request));

  getProducts = () =>
    this.httpClient
      .get<ProductsPageResponse>(`${this.apiBaseUrl}/products`, {
        params: { rows: MAX_PRODUCT_OPTIONS, sortField: 'Name' satisfies ProductSortField },
      })
      .pipe(map((page) => page.items));
}

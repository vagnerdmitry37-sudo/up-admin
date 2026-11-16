import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '@core/api-base-url';
import { OrdersPageResponse } from '@core/api/models';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly httpClient = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/orders`;

  list = (first: number, rows: number) =>
    this.httpClient.get<OrdersPageResponse>(this.url, { params: { first, rows } });
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '@core/api-base-url';
import { CreateOrderItemRequest, Order, OrderItem, UpdateOrderItemRequest } from '@core/api/models';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class OrderItemsService {
  private readonly httpClient = inject(HttpClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private readonly url = (orderId: string) => `${this.apiBaseUrl}/orders/${orderId}/items`;

  create = (orderId: string, request: CreateOrderItemRequest) =>
    firstValueFrom(this.httpClient.post<OrderItem>(this.url(orderId), request));

  update = (orderId: string, requests: UpdateOrderItemRequest[]) =>
    firstValueFrom(this.httpClient.put<Order>(this.url(orderId), requests));

  delete = (orderId: string, ids: string[]) =>
    firstValueFrom(this.httpClient.delete<Order>(this.url(orderId), { params: { ids } }));
}

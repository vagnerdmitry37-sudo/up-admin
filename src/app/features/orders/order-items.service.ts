import { Injectable, inject } from '@angular/core';
import { ApiClient } from '@core/api-client';
import { API_BASE_URL } from '@core/api-base-url';
import { CreateOrderItemRequest, Order, OrderItem, UpdateOrderItemRequest } from '@core/api/models';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class OrderItemsService {
  private readonly api = inject(ApiClient).forEntity('order item');
  private readonly apiBaseUrl = inject(API_BASE_URL);

  private readonly url = (orderId: string) => `${this.apiBaseUrl}/orders/${orderId}/items`;

  create = (orderId: string, request: CreateOrderItemRequest) =>
    firstValueFrom(this.api.post<OrderItem>(this.url(orderId), request));

  update = (orderId: string, requests: UpdateOrderItemRequest[]) =>
    firstValueFrom(this.api.put<Order>(this.url(orderId), requests));

  delete = (orderId: string, ids: string[]) =>
    firstValueFrom(this.api.delete<Order>(this.url(orderId), { params: { ids } }));
}

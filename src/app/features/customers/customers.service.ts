import { Injectable, inject } from '@angular/core';
import { ApiClient } from '@core/api-client';
import { API_BASE_URL } from '@core/api-base-url';
import {
  CreateCustomerRequest,
  Customer,
  CustomersPageResponse,
  UpdateCustomerRequest,
} from '@core/api/models';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private readonly api = inject(ApiClient);
  private readonly url = `${inject(API_BASE_URL)}/customers`;

  list = (first: number, rows: number) =>
    this.api.get<CustomersPageResponse>(this.url, {
      params: { first, rows },
      track: { entity: 'customer', operation: 'list' },
    });

  get = (ids: string[]) =>
    this.api.get<Customer[]>(`${this.url}/by-ids`, {
      params: { ids },
      track: { entity: 'customer', operation: 'get' },
    });

  create = (request: CreateCustomerRequest) =>
    firstValueFrom(this.api.post<Customer>(this.url, request));

  update = (requests: UpdateCustomerRequest[]) =>
    firstValueFrom(this.api.put<Customer[]>(this.url, requests));

  delete = (ids: string[]) =>
    firstValueFrom(
      this.api.delete<void>(this.url, {
        params: { ids },
        track: { entity: 'customer', operation: 'delete' },
      }),
    );
}

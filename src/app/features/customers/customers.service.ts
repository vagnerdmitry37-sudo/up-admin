import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '@core/api-base-url';
import { CreateCustomerRequest, Customer, CustomersPageResponse } from '@core/api/models';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private readonly httpClient = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/customers`;

  list = (first: number, rows: number) =>
    this.httpClient.get<CustomersPageResponse>(this.url, { params: { first, rows } });

  get = (ids: string[]) =>
    this.httpClient.get<Customer[]>(`${this.url}/by-ids`, { params: { ids } });

  create = (request: CreateCustomerRequest) =>
    firstValueFrom(this.httpClient.post<Customer>(this.url, request));
}

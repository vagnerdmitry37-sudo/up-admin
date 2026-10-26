import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '@core/api-base-url';
import {
  CreateProductRequest,
  Product,
  ProductsPageResponse,
  UpdateProductRequest,
} from '@core/api/models';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly httpClient = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/products`;

  list = (first: number, rows: number) =>
    this.httpClient.get<ProductsPageResponse>(this.url, { params: { first, rows } });

  get = (ids: string[]) =>
    this.httpClient.get<Product[]>(`${this.url}/by-ids`, { params: { ids } });

  create = (requests: CreateProductRequest[]) =>
    firstValueFrom(this.httpClient.post<Product[]>(this.url, requests));

  update = (requests: UpdateProductRequest[]) =>
    firstValueFrom(this.httpClient.put<Product[]>(this.url, requests));

  delete = (ids: string[]) =>
    firstValueFrom(this.httpClient.delete<void>(this.url, { params: { ids } }));
}

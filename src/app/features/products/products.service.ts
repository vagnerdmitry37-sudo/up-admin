import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '@core/api-base-url';
import { CreateProductRequest, Product, UpdateProductRequest } from '@core/api/models';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly httpClient = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/products`;

  get = (ids: string[]) => this.httpClient.get<Product[]>(this.url, { params: { ids } });

  create = (requests: CreateProductRequest[]) =>
    firstValueFrom(this.httpClient.post<Product[]>(this.url, requests));

  update = (requests: UpdateProductRequest[]) =>
    firstValueFrom(this.httpClient.put<Product[]>(this.url, requests));
}

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '@core/api-base-url';
import { CreateProductRequest, Product, UpdateProductRequest } from '@core/api/models';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/products`;

  create = (request: CreateProductRequest) =>
    firstValueFrom(this.http.post<Product>(this.url, request));

  update = (id: string, request: UpdateProductRequest) =>
    firstValueFrom(this.http.put<Product>(`${this.url}/${id}`, request));
}

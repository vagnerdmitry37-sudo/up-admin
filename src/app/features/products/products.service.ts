import { Injectable, inject } from '@angular/core';
import { ApiClient } from '@core/api-client';
import { API_BASE_URL } from '@core/api-base-url';
import {
  CreateProductRequest,
  Image,
  Product,
  ProductDetails,
  ProductsPageResponse,
  UpdateImageOrderRequest,
  UpdateProductRequest,
} from '@core/api/models';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly api = inject(ApiClient);
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly url = `${this.apiBaseUrl}/products`;
  private readonly imagesUrl = `${this.apiBaseUrl}/images`;

  list = (first: number, rows: number) =>
    this.api.get<ProductsPageResponse>(this.url, {
      params: { first, rows },
      track: 'products.list',
    });

  get = (ids: string[]) =>
    this.api.get<ProductDetails[]>(`${this.url}/by-ids`, { params: { ids } });

  create = (requests: CreateProductRequest[]) =>
    firstValueFrom(this.api.post<Product[]>(this.url, requests));

  update = (requests: UpdateProductRequest[]) =>
    firstValueFrom(this.api.put<Product[]>(this.url, requests));

  delete = (ids: string[]) => firstValueFrom(this.api.delete<void>(this.url, { params: { ids } }));

  deleteImages = (ids: string[]) =>
    firstValueFrom(this.api.delete<void>(this.imagesUrl, { params: { ids } }));

  getImages = (productIds: string[]) =>
    this.api.get<Image[]>(this.imagesUrl, {
      params: { entityType: 'Product', entityIds: productIds },
    });

  updateImageOrder = (productId: string, imageIds: string[]) =>
    firstValueFrom(
      this.api.put<Image[]>(`${this.imagesUrl}/order`, {
        entityType: 'Product',
        entityId: productId,
        imageIds,
      } satisfies UpdateImageOrderRequest),
    );

  uploadImages(productId: string, files: File[]): Promise<Image[]> {
    const form = new FormData();
    form.append('entityType', 'Product');
    form.append('entityId', productId);
    for (const file of files) {
      form.append('files', file, file.name);
    }
    return firstValueFrom(this.api.post<Image[]>(this.imagesUrl, form));
  }
}

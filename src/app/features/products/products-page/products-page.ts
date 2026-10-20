import { DecimalPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { API_BASE_URL } from '@core/api-base-url';
import { Product } from '@core/api/models';

@Component({
  selector: 'app-products-page',
  imports: [DecimalPipe],
  templateUrl: './products-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPage {
  private readonly url = `${inject(API_BASE_URL)}/products`;

  protected readonly products = httpResource<Product[]>(() => this.url);
}

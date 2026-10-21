import { DecimalPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { API_BASE_URL } from '@core/api-base-url';
import { Product } from '@core/api/models';
import { AppButton } from '@shared/button/button';
import { ProductForm } from '../product-form/product-form';

@Component({
  selector: 'app-products-page',
  imports: [DecimalPipe, RouterLink, AppButton, ProductForm],
  templateUrl: './products-page.html',
  styleUrl: './products-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPage {
  private readonly url = `${inject(API_BASE_URL)}/products`;

  protected readonly products = httpResource<Product[]>(() => this.url);
}

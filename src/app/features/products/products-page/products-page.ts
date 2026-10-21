import { DecimalPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { API_BASE_URL } from '@core/api-base-url';
import { Product } from '@core/api/models';
import { ProductForm } from '../product-form/product-form';
import { EditActionsService } from '@core/edit-actions.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-products-page',
  imports: [DecimalPipe, ProductForm],
  templateUrl: './products-page.html',
  styleUrl: './products-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPage {
  private readonly url = `${inject(API_BASE_URL)}/products`;
  private readonly router = inject(Router);

  protected readonly products = httpResource<Product[]>(() => this.url);

  constructor() {
    inject(EditActionsService).register({
      create: () => this.router.navigate(['/products/new']),
    });
  }
}

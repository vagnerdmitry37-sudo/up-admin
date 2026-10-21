import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ProductForm } from '../product-form/product-form';

@Component({
  selector: 'app-new-product-page',
  imports: [ProductForm],
  templateUrl: './new-product-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewProductPage {
  private readonly router = inject(Router);

  protected openList = () => this.router.navigateByUrl('/products');
}

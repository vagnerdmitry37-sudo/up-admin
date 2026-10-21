import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { API_BASE_URL } from '@core/api-base-url';
import { CreateProductRequest, Product, ProductType } from '@core/api/models';
import { EditActionsService } from '@core/edit-actions.service';
import { FormShell } from '@shared/form-shell/form-shell';
import { NumberField } from '@shared/form-fields/number-field/number-field';
import { SelectField } from '@shared/form-fields/select-field/select-field';
import { TextField } from '@shared/form-fields/text-field/text-field';
import { TextareaField } from '@shared/form-fields/textarea-field/textarea-field';
import { firstValueFrom } from 'rxjs';
import { PRODUCT_TYPES } from '../constants';

@Component({
  selector: 'app-product-form',
  imports: [FormShell, NumberField, SelectField, TextField, TextareaField],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductForm {
  readonly heading = input('New product');
  readonly created = output<Product>();

  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/products`;
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly shell = viewChild.required(FormShell);

  protected readonly typeOptions = PRODUCT_TYPES.map((type) => ({
    label: type,
    value: type,
  }));
  protected readonly form = this.formBuilder.group({
    type: this.formBuilder.control<ProductType | null>(null, Validators.required),
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.maxLength(5000)]],
    price: this.formBuilder.control<number | null>(null, [Validators.required, Validators.min(0)]),
  });
  protected readonly submitting = signal(false);

  constructor() {
    inject(EditActionsService).register({
      save: () => this.shell().submit(),
    });
  }

  protected async submit(): Promise<void> {
    if (this.submitting()) {
      return;
    }
    this.submitting.set(true);
    const request: CreateProductRequest = this.form.getRawValue() as CreateProductRequest;
    request.attributes = '{}';
    this.created.emit(await firstValueFrom(this.http.post<Product>(this.url, request)));
    this.submitting.set(false);
  }
}

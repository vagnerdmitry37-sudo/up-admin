import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { CreateProductRequest, Product, ProductType } from '@core/api/models';
import { ReferenceDataService } from '@core/reference-data.service';
import { NumberField } from '@shared/form-fields/number-field/number-field';
import { SelectField } from '@shared/form-fields/select-field/select-field';
import { TextField } from '@shared/form-fields/text-field/text-field';
import { TextareaField } from '@shared/form-fields/textarea-field/textarea-field';
import { EntityForm } from '@shared/entity-form/entity-form';

export type ProductFormValue = CreateProductRequest;

@Component({
  selector: 'app-product-form',
  imports: [NumberField, SelectField, TextField, TextareaField, EntityForm],
  templateUrl: './product-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductForm {
  readonly product = input<Product>();

  private readonly formBuilder = inject(NonNullableFormBuilder);

  protected readonly productTypes = inject(ReferenceDataService).productTypes;
  protected readonly form = this.formBuilder.group({
    type: this.formBuilder.control<ProductType | null>(null, Validators.required),
    name: ['', [Validators.required, Validators.maxLength(200)]],
    shortDescription: ['', [Validators.maxLength(200)]],
    seoDescription: ['', [Validators.required, Validators.maxLength(160)]],
    price: this.formBuilder.control<number>(0, [Validators.required, Validators.min(0)]),
  });
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import {
  CreateProductRequest,
  Product,
  ProductType,
  ProductTypeDefinition,
} from '@core/api/models';
import { NumberField } from '@shared/form-fields/number-field/number-field';
import { SelectField } from '@shared/form-fields/select-field/select-field';
import { RichTextField } from '@shared/form-fields/rich-text-field/rich-text-field';
import { TextField } from '@shared/form-fields/text-field/text-field';
import { TextareaField } from '@shared/form-fields/textarea-field/textarea-field';
import { EntityForm } from '@tests/shared/entity-form/entity-form';

export type ProductFormValue = CreateProductRequest;

@Component({
  selector: 'app-product-form',
  imports: [NumberField, RichTextField, SelectField, TextField, TextareaField, EntityForm],
  templateUrl: './product-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductForm {
  readonly product = input<Product>();
  readonly productTypes = input<ProductTypeDefinition[]>([]);

  private readonly formBuilder = inject(NonNullableFormBuilder);

  protected readonly typeOptions = computed(() =>
    this.productTypes().map(({ type, label }) => ({ label, value: type })),
  );
  protected readonly form = this.formBuilder.group({
    type: this.formBuilder.control<ProductType | null>(null, Validators.required),
    name: ['', [Validators.required, Validators.maxLength(200)]],
    shortDescription: ['', [Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(20000)]],
    seoDescription: ['', [Validators.required, Validators.maxLength(160)]],
    price: this.formBuilder.control<number>(0, [Validators.required, Validators.min(0)]),
  });

  constructor() {
    effect(() => {
      const product = this.product();
      if (product) {
        untracked(() => this.form.reset(product));
      }
    });
  }
}

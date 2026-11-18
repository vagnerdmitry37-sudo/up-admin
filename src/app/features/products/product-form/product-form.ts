import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
import { EntityForm } from '@shared/entity-form/entity-form';
import {
  AttributeValue,
  ProductAttributesFields,
} from '../product-attributes-fields/product-attributes-fields';

export type ProductFormValue = CreateProductRequest;

@Component({
  selector: 'app-product-form',
  imports: [
    NumberField,
    ProductAttributesFields,
    RichTextField,
    SelectField,
    TextField,
    TextareaField,
    EntityForm,
  ],
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
  protected readonly attributes = this.formBuilder.record<AttributeValue>({});
  protected readonly form = this.formBuilder.group({
    type: this.formBuilder.control<ProductType | null>(null, Validators.required),
    name: ['', [Validators.required, Validators.maxLength(200)]],
    shortDescription: ['', [Validators.maxLength(200)]],
    description: ['', [Validators.maxLength(20000)]],
    seoDescription: ['', [Validators.required, Validators.maxLength(160)]],
    price: this.formBuilder.control<number>(0, [Validators.required, Validators.min(0)]),
    attributes: this.attributes,
  });
  protected readonly selectedType = toSignal(this.form.controls.type.valueChanges, {
    initialValue: this.form.controls.type.value,
  });
}

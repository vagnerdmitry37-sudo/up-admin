import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { NonNullableFormBuilder, Validators } from '@angular/forms';
import { CreateProductRequest, Image, Product, ProductType } from '@core/api/models';
import { FormShell } from '@shared/form-shell/form-shell';
import { NumberField } from '@shared/form-fields/number-field/number-field';
import { SelectField } from '@shared/form-fields/select-field/select-field';
import { TextField } from '@shared/form-fields/text-field/text-field';
import { TextareaField } from '@shared/form-fields/textarea-field/textarea-field';
import { ImageUpload } from '@shared/image-upload/image-upload';
import { PRODUCT_TYPES } from '../constants';

export type ProductFormValue = Omit<CreateProductRequest, 'attributes'>;

@Component({
  selector: 'app-product-form',
  imports: [FormShell, ImageUpload, NumberField, SelectField, TextField, TextareaField],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductForm {
  readonly heading = input('New product');
  readonly product = input<Product>();
  readonly images = input<Image[]>([]);
  readonly submitted = output<ProductFormValue>();

  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly shell = viewChild.required(FormShell);
  private readonly imageUpload = viewChild(ImageUpload);

  readonly selectedImages = computed(() => this.imageUpload()?.selection() ?? []);

  protected readonly typeOptions = PRODUCT_TYPES.map((type) => ({
    label: type,
    value: type,
  }));
  protected readonly form = this.formBuilder.group({
    type: this.formBuilder.control<ProductType>('Excursion', Validators.required),
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.maxLength(5000)]],
    price: this.formBuilder.control<number>(0, [Validators.required, Validators.min(0)]),
  });

  constructor() {
    effect(() => {
      const product = this.product();
      if (product) {
        this.form.reset(product);
      }
    });
  }

  save = () => this.shell().submit();

  deleteSelectedImages = () => this.imageUpload()?.deleteSelected();

  pendingImages = (): File[] => this.imageUpload()?.pendingFiles() ?? [];

  validValue(): ProductFormValue | undefined {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return undefined;
    }
    return this.form.getRawValue();
  }

  protected submit(): void {
    this.submitted.emit(this.form.getRawValue());
  }
}

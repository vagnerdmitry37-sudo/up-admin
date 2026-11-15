import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormRecord, NonNullableFormBuilder, Validators } from '@angular/forms';
import {
  CreateProductRequest,
  Image,
  Product,
  ProductType,
  ProductTypeDefinition,
} from '@core/api/models';
import { FormShell } from '@shared/form-shell/form-shell';
import { NumberField } from '@shared/form-fields/number-field/number-field';
import { SelectField } from '@shared/form-fields/select-field/select-field';
import { RichTextField } from '@shared/form-fields/rich-text-field/rich-text-field';
import { TextField } from '@shared/form-fields/text-field/text-field';
import { TextareaField } from '@shared/form-fields/textarea-field/textarea-field';
import { ImageUpload } from '@shared/image-upload/image-upload';
import { SaveStatus, SaveZone } from '@shared/save-zone/save-zone';
import { map, startWith } from 'rxjs';
import {
  AttributeField,
  AttributeValue,
  attributeField,
  attributeValues,
  filledAttributes,
} from '../product-attributes';

export type ProductFormValue = CreateProductRequest;

@Component({
  selector: 'app-product-form',
  imports: [
    FormShell,
    ImageUpload,
    NumberField,
    RichTextField,
    SaveZone,
    SelectField,
    TextField,
    TextareaField,
  ],
  templateUrl: './product-form.html',
  styleUrl: './product-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductForm {
  readonly heading = input('New product');
  readonly product = input<Product>();
  readonly productTypes = input<ProductTypeDefinition[]>([]);
  readonly images = input<Image[]>([]);
  readonly formStatus = input<SaveStatus>('idle');
  readonly imagesStatus = input<SaveStatus>('idle');
  readonly submitted = output<ProductFormValue>();

  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly shell = viewChild.required(FormShell);
  private readonly imageUpload = viewChild(ImageUpload);

  readonly selectedImages = computed(() => this.imageUpload()?.selection() ?? []);
  readonly selectedSavedImages = computed(() => this.imageUpload()?.savedSelection() ?? []);

  private readonly attributes = new FormRecord<FormControl<AttributeValue>>({});

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
    attributes: this.attributes,
  });

  private readonly selectedType = toSignal(
    this.form.controls.type.valueChanges.pipe(startWith(this.form.controls.type.value)),
    { requireSync: true },
  );

  protected readonly definition = computed(() =>
    this.productTypes().find(({ type }) => type === this.selectedType()),
  );
  protected readonly attributeFields = signal<AttributeField[]>([]);

  private readonly fieldsChanged = toSignal(this.form.events.pipe(map(() => this.form.dirty)), {
    initialValue: false,
  });

  readonly hasUnsavedChanges = computed(
    () =>
      this.fieldsChanged() ||
      Boolean(this.imageUpload()?.pendingFiles().length) ||
      Boolean(this.imageUpload()?.orderChanged()),
  );

  constructor() {
    effect(() => {
      const firstType = this.productTypes()[0]?.type;
      const typeControl = this.form.controls.type;
      if (firstType && typeControl.value === null && !untracked(this.product)) {
        typeControl.setValue(firstType);
      }
    });

    effect(() => {
      const product = this.product();
      if (product) {
        untracked(() => {
          const { attributes, ...fields } = product;
          this.form.reset(fields);
          this.showAttributes(attributeValues(attributes));
        });
      }
    });

    effect(() => {
      this.definition();
      untracked(() =>
        this.showAttributes({
          ...attributeValues(this.product()?.attributes),
          ...this.attributes.getRawValue(),
        }),
      );
    });
  }

  hasChanges = () => this.form.dirty;

  markSaved = () => this.form.markAsPristine();

  save = () => this.shell().submit();

  deleteSelectedImages = () => this.imageUpload()?.deleteSelected();

  clearSavedImageSelection = () => this.imageUpload()?.savedSelection.set([]);

  pendingImages = (): File[] => this.imageUpload()?.pendingFiles() ?? [];

  clearPendingImages = () => this.imageUpload()?.clearPending();

  changedImageOrder(): string[] | undefined {
    const imageUpload = this.imageUpload();
    return imageUpload?.orderChanged()
      ? imageUpload.orderedImages().map((image) => image.id)
      : undefined;
  }

  validValue(): ProductFormValue | undefined {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return undefined;
    }
    return this.formValue();
  }

  protected submit(): void {
    const value = this.formValue();
    if (value) {
      this.submitted.emit(value);
    }
  }

  private formValue(): ProductFormValue | undefined {
    const { type, attributes, ...fields } = this.form.getRawValue();
    return type ? { ...fields, type, attributes: filledAttributes(attributes) } : undefined;
  }

  private showAttributes(values: Record<string, unknown>): void {
    for (const key of Object.keys(this.attributes.controls)) {
      this.attributes.removeControl(key, { emitEvent: false });
    }
    const fields = (this.definition()?.attributes ?? []).map((definition) =>
      attributeField(definition, values[definition.key]),
    );
    for (const field of fields) {
      this.attributes.addControl(field.definition.key, field.control, { emitEvent: false });
    }
    this.attributes.updateValueAndValidity();
    this.attributeFields.set(fields);
  }
}

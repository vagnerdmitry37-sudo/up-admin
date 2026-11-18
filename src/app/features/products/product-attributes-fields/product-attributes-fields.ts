import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import {
  FormControl,
  FormRecord,
  NonNullableFormBuilder,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { AttributeDefinition, Product, ProductType, ProductTypeDefinition } from '@core/api/models';
import { NumberField } from '@shared/form-fields/number-field/number-field';
import { TextField } from '@shared/form-fields/text-field/text-field';

export type AttributeValue = string | number | null;

interface AttributeField {
  definition: AttributeDefinition;
  control: FormControl<AttributeValue>;
  messages: Record<string, string>;
}

const attributeValidators = (definition: AttributeDefinition): ValidatorFn[] => [
  ...(definition.required ? [Validators.required] : []),
  ...(definition.min !== null ? [Validators.min(definition.min)] : []),
  ...(definition.maxLength !== null ? [Validators.maxLength(definition.maxLength)] : []),
];

const attributeMessages = (definition: AttributeDefinition): Record<string, string> => ({
  required: `Enter ${definition.label.toLowerCase()}.`,
  min: `Enter ${definition.min} or more.`,
  maxlength: `Use ${definition.maxLength} characters or fewer.`,
});

@Component({
  selector: 'app-product-attributes-fields',
  imports: [NumberField, TextField],
  templateUrl: './product-attributes-fields.html',
  styleUrl: './product-attributes-fields.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductAttributesFields {
  readonly control = input.required<FormRecord<FormControl<AttributeValue>>>();
  readonly type = input<ProductType | null>(null);
  readonly productTypes = input<ProductTypeDefinition[]>([]);
  readonly product = input<Product>();

  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly definitions = computed(
    () => this.productTypes().find(({ type }) => type === this.type())?.attributes ?? [],
  );

  protected readonly fields = signal<AttributeField[]>([]);

  constructor() {
    effect(() => {
      const definitions = this.definitions();
      untracked(() => this.showFields(definitions));
    });
  }

  private readonly showFields = (definitions: AttributeDefinition[]) => {
    const attributes = this.control();
    const product = this.product();
    const savedValues = (product?.type === this.type() ? product?.attributes : {}) as Record<
      string,
      AttributeValue
    >;

    for (const key of Object.keys(attributes.controls)) {
      if (!definitions.some((definition) => definition.key === key)) {
        attributes.removeControl(key, { emitEvent: false });
      }
    }
    for (const definition of definitions) {
      if (!attributes.contains(definition.key)) {
        attributes.addControl(
          definition.key,
          this.formBuilder.control<AttributeValue>(
            savedValues[definition.key] ?? null,
            attributeValidators(definition),
          ),
          { emitEvent: false },
        );
      }
    }

    this.fields.set(
      definitions.map((definition) => ({
        definition,
        control: attributes.controls[definition.key],
        messages: attributeMessages(definition),
      })),
    );
  };
}

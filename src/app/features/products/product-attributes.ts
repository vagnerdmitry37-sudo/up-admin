import { FormControl, ValidatorFn, Validators } from '@angular/forms';
import { AttributeDefinition } from '@core/api/models';

export type AttributeValue = string | number | null;

export interface AttributeField {
  definition: AttributeDefinition;
  control: FormControl<AttributeValue>;
  messages: Record<string, string>;
}

export const attributeValues = (attributes: unknown): Record<string, unknown> =>
  typeof attributes === 'object' && attributes !== null ? { ...attributes } : {};

export const filledAttributes = (
  values: Record<string, AttributeValue>,
): Record<string, AttributeValue> =>
  Object.fromEntries(Object.entries(values).filter(([, value]) => value !== null && value !== ''));

const initialValue = (definition: AttributeDefinition, value: unknown): AttributeValue => {
  if (definition.kind === 'Text') {
    return typeof value === 'string' ? value : '';
  }
  if (typeof value === 'number') {
    return value;
  }
  return definition.required ? definition.min : null;
};

const attributeValidators = ({ required, maxLength, min }: AttributeDefinition): ValidatorFn[] => [
  ...(required ? [Validators.required] : []),
  ...(maxLength === null ? [] : [Validators.maxLength(maxLength)]),
  ...(min === null ? [] : [Validators.min(min)]),
];

const attributeMessages = ({
  label,
  maxLength,
  min,
}: AttributeDefinition): Record<string, string> => ({
  required: `Enter ${label.toLowerCase()}.`,
  maxlength: `Use ${maxLength} characters or fewer.`,
  min: `Enter ${min} or more.`,
});

export const attributeField = (
  definition: AttributeDefinition,
  value: unknown,
): AttributeField => ({
  definition,
  control: new FormControl<AttributeValue>(initialValue(definition, value), {
    nonNullable: true,
    validators: attributeValidators(definition),
  }),
  messages: attributeMessages(definition),
});

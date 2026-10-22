import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, Validators } from '@angular/forms';
import { SelectField } from './select-field/select-field';
import { TextField } from './text-field/text-field';

@Component({
  imports: [TextField, SelectField],
  template: `
    <app-text-field
      label="Name"
      [control]="name"
      [messages]="{ required: 'Enter a name.', maxlength: 'Use 3 characters or fewer.' }"
    />
    <app-select-field label="Type" [control]="type" [options]="options" />
  `,
})
class Host {
  readonly name = new FormControl('', [Validators.required, Validators.maxLength(3)]);
  readonly type = new FormControl<string | null>(null);
  readonly options = [{ label: 'Excursion', value: 'Excursion' }];
}

describe('form fields', () => {
  const render = async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;
    const nameField = element.querySelector('app-text-field') as HTMLElement;
    return {
      fixture,
      error: () => nameField.querySelector('.error')?.textContent?.trim(),
      input: nameField.querySelector('input') as HTMLInputElement,
      element,
    };
  };

  it('shows no error before the field is touched', async () => {
    const { error } = await render();

    expect(error()).toBe('');
  });

  it('shows the message for the first error once the field is touched', async () => {
    const { fixture, error } = await render();

    fixture.componentInstance.name.markAsTouched();
    await fixture.whenStable();

    expect(error()).toBe('Enter a name.');
  });

  it('updates the message as the value changes and clears it when valid', async () => {
    const { fixture, error } = await render();
    fixture.componentInstance.name.markAsTouched();

    fixture.componentInstance.name.setValue('Long name');
    await fixture.whenStable();
    expect(error()).toBe('Use 3 characters or fewer.');

    fixture.componentInstance.name.setValue('Ok');
    await fixture.whenStable();
    expect(error()).toBe('');
  });

  it('links each label to its control', async () => {
    const { element, input } = await render();
    const nameLabel = element.querySelector('app-text-field label') as HTMLLabelElement;
    const typeLabel = element.querySelector('app-select-field label') as HTMLLabelElement;
    const combobox = element.querySelector('app-select-field [role="combobox"]') as HTMLElement;

    expect(nameLabel.htmlFor).toBe(input.id);
    expect(typeLabel.hasAttribute('for')).toBe(false);
    expect(combobox.getAttribute('aria-labelledby')).toBe(typeLabel.id);
  });
});

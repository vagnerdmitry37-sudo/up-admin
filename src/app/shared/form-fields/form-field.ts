import { Directive, computed, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ValidationErrors } from '@angular/forms';
import { map, startWith, switchMap } from 'rxjs';

interface ControlState {
  touched: boolean;
  errors: ValidationErrors | null;
}

let nextId = 0;

@Directive({ selector: '[appFormField]' })
export class FormField {
  readonly label = input.required<string>();
  readonly control = input.required<FormControl<unknown>>();
  readonly messages = input<Record<string, string>>({});

  readonly inputId = `field-${nextId++}`;
  readonly errorId = `${this.inputId}-error`;

  private readonly state = toSignal(
    toObservable(this.control).pipe(
      switchMap((control) =>
        control.events.pipe(
          startWith(null),
          map((): ControlState => ({ touched: control.touched, errors: control.errors })),
        ),
      ),
    ),
    { initialValue: { touched: false, errors: null } },
  );

  readonly invalid = computed(() => this.state().touched && this.state().errors !== null);
  readonly message = computed(() => {
    const { errors } = this.state();
    if (!this.invalid() || !errors) {
      return '';
    }
    return this.messages()[Object.keys(errors)[0]] ?? '';
  });
}

export const formFieldHost = { directive: FormField, inputs: ['label', 'control', 'messages'] };

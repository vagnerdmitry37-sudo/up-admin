import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  untracked,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-entity-form',
  imports: [ReactiveFormsModule],
  templateUrl: './entity-form.html',
  styleUrl: './entity-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityForm {
  readonly form = input.required<FormGroup>();
  readonly value = input<object>();
  readonly submitted = output();

  constructor() {
    effect(() => {
      const value = this.value();
      if (value) {
        untracked(() => this.form().reset(value));
      }
    });
  }

  submit = () => {
    const form = this.form();
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }
    this.submitted.emit();
  };
}

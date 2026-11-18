import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  effect,
  inject,
  input,
  output,
  untracked,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { EntityEditPage } from '@shared/entity-edit-page/entity-edit-page';

@Component({
  selector: 'app-entity-form',
  imports: [ReactiveFormsModule],
  templateUrl: './entity-form.html',
  styleUrl: './entity-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityForm implements OnInit {
  readonly form = input.required<FormGroup>();
  readonly value = input<object>();
  readonly submitted = output();

  private readonly entityEditPage = inject(EntityEditPage, { optional: true });

  constructor() {
    effect(() => {
      const value = this.value();
      if (value) {
        untracked(() => this.form().reset(value));
      }
    });
  }

  ngOnInit() {
    this.entityEditPage?.connect(this);
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

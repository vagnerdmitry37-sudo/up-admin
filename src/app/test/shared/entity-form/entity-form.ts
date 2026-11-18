import { ChangeDetectionStrategy, Component, booleanAttribute, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-entity-form',
  imports: [ReactiveFormsModule],
  templateUrl: './entity-form.html',
  styleUrl: './entity-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityForm {
  readonly form = input<FormGroup>(new FormGroup({}));
  readonly submitLabel = input('Save');
  readonly saving = input(false, { transform: booleanAttribute });
  readonly submitted = output();

  submit = () => {
    const form = this.form();
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }
    this.submitted.emit();
  };
}

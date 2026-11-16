import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PageTitle } from '@shared/page-title/page-title';

@Component({
  selector: 'app-form-shell',
  imports: [ReactiveFormsModule, PageTitle],
  templateUrl: './form-shell.html',
  styleUrl: './form-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormShell {
  readonly heading = input<string>();
  readonly form = input.required<FormGroup>();
  readonly submitted = output();

  submit(): void {
    if (this.form().invalid) {
      this.form().markAllAsTouched();
      return;
    }
    this.submitted.emit();
  }
}

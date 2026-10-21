import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Button } from '@openng/optimus-ui/button';

@Component({
  selector: 'app-form-shell',
  imports: [ReactiveFormsModule, RouterLink, Button],
  templateUrl: './form-shell.html',
  styleUrl: './form-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormShell {
  readonly heading = input.required<string>();
  readonly form = input.required<FormGroup>();
  readonly cancelLink = input<string>();
  readonly submitted = output();

  submit(): void {
    if (this.form().invalid) {
      this.form().markAllAsTouched();
      return;
    }
    this.submitted.emit();
  }
}

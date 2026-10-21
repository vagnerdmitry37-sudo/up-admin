import { ChangeDetectionStrategy, Component, booleanAttribute, input, output } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Button } from '@openng/optimus-ui/button';
import { AppButton } from '@shared/button/button';
import { map, startWith, switchMap } from 'rxjs';

@Component({
  selector: 'app-form-shell',
  imports: [ReactiveFormsModule, RouterLink, AppButton, Button],
  templateUrl: './form-shell.html',
  styleUrl: './form-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormShell {
  readonly heading = input.required<string>();
  readonly form = input.required<FormGroup>();
  readonly submitLabel = input.required<string>();
  readonly submitIcon = input('pi pi-check');
  readonly submitting = input(false, { transform: booleanAttribute });
  readonly cancelLink = input<string>();
  readonly submitted = output();

  protected readonly invalid = toSignal(
    toObservable(this.form).pipe(
      switchMap((form) =>
        form.statusChanges.pipe(
          startWith(null),
          map(() => form.invalid),
        ),
      ),
    ),
    { initialValue: true },
  );

  protected submit(): void {
    if (this.form().invalid) {
      this.form().markAllAsTouched();
      return;
    }
    this.submitted.emit();
  }
}

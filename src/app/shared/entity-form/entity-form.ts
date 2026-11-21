import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { EntityEditPage } from '@shared/entity-edit-page/entity-edit-page';
import { distinctUntilChanged, map, startWith, switchMap } from 'rxjs';

@Component({
  selector: 'app-entity-form',
  imports: [ReactiveFormsModule],
  templateUrl: './entity-form.html',
  styleUrl: './entity-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityForm implements OnInit, OnDestroy {
  readonly form = input.required<FormGroup>();
  readonly value = input<{ id: string }>();

  private readonly entityEditPage = inject(EntityEditPage, { optional: true });

  readonly dirty = toSignal(
    toObservable(this.form).pipe(
      switchMap((form) =>
        form.events.pipe(
          map(() => form.dirty),
          startWith(form.dirty),
        ),
      ),
      distinctUntilChanged(),
    ),
    { initialValue: false },
  );

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

  ngOnDestroy() {
    this.entityEditPage?.disconnect(this);
  }

  readonly validValue = () => {
    const form = this.form();
    if (form.invalid) {
      form.markAllAsTouched();
      return undefined;
    }
    return form.getRawValue();
  };

  protected readonly submit = () => this.entityEditPage?.save();
}

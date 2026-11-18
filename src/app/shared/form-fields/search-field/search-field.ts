import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { AutoComplete, AutoCompleteCompleteEvent } from '@openng/optimus-ui/autocomplete';
import { Observable, Subject, catchError, of, switchMap } from 'rxjs';
import { FieldFrame } from '../field-frame/field-frame';
import { FormField, formFieldHost } from '../form-field';

@Component({
  selector: 'app-search-field',
  imports: [ReactiveFormsModule, AutoComplete, FieldFrame],
  hostDirectives: [formFieldHost],
  templateUrl: './search-field.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchField<T> {
  readonly search = input.required<(query: string) => Observable<T[]>>();
  readonly optionLabel = input.required<(option: T) => string>();

  protected readonly field = inject(FormField);
  private readonly queries = new Subject<string>();
  protected readonly suggestions = toSignal(
    this.queries.pipe(switchMap((query) => this.search()(query).pipe(catchError(() => of([]))))),
    { initialValue: [] },
  );

  protected readonly complete = (event: AutoCompleteCompleteEvent) =>
    this.queries.next(event.query);
}

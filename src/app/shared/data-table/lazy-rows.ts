import {
  DestroyRef,
  Signal,
  assertInInjectionContext,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { Observable, Subject, finalize, takeUntil } from 'rxjs';
import { TableRange } from './data-table';

export interface RowsPage<T> {
  items: T[];
  totalRecords: number;
}

export type RowsPageLoader<T> = (first: number, rows: number) => Observable<RowsPage<T>>;

export interface LazyRowsOptions<T> {
  loadPage: () => RowsPageLoader<T>;
  onFirstPageError: () => void;
}

export interface LazyRows<T> {
  rows: Signal<(T | undefined)[] | undefined>;
  empty: Signal<boolean>;
  load: (range: TableRange) => void;
  reload: () => void;
  loading: Signal<boolean>;
}

const FIRST_PAGE: TableRange = { first: 0, rows: 50 };

export const lazyRows = <T>(loadPage: () => RowsPageLoader<T>): LazyRows<T> => {
  assertInInjectionContext(lazyRows);

  const rows = signal<(T | undefined)[] | undefined>(undefined);
  const firstPageFailed = signal(false);
  const pendingRows = new Set<number>();
  const reloads = new Subject<void>();
  const loading = computed(() => rows() === undefined && !firstPageFailed());

  inject(DestroyRef).onDestroy(() => reloads.next());

  const missingRange = (range: TableRange): TableRange | undefined => {
    const current = rows();
    if (!current) {
      return range;
    }
    const isAvailable = current
      .slice(range.first, range.first + range.rows)
      .map((row, offset) => Boolean(row) || pendingRows.has(range.first + offset));
    const start = isAvailable.indexOf(false);
    if (start === -1) {
      return undefined;
    }
    return { first: range.first + start, rows: isAvailable.lastIndexOf(false) - start + 1 };
  };

  const load = (range: TableRange) => {
    const missing = missingRange(range);
    if (!missing) {
      return;
    }
    const indexes = Array.from({ length: missing.rows }, (_, offset) => missing.first + offset);
    indexes.forEach((index) => pendingRows.add(index));
    untracked(loadPage)(missing.first, missing.rows)
      .pipe(
        finalize(() => indexes.forEach((index) => pendingRows.delete(index))),
        takeUntil(reloads),
      )
      .subscribe({
        next: (page) =>
          rows.update((current = []) => {
            const next = Array.from({ length: page.totalRecords }, (_, index) => current[index]);
            next.splice(missing.first, page.items.length, ...page.items);
            return next;
          }),
        error: () => {
          if (rows() === undefined) {
            firstPageFailed.set(true);
            rows.set([]);
            // TODO: Show error message. This is not possible here because this function is called from a signal and we cannot inject services here. The caller of this function should handle the error and show the message.
          }
        },
      });
  };

  const reload = () => {
    reloads.next();
    rows.set(undefined);
    firstPageFailed.set(false);
    load(FIRST_PAGE);
  };

  effect(() => {
    loadPage();
    untracked(reload);
  });

  return {
    rows: rows.asReadonly(),
    empty: computed(() => rows()?.length === 0 && !firstPageFailed()),
    load,
    reload,
    loading
  };
};

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
}

const FIRST_PAGE: TableRange = { first: 0, rows: 50 };

export const lazyRows = <T>({ loadPage, onFirstPageError }: LazyRowsOptions<T>): LazyRows<T> => {
  assertInInjectionContext(lazyRows);

  const rows = signal<(T | undefined)[] | undefined>(undefined);
  const firstPageFailed = signal(false);
  const pendingRows = new Set<number>();
  const reloads = new Subject<void>();

  inject(DestroyRef).onDestroy(() => reloads.next());

  const missingRange = (range: TableRange): TableRange | undefined => {
    const current = rows();
    const length = current ? Math.min(range.rows, current.length - range.first) : range.rows;
    const isAvailable = Array.from({ length: Math.max(length, 0) }, (_, offset) => {
      const index = range.first + offset;
      return Boolean(current?.[index]) || pendingRows.has(index);
    });
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
            onFirstPageError();
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
  };
};

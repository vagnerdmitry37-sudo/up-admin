import { computed, signal } from '@angular/core';
import { Observable, finalize } from 'rxjs';
import { TableRange } from './data-table';

export interface RowsPage<T> {
  items: T[];
  totalRecords: number;
}

export type RowsPageLoader<T> = (first: number, rows: number) => Observable<RowsPage<T>>;

const FIRST_PAGE: TableRange = { first: 0, rows: 50 };

export class LazyRows<T> {
  readonly rows = signal<(T | undefined)[] | undefined>(undefined);
  private readonly pendingRequests = signal(0);
  private readonly pendingRows = new Set<number>();
  readonly loading = computed(() => this.pendingRequests() > 0);
  readonly empty = computed(() => this.rows()?.length === 0);

  constructor(private readonly loadPage: RowsPageLoader<T>) {}

  reload(): void {
    this.rows.set(undefined);
    this.load(FIRST_PAGE);
  }

  load(range: TableRange): void {
    const missing = this.missingRange(range);
    if (!missing) {
      return;
    }
    const indexes = Array.from({ length: missing.rows }, (_, offset) => missing.first + offset);
    indexes.forEach((index) => this.pendingRows.add(index));
    this.pendingRequests.update((count) => count + 1);
    this.loadPage(missing.first, missing.rows)
      .pipe(
        finalize(() => {
          indexes.forEach((index) => this.pendingRows.delete(index));
          this.pendingRequests.update((count) => count - 1);
        }),
      )
      .subscribe((page) =>
        this.rows.update((current = []) => {
          const next = Array.from({ length: page.totalRecords }, (_, index) => current[index]);
          next.splice(missing.first, page.items.length, ...page.items);
          return next;
        }),
      );
  }

  private missingRange(range: TableRange): TableRange | undefined {
    const rows = this.rows();
    if (!rows) {
      return range;
    }
    const isAvailable = rows
      .slice(range.first, range.first + range.rows)
      .map((row, offset) => Boolean(row) || this.pendingRows.has(range.first + offset));
    const start = isAvailable.indexOf(false);
    if (start === -1) {
      return undefined;
    }
    return { first: range.first + start, rows: isAvailable.lastIndexOf(false) - start + 1 };
  }
}

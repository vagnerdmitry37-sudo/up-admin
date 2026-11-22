import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { LazyRows, RowsPage, lazyRows } from './lazy-rows';

interface Row {
  id: number;
}

const rowsFrom = (first: number, count: number): Row[] =>
  Array.from({ length: count }, (_, offset) => ({ id: first + offset }));

describe('lazyRows', () => {
  let requests: { first: number; rows: number; response: Subject<RowsPage<Row>> }[];
  let onFirstPageError: ReturnType<typeof vi.fn<() => void>>;
  let table: LazyRows<Row>;

  beforeEach(() => {
    requests = [];
    onFirstPageError = vi.fn<() => void>();
    table = TestBed.runInInjectionContext(() =>
      lazyRows<Row>({
        loadPage: () => (first, rows) => {
          const response = new Subject<RowsPage<Row>>();
          requests.push({ first, rows, response });
          return response;
        },
        onFirstPageError,
      }),
    );
    TestBed.tick();
  });

  const answer = (index: number, items: Row[], totalRecords: number) => {
    requests[index].response.next({ items, totalRecords });
    requests[index].response.complete();
  };

  it('loads the first 50 rows on its own and sizes the list to the total', () => {
    expect(requests.map(({ first, rows }) => ({ first, rows }))).toEqual([{ first: 0, rows: 50 }]);

    answer(0, rowsFrom(0, 50), 120);

    expect(table.rows()).toHaveLength(120);
    expect(table.rows()?.[49]).toEqual({ id: 49 });
    expect(table.rows()?.[50]).toBeUndefined();
  });

  it('requests only the rows it does not have yet', () => {
    answer(0, rowsFrom(0, 50), 120);

    table.load({ first: 40, rows: 30 });
    table.load({ first: 10, rows: 20 });

    expect(requests.slice(1).map(({ first, rows }) => ({ first, rows }))).toEqual([
      { first: 50, rows: 20 },
    ]);
  });

  it('does not request rows that are already on their way', () => {
    answer(0, rowsFrom(0, 50), 120);
    table.load({ first: 50, rows: 20 });

    table.load({ first: 55, rows: 20 });

    expect(requests.slice(1).map(({ first, rows }) => ({ first, rows }))).toEqual([
      { first: 50, rows: 20 },
      { first: 70, rows: 5 },
    ]);
  });

  it('places a later page at its offset and keeps the rows around it', () => {
    answer(0, rowsFrom(0, 50), 120);
    table.load({ first: 100, rows: 20 });

    answer(1, rowsFrom(100, 20), 120);

    const rows = table.rows()!;
    expect(rows).toHaveLength(120);
    expect(rows[0]).toEqual({ id: 0 });
    expect(rows[75]).toBeUndefined();
    expect(rows[119]).toEqual({ id: 119 });
  });

  it('reports empty only after a successful load returns no rows', () => {
    expect(table.empty()).toBe(false);

    answer(0, [], 0);

    expect(table.empty()).toBe(true);
  });

  it('falls back to no rows and reports once when the first page fails, without claiming there are none', () => {
    requests[0].response.error(new Error('offline'));

    expect(table.rows()).toEqual([]);
    expect(table.empty()).toBe(false);
    expect(onFirstPageError).toHaveBeenCalledTimes(1);
  });

  it('keeps the loaded rows and asks again later when a further page fails', () => {
    answer(0, rowsFrom(0, 50), 120);
    table.load({ first: 50, rows: 20 });

    requests[1].response.error(new Error('offline'));
    table.load({ first: 50, rows: 20 });

    expect(onFirstPageError).not.toHaveBeenCalled();
    expect(table.rows()?.[0]).toEqual({ id: 0 });
    expect(requests).toHaveLength(3);
  });

  it('ignores a page that arrives after a reload', () => {
    answer(0, rowsFrom(0, 50), 120);
    table.load({ first: 50, rows: 20 });

    table.reload();
    requests[1].response.next({ items: rowsFrom(50, 20), totalRecords: 120 });
    answer(2, [{ id: 999 }], 1);

    expect(table.rows()).toEqual([{ id: 999 }]);
  });
});

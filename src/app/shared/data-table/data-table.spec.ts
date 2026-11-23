import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Table } from '@openng/optimus-ui/table';
import { TableLazyLoadEvent } from '@openng/optimus-ui/types/table';
import { DataTable, TableColumn, TableRange } from './data-table';

interface Row {
  id: number;
  name: string;
}

const rowsFrom = (count: number): Row[] =>
  Array.from({ length: count }, (_, id) => ({ id, name: `Row ${id}` }));

@Component({
  imports: [DataTable],
  template: `
    <app-data-table
      [rows]="rows()"
      [columns]="columns"
      [lazy]="lazy()"
      [loading]="loading()"
      (lazyLoad)="ranges.push($event)"
    />
  `,
})
class Host {
  readonly rows = signal<(Row | undefined)[]>(rowsFrom(3));
  readonly lazy = signal(true);
  readonly loading = signal(false);
  readonly columns: TableColumn<Row>[] = [{ header: 'Name', value: (row) => row.name }];
  readonly ranges: TableRange[] = [];
}

@Component({
  imports: [DataTable],
  template: `
    <app-data-table [rows]="rows" [columns]="columns" [lazy]="true">
      <ng-template #footer>
        <tr>
          <td>Total</td>
        </tr>
      </ng-template>
    </app-data-table>
  `,
})
class HostWithFooter {
  readonly rows = rowsFrom(3);
  readonly columns: TableColumn<Row>[] = [{ header: 'Name', value: (row) => row.name }];
}

describe('DataTable', () => {
  const render = async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const tableHost = () => fixture.nativeElement.querySelector('app-data-table') as HTMLElement;
    return { fixture, host: fixture.componentInstance, tableHost };
  };

  it('fits a lazy table to its header and rows, so a short list leaves no empty scroll area', async () => {
    const { fixture, host, tableHost } = await render();
    expect(tableHost().style.height).toBe(`${4 * 49}px`);

    host.rows.set(rowsFrom(120));
    await fixture.whenStable();

    expect(tableHost().style.height).toBe(`${121 * 49}px`);
  });

  it('shows the loading mask over an empty table and keeps one row of room for it', async () => {
    const { fixture, host, tableHost } = await render();

    host.rows.set([]);
    host.loading.set(true);
    await fixture.whenStable();

    expect(tableHost().querySelector('.p-datatable-mask')).not.toBeNull();
    expect(tableHost().style.height).toBe(`${2 * 49}px`);
  });

  it('leaves a table that is not lazy at its natural height', async () => {
    const { fixture, host, tableHost } = await render();

    host.lazy.set(false);
    await fixture.whenStable();

    expect(tableHost().style.height).toBe('');
  });

  it('counts the footer row in the height of a lazy table', async () => {
    const fixture = TestBed.createComponent(HostWithFooter);
    await fixture.whenStable();

    const tableHost = fixture.nativeElement.querySelector('app-data-table') as HTMLElement;
    expect(tableHost.style.height).toBe(`${5 * 49}px`);
  });

  it('asks for the range the table scrolled to and ignores events without rows', async () => {
    const { fixture, host } = await render();
    const table = fixture.debugElement.query(By.directive(Table)).componentInstance as Table;

    table.onLazyLoad.emit({ first: 40, rows: 20 } as TableLazyLoadEvent);
    table.onLazyLoad.emit({ rows: 10 } as TableLazyLoadEvent);
    table.onLazyLoad.emit({ first: 60, rows: 0 } as TableLazyLoadEvent);

    expect(host.ranges).toEqual([
      { first: 40, rows: 20 },
      { first: 0, rows: 10 },
    ]);
  });

  it('shows placeholder rows for rows that are not loaded yet instead of reading their columns', async () => {
    const { fixture, host } = await render();

    host.lazy.set(false);
    host.rows.set([{ id: 0, name: 'Loaded' }, undefined, undefined]);
    await fixture.whenStable();

    const cells = Array.from(
      fixture.nativeElement.querySelectorAll('tbody td') as NodeListOf<HTMLElement>,
    ).map((cell) => cell.textContent?.trim());
    expect(cells).toEqual(['Loaded', '', '']);
  });
});

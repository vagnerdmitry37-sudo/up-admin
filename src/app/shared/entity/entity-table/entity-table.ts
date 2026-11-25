import { ChangeDetectionStrategy, Component, inject, input, model, output } from '@angular/core';
import { ActivityEntity } from '@core/http-activity.service';
import { ActionService } from '@shared/actions/action.service';
import { DataTable, TableColumn, TableRange } from '@shared/data-table/data-table';

@Component({
  selector: 'app-entity-table',
  imports: [DataTable],
  templateUrl: './entity-table.html',
  styleUrl: './entity-table.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityTable<T extends { id: string }> {
  readonly rows = input.required<(T | undefined)[]>();
  readonly columns = input.required<TableColumn<T>[]>();
  readonly lazy = input(false);
  readonly loading = input(false);
  readonly entity = input.required<ActivityEntity>();
  readonly deleteRows = input.required<(ids: string[]) => Promise<unknown>>();
  readonly selection = model<T[]>([]);
  readonly lazyLoad = output<TableRange>();
  readonly create = output<string[]>();
  readonly edit = output<string[]>();

  private readonly selectedIds = () => this.selection().map((row) => row.id);

  constructor() {
    inject(ActionService).register({
      create: { run: () => this.create.emit(this.selectedIds()) },
      edit: { run: () => this.edit.emit(this.selectedIds()) },
      delete: { run: () => this.deleteRows()(this.selectedIds()) },
    });
  }
}

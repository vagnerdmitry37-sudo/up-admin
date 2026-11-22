import { ChangeDetectionStrategy, Component, inject, input, model, output } from '@angular/core';
import { ActionMenuService } from '@core/action-menu.service';
import { ActivityEntity } from '@core/http-activity.service';
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
  readonly entity = input.required<ActivityEntity>();
  readonly deleteRows = input.required<(ids: string[]) => Promise<unknown>>();
  readonly selection = model<T[]>([]);
  readonly lazyLoad = output<TableRange>();
  readonly create = output<string[]>();
  readonly edit = output<string[]>();

  private readonly selectedIds = () => this.selection().map((row) => row.id);

  constructor() {
    inject(ActionMenuService).register({
      entity: this.entity,
      actions: () => {
        const hasSelection = this.selection().length > 0;
        return {
          create: { click: () => this.create.emit(this.selectedIds()) },
          edit: { click: () => this.edit.emit(this.selectedIds()), visible: hasSelection },
          delete: { click: () => this.deleteRows()(this.selectedIds()), visible: hasSelection },
        };
      },
    });
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { AppMessageService } from '@core/app-message.service';
import { EditActionsService } from '@core/edit-actions.service';
import { ConfirmationService, OpenngIcons } from '@openng/optimus-ui/api';
import { TableColumn } from '@shared/data-table/data-table';
import { LazyRows, RowsPageLoader } from '@shared/data-table/lazy-rows';
import { EntityTable } from '@shared/entity-table/entity-table';
import { joinRouteIds } from '@shared/route-ids/route-ids';

@Component({
  selector: 'app-entity-list-page',
  imports: [EntityTable],
  templateUrl: './entity-list-page.html',
  styleUrl: './entity-list-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityListPage<T extends { id: string }> implements OnInit {
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(AppMessageService);

  readonly loadPage = input.required<RowsPageLoader<T>>();
  readonly deleteEntities = input.required<(ids: string[]) => Promise<unknown>>();
  readonly columns = input.required<TableColumn<T>[]>();
  readonly editPath = input.required<string>();
  readonly entityName = input.required<string>();

  protected readonly lazyRows = computed(
    () => new LazyRows<T>(this.loadPage(), () => this.showLoadError()),
  );
  protected readonly selection = signal<T[]>([]);

  constructor() {
    inject(EditActionsService).register({
      actions: () => ({
        create: { click: () => this.open([]), suggested: this.lazyRows().empty() },
      }),
    });
  }

  ngOnInit() {
    this.lazyRows().reload();
  }

  protected readonly open = (ids: string[]) =>
    this.router.navigate([this.editPath()], {
      queryParams: ids.length > 0 ? { ids: joinRouteIds(ids) } : undefined,
    });

  protected readonly confirmDelete = (ids: string[]) =>
    this.confirmationService.confirm({
      header: `Delete ${this.entityName()}s`,
      message: `Delete ${ids.length === 1 ? `this ${this.entityName()}` : `${ids.length} ${this.entityName()}s`}? This cannot be undone.`,
      icon: OpenngIcons.EXCLAMATION_TRIANGLE,
      defaultFocus: 'reject',
      acceptButtonProps: { label: 'Delete', severity: 'danger' },
      rejectButtonProps: { label: 'Cancel', severity: 'secondary', outlined: true },
      accept: () => this.delete(ids),
    });

  private readonly showLoadError = () =>
    this.messageService.error(
      `The ${this.entityName()}s could not be loaded`,
      'Reload the page to try again.',
    );

  private async delete(ids: string[]): Promise<void> {
    await this.deleteEntities()(ids);
    this.selection.set([]);
    this.lazyRows().reload();
  }
}

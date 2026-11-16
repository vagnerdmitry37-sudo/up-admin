import { formatNumber } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { Product } from '@core/api/models';
import { EditActionConfig, EditActionsService } from '@core/edit-actions.service';
import { ConfirmationService } from '@openng/optimus-ui/api';
import { DataTable, TableColumn } from '@shared/data-table/data-table';
import { LazyRows } from '@shared/data-table/lazy-rows';
import { EmptyState } from '@shared/empty-state/empty-state';
import { PageTitle } from '@shared/page-title/page-title';
import { ProductsService } from '../products.service';

@Component({
  selector: 'app-products-page',
  imports: [DataTable, EmptyState, PageTitle],
  templateUrl: './products-page.html',
  styleUrl: './products-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsPage implements OnInit {
  private readonly productsService = inject(ProductsService);
  private readonly router = inject(Router);
  private readonly locale = inject(LOCALE_ID);
  private readonly confirmationService = inject(ConfirmationService);

  protected readonly lazyRows = new LazyRows<Product>(this.productsService.list);
  protected readonly selected = signal<Product[]>([]);
  protected readonly columns: TableColumn<Product>[] = [
    { header: 'Name', value: (product) => product.name },
    { header: 'Type', value: (product) => product.typeLabel },
    {
      header: 'Price',
      value: (product) => formatNumber(product.price, this.locale, '1.2-2'),
      align: 'end',
    },
  ];

  constructor() {
    inject(EditActionsService).register({
      actions: () => {
        const ids = this.selected().map((product) => product.id);
        return {
          create: this.createAction(ids),
          edit: this.editAction(ids),
          delete: this.deleteAction(ids),
        };
      },
    });
  }

  ngOnInit() {
    this.lazyRows.reload();
  }

  private createAction(ids: string[]): EditActionConfig {
    const queryParams = ids.length > 0 ? { from: ids.join(',') } : undefined;

    return {
      click: () => this.router.navigate(['/products/new'], { queryParams }),
      suggested: this.lazyRows.empty(),
    };
  }

  private editAction(ids: string[]): EditActionConfig {
    return {
      click: () => this.router.navigate(['/products', ids.join(','), 'edit']),
      visible: ids.length > 0,
    };
  }

  private deleteAction(ids: string[]): EditActionConfig {
    return {
      click: () =>
        this.confirmationService.confirm({
          header: ids.length === 1 ? 'Delete product?' : `Delete ${ids.length} products?`,
          message: 'This cannot be undone.',
          acceptLabel: 'Delete',
          rejectLabel: 'Cancel',
          acceptButtonProps: { severity: 'danger' },
          rejectButtonProps: { severity: 'secondary', text: true },
          accept: () => this.delete(ids),
        }),
      visible: ids.length > 0,
    };
  }

  private async delete(ids: string[]): Promise<void> {
    await this.productsService.delete(ids);
    this.selected.set([]);
    this.lazyRows.reload();
  }
}

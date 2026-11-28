import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  TemplateRef,
  contentChild,
  inject,
  input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { EntityName } from '@core/request-tracker';
import { parseRouteIds } from '@shared/route-ids/route-ids';
import { Observable } from 'rxjs';
import { entityTabList } from '../entity-tabs/entity-tab-list';
import { EntityTabContext, EntityTabs } from '../entity-tabs/entity-tabs';
import { registerEntityEditPageActions } from './entity-edit-page-actions';

@Component({
  selector: 'app-entity-edit-page',
  imports: [EntityTabs],
  templateUrl: './entity-edit-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityEditPage<T extends { id: string }> implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly ids = input<string>();
  readonly load = input.required<(ids: string[]) => Observable<T[]>>();
  readonly label = input.required<(entity: T) => string>();
  readonly entityName = input.required<EntityName>();

  protected readonly entityTemplate =
    contentChild.required<TemplateRef<EntityTabContext<T>>>(TemplateRef);
  protected readonly tabList = entityTabList<T>({
    entityName: () => this.entityName(),
    entityLabel: (entity) => this.label()(entity),
  });

  constructor() {
    registerEntityEditPageActions({ addNewTab: () => this.tabList.addNew() });
  }

  ngOnInit() {
    const ids = this.ids();
    if (!ids) {
      this.tabList.addNew();
      return;
    }
    this.load()(parseRouteIds(ids))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((entities) => this.tabList.addExisting(entities));
  }

  protected readonly closeTab = (id: string) => {
    this.tabList.close(id);
    if (this.tabList.tabs().length === 0) {
      this.router.navigate(['..'], { relativeTo: this.route, replaceUrl: true });
    }
  };
}

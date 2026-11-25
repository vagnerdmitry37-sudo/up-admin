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
import { ActivityEntity } from '@core/http-activity.service';
import { ActionService } from '@shared/actions/action.service';
import { parseRouteIds } from '@shared/route-ids/route-ids';
import { Observable } from 'rxjs';
import { EntityTabList } from '../entity-tabs/entity-tab-list';
import { EntityTab, EntityTabContext, EntityTabs } from '../entity-tabs/entity-tabs';

@Component({
  selector: 'app-entity-edit-page',
  imports: [EntityTabs],
  templateUrl: './entity-edit-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityEditPage<T extends { id: string }> implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  readonly ids = input<string>();
  readonly load = input.required<(ids: string[]) => Observable<T[]>>();
  readonly label = input.required<(entity: T) => string>();
  readonly entityName = input.required<ActivityEntity>();

  protected readonly entityTemplate =
    contentChild.required<TemplateRef<EntityTabContext<T>>>(TemplateRef);
  protected readonly tabList = new EntityTabList<T>();

  protected readonly tabLabel = (tab: EntityTab<T>) =>
    tab.entity ? this.label()(tab.entity) : `New ${this.entityName()}`;

  constructor() {
    inject(ActionService).register({
      create: { run: () => this.tabList.addNew() },
    });
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
}

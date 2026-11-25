import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EntityTabs } from '../entity-tabs/entity-tabs';

@Component({
  selector: 'app-entity-edit-page',
  imports: [EntityTabs],
  templateUrl: './entity-edit-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityEditPage<T extends { id: string }, V> {
  scrollableTabs: any[] = [];
}

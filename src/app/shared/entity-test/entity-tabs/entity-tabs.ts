import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TabsModule } from '@openng/optimus-ui/tabs';

@Component({
  selector: 'app-entity-tabs',
  imports: [TabsModule],
  templateUrl: './entity-tabs.html',
  styleUrl: './entity-tabs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityTabs<T extends { id: string }> {
  scrollableTabs: any[] = [];
}

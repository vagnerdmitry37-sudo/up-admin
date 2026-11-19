import { Injectable, inject } from '@angular/core';
import { MessageService } from '@openng/optimus-ui/api';

@Injectable({ providedIn: 'root' })
export class AppMessageService {
  private readonly messageService = inject(MessageService);

  readonly error = (summary: string, detail: string) =>
    this.messageService.add({ severity: 'error', summary, detail });
}

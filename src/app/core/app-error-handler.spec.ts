import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MessageService } from '@openng/optimus-ui/api';
import { AppErrorHandler } from './app-error-handler';

describe('AppErrorHandler', () => {
  let add: ReturnType<typeof vi.spyOn>;
  let appErrorHandler: AppErrorHandler;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [AppErrorHandler, MessageService] });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    add = vi.spyOn(TestBed.inject(MessageService), 'add');
    appErrorHandler = TestBed.inject(AppErrorHandler);
  });

  it('shows a generic toast for an unexpected exception', () => {
    appErrorHandler.handleError(new TypeError('x is undefined'));

    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error', summary: 'Something went wrong' }),
    );
  });

  it('shows a generic toast for a failed request that no caller handled', () => {
    appErrorHandler.handleError(new HttpErrorResponse({ status: 500 }));

    expect(add).toHaveBeenCalledWith(
      expect.objectContaining({ severity: 'error', summary: 'Something went wrong' }),
    );
  });
});

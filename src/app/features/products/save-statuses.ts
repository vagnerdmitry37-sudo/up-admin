import { WritableSignal } from '@angular/core';
import { SaveStatus } from '@shared/save-zone/save-zone';

export type SaveStatuses = Record<string, SaveStatus>;

const STATUS_DISPLAY_MS = 2000;

export const markSaving = (statuses: WritableSignal<SaveStatuses>, keys: string[]): void =>
  statuses.update((current) => ({
    ...current,
    ...Object.fromEntries(keys.map((key) => [key, 'saving'])),
  }));

export const showResult = (
  statuses: WritableSignal<SaveStatuses>,
  key: string,
  result: 'saved' | 'failed',
): void => {
  statuses.update((current) => ({ ...current, [key]: result }));
  setTimeout(
    () =>
      statuses.update((current) =>
        current[key] === result
          ? Object.fromEntries(Object.entries(current).filter(([candidate]) => candidate !== key))
          : current,
      ),
    STATUS_DISPLAY_MS,
  );
};

export const afterResultsShown = (action: VoidFunction): void => {
  setTimeout(action, STATUS_DISPLAY_MS);
};

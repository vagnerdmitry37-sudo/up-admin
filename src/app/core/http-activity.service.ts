import { HttpContextToken } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, Subject, filter } from 'rxjs';

export type ActivityKind = 'request' | 'operation';

export type ActivityStatus = 'running' | 'succeeded' | 'failed' | 'cancelled';

export type FinishedStatus = Exclude<ActivityStatus, 'running'>;

export type ActivityEntity =
  'product' | 'order' | 'order item' | 'customer' | 'image' | 'reference data' | 'session';

export type ActivitySource = 'image-upload';

export interface RequestTag {
  readonly entity?: ActivityEntity;
  readonly untracked?: boolean;
  readonly handledStatuses?: readonly number[];
}

export interface OperationTag {
  readonly entity?: ActivityEntity;
  readonly operation: string;
  readonly source?: ActivitySource;
}

export interface Activity {
  readonly id: number;
  readonly kind: ActivityKind;
  readonly entity?: ActivityEntity;
  readonly operation?: string;
  readonly source?: ActivitySource;
  readonly method?: string;
  readonly url?: string;
  readonly handledStatuses?: readonly number[];
  readonly status: ActivityStatus;
  readonly error?: unknown;
}

export type ActivityFilter = Partial<
  Pick<Activity, 'kind' | 'entity' | 'operation' | 'source' | 'method' | 'status'>
>;

export type ActivityStart = Omit<Activity, 'id' | 'status' | 'error'>;

export const REQUEST_TAG = new HttpContextToken<RequestTag>(() => ({}));

const matches = (activity: Activity, activityFilter: ActivityFilter) =>
  (Object.keys(activityFilter) as (keyof ActivityFilter)[]).every(
    (key) => activityFilter[key] === undefined || activity[key] === activityFilter[key],
  );

@Injectable({ providedIn: 'root' })
export class HttpActivity {
  private nextId = 0;
  private readonly runningActivities = signal<readonly Activity[]>([]);
  private readonly statusChanges = new Subject<Activity>();

  readonly running = this.runningActivities.asReadonly();
  readonly changes: Observable<Activity> = this.statusChanges.asObservable();

  readonly isRunning = (activityFilter: ActivityFilter = {}) =>
    this.runningActivities().some((activity) => matches(activity, activityFilter));

  readonly on = (activityFilter: ActivityFilter) =>
    this.changes.pipe(filter((activity) => matches(activity, activityFilter)));

  readonly track = async <T>(tag: OperationTag, work: () => T | Promise<T>): Promise<T> => {
    const operation = this.start({ kind: 'operation', ...tag });
    try {
      const result = await work();
      this.finish(operation, 'succeeded');
      return result;
    } catch (error) {
      this.finish(operation, 'failed', error);
      throw error;
    }
  };

  readonly start = (activityStart: ActivityStart): Activity => {
    const activity: Activity = { ...activityStart, id: ++this.nextId, status: 'running' };
    this.runningActivities.update((activities) => [...activities, activity]);
    this.statusChanges.next(activity);
    return activity;
  };

  readonly finish = (activity: Activity, status: FinishedStatus, error?: unknown) => {
    if (!this.runningActivities().includes(activity)) {
      return;
    }
    this.runningActivities.update((activities) =>
      activities.filter((running) => running !== activity),
    );
    this.statusChanges.next(
      error === undefined ? { ...activity, status } : { ...activity, status, error },
    );
  };
}

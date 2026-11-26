const ROUTE_IDS_SEPARATOR = ',';

export const parseRouteIds = (ids: string) => ids.split(ROUTE_IDS_SEPARATOR);

export const joinRouteIds = (ids: readonly string[]) => ids.join(ROUTE_IDS_SEPARATOR);

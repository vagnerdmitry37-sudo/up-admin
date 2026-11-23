const ROUTE_IDS_SEPARATOR = ',';
const NEW_ENTITY_ID_PREFIX = 'new-';

export const parseRouteIds = (ids: string) => ids.split(ROUTE_IDS_SEPARATOR);

export const joinRouteIds = (ids: readonly string[]) => ids.join(ROUTE_IDS_SEPARATOR);

export const isNewEntityId = (id: string) => id.startsWith(NEW_ENTITY_ID_PREFIX);

export const firstNewEntityId = `${NEW_ENTITY_ID_PREFIX}1`;

export const nextNewEntityId = (ids: readonly string[]) => {
  const usedNumbers = ids
    .filter(isNewEntityId)
    .map((id) => Number(id.slice(NEW_ENTITY_ID_PREFIX.length)) || 0);
  return `${NEW_ENTITY_ID_PREFIX}${Math.max(0, ...usedNumbers) + 1}`;
};

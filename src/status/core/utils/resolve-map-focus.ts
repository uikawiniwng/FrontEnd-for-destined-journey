import type {
  MapPositionIndex,
  MapRegionBounds,
  MapRegionPoint,
} from '../../pages/map/data/map-position-index';
import type { WorldPositionPath } from './parse-world-location';

export interface MapFocusResult {
  focusPoint?: MapRegionPoint;
  focusBounds?: MapRegionBounds;
}

const toKey = (segments: Array<string | undefined>) => {
  return segments.filter(Boolean).join('/');
};

const getCenterPoint = (bounds: MapRegionBounds): MapRegionPoint => {
  return {
    nx: bounds.x + bounds.width / 2,
    ny: bounds.y + bounds.height / 2,
  };
};

export const resolveMapFocus = (
  index: MapPositionIndex,
  path: WorldPositionPath,
): MapFocusResult => {
  const segments = [
    path.continent,
    path.region,
    path.realm,
    path.settlement,
    path.subArea,
    path.detail,
  ];

  const keys: string[] = [];
  for (let i = 1; i <= segments.length; i += 1) {
    const key = toKey(segments.slice(0, i));
    if (key) keys.push(key);
  }

  const deepestKey = keys[keys.length - 1];
  if (deepestKey && index.settlement[deepestKey]) {
    return { focusPoint: index.settlement[deepestKey] };
  }

  for (let i = keys.length - 1; i >= 0; i -= 1) {
    const key = keys[i];
    if (index.realm[key]) {
      return { focusBounds: index.realm[key].bbox };
    }
    if (index.region[key]) {
      return { focusBounds: index.region[key].bbox };
    }
    if (index.continent[key]) {
      return { focusBounds: index.continent[key].bbox };
    }
  }

  return { focusPoint: undefined, focusBounds: undefined };
};

export const fallbackFocus = (bounds: MapRegionBounds): MapRegionPoint => {
  return getCenterPoint(bounds);
};

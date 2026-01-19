export interface MapRegionBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MapRegionArea {
  bbox: MapRegionBounds;
}

export interface MapRegionPoint {
  nx: number;
  ny: number;
}

export interface MapPositionIndex {
  continent: Record<string, MapRegionArea>;
  region: Record<string, MapRegionArea>;
  realm: Record<string, MapRegionArea>;
  settlement: Record<string, MapRegionPoint>;
}

export const mapPositionIndex: MapPositionIndex = {
  continent: {},
  region: {},
  realm: {},
  settlement: {},
};

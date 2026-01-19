export interface MapMarker {
  id: string;
  name: string;
  type: 'city' | 'landmark' | 'region';
  position: { nx: number; ny: number };
  summary?: string;
  imageUrl?: string;
}

export const mapMarkers: MapMarker[] = [];

export interface WorldPositionPath {
  continent?: string;
  region?: string;
  realm?: string;
  settlement?: string;
  subArea?: string;
  detail?: string;
}

const PathSegmentCount = 6;

export const parseWorldLocation = (location: string): WorldPositionPath => {
  const normalized = location.trim();
  if (!normalized) return {};

  const segments = normalized.split('-').map(segment => segment.trim());
  const padded = [...segments];

  while (padded.length < PathSegmentCount) {
    padded.push('');
  }

  const [continent, region, realm, settlement, subArea, detail] = padded;

  return {
    continent: continent || undefined,
    region: region || undefined,
    realm: realm || undefined,
    settlement: settlement || undefined,
    subArea: subArea || undefined,
    detail: detail || undefined,
  };
};

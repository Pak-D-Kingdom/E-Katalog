export type ImageCandidate = {
  title: string | null;
  imageUrl: string;
  thumbnailUrl: string | null;
  sourceUrl: string | null;
  domain: string | null;
  provider: string;
  relevance: number;
  isProduct: boolean;
};

export type ImageSearchOutcome = {
  candidates: ImageCandidate[];
  requestCount: number;
};

export interface ImageSearchProvider {
  name: string;
  search(query: string, limit: number): Promise<ImageSearchOutcome>;
}

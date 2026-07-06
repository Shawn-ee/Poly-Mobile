export const HOME_MATCH_PAGE_SIZE = 10;

export const initialHomeMatchCount = () => HOME_MATCH_PAGE_SIZE;

export const nextHomeMatchCount = (currentCount: number, totalCount: number) =>
  Math.min(Math.max(0, currentCount) + HOME_MATCH_PAGE_SIZE, Math.max(0, totalCount));


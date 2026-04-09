export const SEARCH_RETURN_TO_KEY = 'search:return-to';

export const buildRouteWithSearchParams = (pathname: string, search: string) =>
  search ? `${pathname}?${search}` : pathname;

export const sanitizeReturnToPath = (input?: string | null) => {
  if (!input) return '/';
  return input.startsWith('/') ? input : '/';
};

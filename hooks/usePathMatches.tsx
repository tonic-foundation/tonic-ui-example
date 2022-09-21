import { useMatch, useResolvedPath } from 'react-router';

export default function usePathMatches(pattern: string) {
  const resolved = useResolvedPath(pattern);
  const match = useMatch({ path: resolved.pathname });
  return !!match;
}

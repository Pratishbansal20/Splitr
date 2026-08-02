import { useState, useEffect, useCallback } from 'react';

// Wraps the "fetch on mount, track loading, log errors" pattern that used to
// be hand-rolled identically in GroupList, ActivityList, and GroupDetails.
// `fetchFn` is re-invoked whenever `deps` changes; errors are logged (not
// surfaced in state) to match the original components' behavior of failing
// silently to an empty/default view rather than showing an error banner.
export function useApiData(fetchFn, deps, initialData = null) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, refetch };
}

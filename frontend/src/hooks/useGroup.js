import { useCallback } from 'react';
import api from '../api';
import { useApiData } from './useApiData';

export function useGroup(groupId) {
  const fetchGroup = useCallback(async () => {
    const res = await api.get(`/group/${groupId}`);
    return res.data;
  }, [groupId]);

  const { data: group, loading, refetch } = useApiData(fetchGroup, [fetchGroup]);
  return { group, loading, refetch };
}

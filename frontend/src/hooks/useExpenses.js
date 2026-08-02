import { useCallback } from 'react';
import api from '../api';
import { useApiData } from './useApiData';

export function useExpenses(groupId) {
  const fetchExpenses = useCallback(async () => {
    const res = await api.get(`/expense/group/${groupId}`);
    return res.data || [];
  }, [groupId]);

  const { data: expenses, loading, refetch } = useApiData(fetchExpenses, [fetchExpenses], []);
  return { expenses, loading, refetch };
}

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useGroup } from '../hooks/useGroup';
import { useExpenses } from '../hooks/useExpenses';
import { computeMemberBalances } from '../utils/balances';
import { expenseAmountCents } from '../utils/money';
import BalancesCard from './BalancesCard';
import ExpenseList from './ExpenseList';
import ExpenseForm from './ExpenseForm';

function GroupDetails() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();
  const { group, loading: loadingGroup, refetch: fetchGroup } = useGroup(groupId);
  const { expenses, loading: loadingExpenses, refetch: fetchExpenses } = useExpenses(groupId);
  const [editingExpense, setEditingExpense] = useState(null);

  const balances = computeMemberBalances(group, expenses);
  const totalExpensesCents = expenses.reduce((sum, exp) => sum + expenseAmountCents(exp), 0);

  const handleExpenseSaved = () => {
    setEditingExpense(null);
    fetchExpenses();
    fetchGroup(); // Recalculate totals
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      await api.delete(`/expense/${expenseId}`);
      fetchExpenses();
      fetchGroup(); // Re-fetch group to update totals if needed? Actually totals are derived from expenses, but good to be safe.
    } catch (e) {
      showToast(e.response?.data?.error || "Failed to delete expense");
    }
  };

  return (
    <div className="space-y-6">
      <motion.button
        whileHover={{ x: -4 }}
        onClick={() => navigate('/groups')}
        className="flex items-center transition-colors small-muted"
      >
        <ArrowLeft size={20} className="mr-1" /> Back to Dashboard
      </motion.button>

      {loadingGroup ? (
        <div className="text-center py-10 small-muted">Loading group details...</div>
      ) : !group ? (
        <div className="text-center py-10" style={{ color: 'var(--loss)' }}>Group not found</div>
      ) : (
        <>
          <BalancesCard group={group} balances={balances} totalExpensesCents={totalExpensesCents} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <ExpenseList
                expenses={expenses}
                loading={loadingExpenses}
                onEdit={setEditingExpense}
                onDelete={handleDeleteExpense}
              />
            </div>

            <div>
              <ExpenseForm
                group={group}
                currentUser={currentUser}
                editingExpense={editingExpense}
                onCancelEdit={() => setEditingExpense(null)}
                onSaved={handleExpenseSaved}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default GroupDetails;

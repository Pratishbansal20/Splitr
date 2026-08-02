import React from 'react';
import { Trash2, Edit2 } from 'lucide-react';
import { formatINR } from '../utils/currency';
import { expenseAmountCents } from '../utils/money';

// Left column of the group details page: the list of expenses/settlements.
function ExpenseList({ expenses, loading, onEdit, onDelete }) {
  return (
    <div className="card">
      <h3 className="text-lg font-medium mb-3" style={{ fontFamily: 'var(--font-display)' }}>Expenses</h3>
      {loading ? <p className="small-muted">Loading expenses...</p> : expenses.length === 0 ? (
        <p className="small-muted">No expenses found for this group.</p>
      ) : (
        <ul className="space-y-2 max-h-[500px] overflow-y-auto">
          {expenses.map(exp => (
            <li key={exp._id} className="p-3 rounded-[var(--radius-sm)] border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors group">
              <div className="flex items-center justify-between">
                <div>
                  {exp.type === 'SETTLEMENT' ? (
                    <div className="font-semibold flex items-center" style={{ color: 'var(--profit)' }}>
                      💸 {exp.paidBy?.name} paid {exp.split[0]?.user?.name}
                    </div>
                  ) : (
                    <div className="font-medium">{exp.description}</div>
                  )}

                  <div className="small-muted text-xs">
                    <span className="font-semibold">{exp.paidBy?.name}</span> paid <span className="money">{formatINR(expenseAmountCents(exp))}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="text-xs mr-2" style={{ color: 'var(--text-faint)' }}>{new Date(exp.createdAt).toLocaleDateString()}</div>

                  <button
                    onClick={() => onEdit(exp)}
                    className="p-1 transition-colors"
                    style={{ color: 'var(--text-faint)' }}
                    title="Edit Expense"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => onDelete(exp._id)}
                    className="p-1 transition-colors hover:text-[var(--loss)]"
                    style={{ color: 'var(--text-faint)' }}
                    title="Delete Expense"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ExpenseList;

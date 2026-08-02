import React from 'react';
import { formatINR } from '../utils/currency';

// Group header: name/ID, total expenses, and the per-member balance grid.
function BalancesCard({ group, balances, totalExpensesCents }) {
  return (
    <div className="card">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)' }}>{group.name}</h1>
          {group._id !== 'nongroup' && (
            <div className="flex items-center space-x-2 text-sm small-muted">
              <span className="bg-[var(--surface-2)] px-2 py-1 rounded-md font-mono text-xs">ID: {group._id}</span>
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="label-eyebrow">Total Expenses</p>
          <p className="text-2xl font-bold money" style={{ color: 'var(--accent)' }}>{formatINR(totalExpensesCents)}</p>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-[var(--border)]">
        <h3 className="label-eyebrow mb-3">Member Balances</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {balances.map(b => (
            <div key={b.id} className={`p-3 rounded-[var(--radius-md)] border ${b.netBalanceCents > 0 ? 'bg-[var(--profit-soft)] border-[var(--profit-soft)]' : b.netBalanceCents < 0 ? 'bg-[var(--loss-soft)] border-[var(--loss-soft)]' : 'bg-[var(--surface-2)] border-[var(--border)]'}`}>
              <div className="text-xs font-semibold mb-1 small-muted">{b.name}</div>
              <div className={`font-bold money ${b.netBalanceCents > 0 ? 'amount-profit' : b.netBalanceCents < 0 ? 'amount-loss' : 'amount-neutral'}`}>
                {b.netBalanceCents > 0 ? '+' : ''}{formatINR(Math.abs(b.netBalanceCents))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BalancesCard;

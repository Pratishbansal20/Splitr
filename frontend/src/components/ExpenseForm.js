import React, { useState, useEffect } from 'react';
import api from '../api';
import { formatINR } from '../utils/currency';
import { toCents, fromCents, splitEqually } from '../utils/money';
import { isEqualSplit } from '../utils/balances';
import { useTheme } from '../contexts/ThemeContext';

function defaultPayerFor(group, currentUser) {
  const isMember = group.members.find(m => m._id === currentUser?.id);
  return isMember ? currentUser.id : group.members[0]._id;
}

// Right column of the group details page: add/edit expense form, covering
// both regular expenses (equal or exact split) and settlements.
function ExpenseForm({ group, currentUser, editingExpense, onCancelEdit, onSaved }) {
  const { isGirly } = useTheme();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitUsers, setSplitUsers] = useState([]); // Array of user IDs
  const [expenseError, setExpenseError] = useState('');
  const [expenseSuccess, setExpenseSuccess] = useState('');
  const [isSettlement, setIsSettlement] = useState(false);
  const [splitType, setSplitType] = useState('EQUAL'); // EQUAL, EXACT
  const [exactShares, setExactShares] = useState({}); // { userId: amount }

  // Re-derive form defaults whenever the group (re)loads, unless we're
  // mid-edit — guards against a background refetch (e.g. after deleting a
  // different expense) clobbering an in-progress edit.
  useEffect(() => {
    if (group && group.members.length > 0 && !editingExpense) {
      setPaidBy(defaultPayerFor(group, currentUser));
      setSplitUsers(group.members.map(m => m._id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group]);

  // Populate the form when an expense is selected for editing.
  useEffect(() => {
    if (!editingExpense) return;

    setDescription(editingExpense.description);
    setAmount(editingExpense.amount);
    setPaidBy(editingExpense.paidBy._id);
    setSplitUsers(editingExpense.split.map(s => s.user._id));

    if (isEqualSplit(editingExpense.amount, editingExpense.split)) {
      setSplitType('EQUAL');
      setExactShares({});
    } else {
      setSplitType('EXACT');
      const shareMap = {};
      editingExpense.split.forEach(s => { shareMap[s.user._id] = s.share; });
      setExactShares(shareMap);
    }

    setIsSettlement(editingExpense.type === 'SETTLEMENT');
    setExpenseError('');
    setExpenseSuccess('');
  }, [editingExpense]);

  const handleToggleSplitUser = (userId) => {
    setSplitUsers(prev => (prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]));
  };

  const handleCancelEdit = () => {
    onCancelEdit();
    setDescription('');
    setAmount('');
    if (group) {
      setSplitUsers(group.members.map(m => m._id));
      setPaidBy(defaultPayerFor(group, currentUser));
    }
    setIsSettlement(false);
    setSplitType('EQUAL');
    setExactShares({});
    setExpenseError('');
    setExpenseSuccess('');
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setExpenseError('');
    setExpenseSuccess('');

    if (splitUsers.length === 0) {
      setExpenseError('Please select at least one person.');
      return;
    }

    if (isSettlement && splitUsers.length > 1) {
      setExpenseError('Settlement must be with exactly one person.');
      return;
    }

    const totalAmount = parseFloat(amount);
    if (totalAmount <= 0) {
      setExpenseError('Amount must be greater than 0.');
      return;
    }

    let finalSplit = [];
    const amountCents = toCents(totalAmount);

    if (splitType === 'EQUAL' || isSettlement) {
      // Distribute in integer cents so shares always sum exactly to the
      // total, instead of naive division (₹100 / 3 no longer loses a cent).
      const sharesCents = splitEqually(amountCents, splitUsers.length);
      finalSplit = splitUsers.map((u, i) => ({ user: u, share: fromCents(sharesCents[i]) }));
    } else if (splitType === 'EXACT') {
      // Validate exact shares — compared in cents, so no float tolerance needed.
      let sumCents = 0;
      finalSplit = splitUsers.map(u => {
        const shareCents = toCents(parseFloat(exactShares[u] || 0));
        sumCents += shareCents;
        return { user: u, share: fromCents(shareCents) };
      });

      if (sumCents !== amountCents) {
        setExpenseError(`Shares total (${formatINR(sumCents)}) must match expense amount (${formatINR(amountCents)})`);
        return;
      }
    }

    try {
      const payload = {
        group: group._id === 'nongroup' ? null : group._id,
        description: isSettlement ? 'Settlement' : description,
        amount: totalAmount,
        paidBy,
        split: finalSplit,
        type: isSettlement ? 'SETTLEMENT' : 'EXPENSE'
      };

      if (editingExpense) {
        await api.put(`/expense/${editingExpense._id}`, payload);
        setExpenseSuccess('Expense updated successfully!');
      } else {
        await api.post('/expense/add', payload);
        setExpenseSuccess(isSettlement ? 'Payment recorded!' : 'Expense added successfully!');
      }

      // Reset form
      setDescription('');
      setAmount('');
      if (group) {
        setSplitUsers(group.members.map(m => m._id));
      }
      setIsSettlement(false);
      setSplitType('EQUAL');
      setExactShares({});

      onSaved();
    } catch (err) {
      setExpenseError(err?.response?.data?.error || 'Failed to save expense');
    }
  };

  const splitAssignedCents = splitUsers.reduce((sum, uid) => sum + toCents(parseFloat(exactShares[uid]) || 0), 0);
  const splitTargetCents = toCents(parseFloat(amount) || 0);

  return (
    <div className="card sticky top-6">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border)]">
        <h3 className="text-lg font-medium" style={{ fontFamily: 'var(--font-display)' }}>
          {editingExpense ? 'Edit Expense' : (isSettlement ? 'Record Payment' : 'Add New Expense')}
        </h3>
        {!editingExpense && (
          <button
            type="button"
            onClick={() => {
              const newMode = !isSettlement;
              setIsSettlement(newMode);
              if (newMode) {
                setSplitUsers([]); // Clear for settlement
              } else {
                if (group) setSplitUsers(group.members.map(m => m._id)); // Select all for expense
              }
            }}
            className="text-xs px-2 py-1 rounded-[var(--radius-sm)] border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors"
          >
            {isSettlement ? 'Switch to Expense' : 'Switch to Settle Up'}
          </button>
        )}
      </div>

      <form onSubmit={handleAddExpense} className="space-y-4">
        {!isSettlement && (
          <div>
            <label className="label-eyebrow block mb-1.5">Description</label>
            <input
              className="input-base w-full"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Dinner at Taj"
              required={!isSettlement}
            />
          </div>
        )}

        <div>
          <label className="label-eyebrow block mb-1.5">Amount (₹)</label>
          <input
            className="input-base w-full money"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="label-eyebrow block mb-1.5">{isSettlement ? 'Payer (Who paid?)' : 'Paid By'}</label>
            <select
              className="input-base w-full"
              value={paidBy}
              onChange={e => setPaidBy(e.target.value)}
              required
            >
              {group?.members.map(member => (
                <option key={member._id} value={member._id}>
                  {member.name} {member._id === currentUser?.id ? '(You)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label-eyebrow block mb-2">{isSettlement ? 'Receiver (Who got paid?)' : 'Split Details'}</label>

          {!isSettlement && (
            <div className="flex space-x-2 mb-2">
              <button
                type="button"
                onClick={() => setSplitType('EQUAL')}
                className="flex-1 py-1.5 text-xs rounded-[var(--radius-sm)] border font-medium transition-colors"
                style={splitType === 'EQUAL'
                  ? { background: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--accent)' }
                  : { background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-dim)' }}
              >
                Split Equally (=)
              </button>
              <button
                type="button"
                onClick={() => setSplitType('EXACT')}
                className="flex-1 py-1.5 text-xs rounded-[var(--radius-sm)] border font-medium transition-colors"
                style={splitType === 'EXACT'
                  ? { background: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--accent)' }
                  : { background: 'var(--surface-2)', borderColor: 'var(--border)', color: 'var(--text-dim)' }}
              >
                Exact Amounts (₹)
              </button>
            </div>
          )}

          <div className="space-y-1 max-h-48 overflow-y-auto border border-[var(--border)] rounded-[var(--radius-sm)] p-2 bg-[var(--surface-2)]">
            {group?.members.map(member => (
              <div key={member._id} className="flex items-center justify-between p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--surface-hover)]">
                <label className="flex items-center space-x-2 cursor-pointer flex-grow">
                  <input
                    type={isSettlement ? "radio" : "checkbox"}
                    name="splitUser"
                    checked={splitUsers.includes(member._id)}
                    onChange={() => {
                      if (isSettlement) {
                        setSplitUsers([member._id]);
                      } else {
                        handleToggleSplitUser(member._id);
                      }
                    }}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                  <span className="text-sm font-medium">
                    {member.name} {member._id === currentUser?.id ? '(You)' : ''}
                  </span>
                </label>

                {/* Exact Amount Input */}
                {!isSettlement && splitType === 'EXACT' && splitUsers.includes(member._id) && (
                  <div className="relative w-24">
                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-xs" style={{ color: 'var(--text-faint)' }}>₹</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full pl-5 pr-2 py-1 text-sm rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] outline-none focus:border-[var(--accent)] money"
                      value={exactShares[member._id] || ''}
                      onChange={(e) => setExactShares({ ...exactShares, [member._id]: e.target.value })}
                      placeholder="0.00"
                      onClick={(e) => e.stopPropagation()} // Prevent toggling checkbox
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {!isSettlement && (
            <div className="text-xs mt-2 text-right font-medium small-muted">
              {splitType === 'EQUAL' ? (
                <span>Selected: {splitUsers.length} • Share: <span className="money">{amount && splitUsers.length > 0 ? formatINR(Math.round(toCents(parseFloat(amount) || 0) / splitUsers.length)) : formatINR(0)}</span> / person</span>
              ) : (
                <span className={splitAssignedCents !== splitTargetCents ? 'amount-loss' : 'amount-profit'}>
                  Assigned: <span className="money">{formatINR(splitAssignedCents)}</span> / <span className="money">{formatINR(splitTargetCents)}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {expenseError && <div className="text-sm p-2 rounded-[var(--radius-sm)] bg-[var(--loss-soft)]" style={{ color: 'var(--loss)' }}>{expenseError}</div>}
        {expenseSuccess && <div className="text-sm p-2 rounded-[var(--radius-sm)] bg-[var(--profit-soft)]" style={{ color: 'var(--profit)' }}>{expenseSuccess}</div>}

        <div className="flex items-center justify-end pt-2 space-x-2">
          {editingExpense && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-4 py-2 rounded-[var(--radius-sm)] hover:bg-[var(--surface-2)] transition-colors small-muted"
            >
              Cancel
            </button>
          )}
          <button
            className="w-full md:w-auto px-4 py-2 rounded-[var(--radius-sm)] font-medium transition-all"
            style={isSettlement
              ? { background: 'var(--profit)', color: isGirly ? '#fff' : '#04140d' }
              : { background: 'var(--accent)', color: 'var(--accent-contrast)' }}
            type="submit"
          >
            {editingExpense ? 'Update Expense' : (isSettlement ? 'Record Payment' : 'Add Expense')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default ExpenseForm;

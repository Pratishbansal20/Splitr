import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Trash2, Edit2 } from 'lucide-react';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

function GroupDetails() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(true);

  // Form state
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [splitUsers, setSplitUsers] = useState([]); // Array of user IDs
  const [expenseError, setExpenseError] = useState('');
  const [expenseSuccess, setExpenseSuccess] = useState('');
  const [isSettlement, setIsSettlement] = useState(false);

  const fetchGroup = async () => {
    setLoadingGroup(true);
    try {
      const res = await api.get(`/group/${groupId}`);
      setGroup(res.data);
      // Initialize form defaults if not already set
      if (res.data && res.data.members.length > 0) {
        // Verified: logic update in previous step handles the fix.n the group, else first member
        const isMember = res.data.members.find(m => m._id === currentUser?.id);
        const defaultPayer = isMember ? currentUser.id : res.data.members[0]._id;
        setPaidBy(defaultPayer);

        // Default split to ALL members
        setSplitUsers(res.data.members.map(m => m._id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingGroup(false);
    }
  };

  const fetchExpenses = async () => {
    setLoadingExpenses(true);
    try {
      const res = await api.get(`/expense/group/${groupId}`);
      setExpenses(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingExpenses(false);
    }
  };

  // Calculate balances
  const calculateBalances = () => {
    const balances = {};
    if (!group) return balances;

    // Initialize 0 for everyone
    group.members.forEach(m => balances[m._id] = 0);

    expenses.forEach(exp => {
      const payerId = exp.paidBy._id;
      const amount = exp.amount;

      if (exp.type === 'SETTLEMENT') {
        // Payer gives money -> Payer is "owed" less (or "owes" less negative) -> Wait.
        // If Alice (Payer) gives Bob 50.
        // Alice was -50 (Owed Bob). Now Alice is 0.
        // Bob was +50 (Owed by Alice). Now Bob is 0.
        // So Payer gets +Amount (Balance increases), Receiver gets -Amount.
        // Wait, "Balance" usually means "Net amount you get back".
        // If I am +50, people owe me.
        // If I PAY someone, I am "losing" cash, but my debt goes down.
        // Standard logic: 
        // Payer: +Amount (They paid, so they are owed this back OR they reduced their debt)
        // Split Users: -Share (They consumed, so they owe this).

        // For Settlement: Alice pays Bob 50.
        // Alice (Payer) gets +50.
        // Bob (Receiver/Split) gets -50.
        // This works identical to Expense logic!
        // Exception: Settlements usually only have 1 split user (the receiver).
        if (balances[payerId] !== undefined) balances[payerId] += amount;
        exp.split.forEach(s => {
          if (balances[s.user._id] !== undefined) balances[s.user._id] -= s.share;
        });
      } else {
        // Regular Expense
        if (balances[payerId] !== undefined) balances[payerId] += amount;
        exp.split.forEach(s => {
          if (balances[s.user._id] !== undefined) balances[s.user._id] -= s.share;
        });
      }
    });
    // Convert map to array for display
    return Object.entries(balances).map(([userId, amount]) => {
      const member = group.members.find(m => m._id === userId);
      return {
        id: userId,
        name: member ? member.name : 'Unknown',
        netBalance: amount
      };
    });
  };

  const balances = calculateBalances();

  const handleSettleUp = async () => {
    // Simple Settle Up: "I (CurrentUser) pay SelectedUser Amount"
    // For MVP, we'll just quickly reuse the existing form logic or add a dedicated small form?
    // Let's add a "Settlement Mode" toggle to the form.
  };


  useEffect(() => {
    fetchGroup();
    fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const handleToggleSplitUser = (userId) => {
    setSplitUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // ... (keep handleAddExpense but modify payload)
  // Edit state
  const [editingExpenseId, setEditingExpenseId] = useState(null);

  // Split Logic State
  const [splitType, setSplitType] = useState('EQUAL'); // EQUAL, EXACT
  const [exactShares, setExactShares] = useState({}); // { userId: amount }

  // ... (keep start of fetchGroup)

  // ... (keep fetchExpenses)

  // ... (keep calculateBalances)

  // ... (keep useEffect)

  // ... (keep handleToggleSplitUser)

  // Helper to check if shares are roughly equal
  const areSharesEqual = (amt, splits) => {
    if (!splits || splits.length === 0) return true;
    const expected = amt / splits.length;
    return splits.every(s => Math.abs(s.share - expected) < 0.05);
  };

  const handleEditExpenseClick = (exp) => {
    setEditingExpenseId(exp._id);
    setDescription(exp.description);
    setAmount(exp.amount);
    setPaidBy(exp.paidBy._id);

    const userIds = exp.split.map(s => s.user._id);
    setSplitUsers(userIds);

    // Determine split type
    if (areSharesEqual(exp.amount, exp.split)) {
      setSplitType('EQUAL');
      setExactShares({});
    } else {
      setSplitType('EXACT');
      const shareMap = {};
      exp.split.forEach(s => {
        shareMap[s.user._id] = s.share;
      });
      setExactShares(shareMap);
    }

    setIsSettlement(exp.type === 'SETTLEMENT');
    setExpenseError('');
    setExpenseSuccess('');
  };

  const handleCancelEdit = () => {
    setEditingExpenseId(null);
    setDescription('');
    setAmount('');
    if (group) {
      setSplitUsers(group.members.map(m => m._id));
      const isMember = group.members.find(m => m._id === currentUser?.id);
      const defaultPayer = isMember ? currentUser.id : group.members[0]._id;
      setPaidBy(defaultPayer);
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

    if (splitType === 'EQUAL' || isSettlement) {
      finalSplit = splitUsers.map(u => ({ user: u, share: (totalAmount / splitUsers.length) }));
    } else if (splitType === 'EXACT') {
      // Validate exact shares
      let sum = 0;
      finalSplit = splitUsers.map(u => {
        const share = parseFloat(exactShares[u] || 0);
        sum += share;
        return { user: u, share };
      });

      if (Math.abs(sum - totalAmount) > 0.05) { // Allow small float error
        setExpenseError(`Shares total (₹${sum.toFixed(2)}) must match expense amount (₹${totalAmount.toFixed(2)})`);
        return;
      }
    }

    try {
      const payload = {
        group: groupId === 'nongroup' ? null : groupId,
        description: isSettlement ? 'Settlement' : description,
        amount: totalAmount,
        paidBy,
        split: finalSplit,
        type: isSettlement ? 'SETTLEMENT' : 'EXPENSE'
      };

      if (editingExpenseId) {
        // Update existing
        await api.put(`/expense/${editingExpenseId}`, payload);
        setExpenseSuccess('Expense updated successfully!');
        setEditingExpenseId(null); // Exit edit mode
      } else {
        // Create new
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

      fetchExpenses();
      fetchGroup(); // Recalculate totals
    } catch (err) {
      setExpenseError(err?.response?.data?.error || 'Failed to save expense');
    }
  };

  // Calculate total expenses for display
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);


  // Delete expense
  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      await api.delete(`/expense/${expenseId}`);
      fetchExpenses();
      fetchGroup(); // Re-fetch group to update totals if needed? Actually totals are derived from expenses, but good to be safe.
    } catch (e) {
      alert(e.response?.data?.error || "Failed to delete expense");
    }
  };

  return (
    <div className="space-y-6">
      <motion.button
        whileHover={{ x: -4 }}
        onClick={() => navigate('/groups')}
        className="flex items-center text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft size={20} className="mr-1" /> Back to Dashboard
      </motion.button>

      {loadingGroup ? (
        <div className="text-center py-10 text-gray-400">Loading group details...</div>
      ) : !group ? (
        <div className="text-center py-10 text-red-400">Group not found</div>
      ) : (
        <>
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-sm border border-white/60">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">{group.name}</h1>
                {group._id !== 'nongroup' && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded-md">ID: {group._id}</span>
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/join/${group._id}`;
                        navigator.clipboard.writeText(link);
                        alert(`Invite link copied!\n${link}\n(Note: 'Join by link' page coming soon)`);
                        navigator.clipboard.writeText(group._id);
                      }}
                      className="text-pink-500 font-medium hover:underline"
                    >
                      Copy Invite ID
                    </button>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Total Expenses</p>
                <p className="text-2xl font-bold text-indigo-600">₹{totalExpenses.toFixed(2)}</p>
              </div>
            </div>

            {/* Balances Card */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Member Balances</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {balances.map(b => (
                  <div key={b.id} className={`p-3 rounded-xl border ${b.netBalance > 0 ? 'bg-green-50 border-green-100' : b.netBalance < 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                    <div className="text-xs font-semibold text-gray-600 mb-1">{b.name}</div>
                    <div className={`font-bold ${b.netBalance > 0 ? 'text-green-600' : b.netBalance < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      {b.netBalance > 0 ? '+' : ''}₹{Math.abs(b.netBalance).toFixed(0)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Expenses List */}
            <div>
              <div className="card">
                <h3 className="text-lg font-medium mb-3">Expenses</h3>
                {loadingExpenses ? <p className="small-muted">Loading expenses...</p> : expenses.length === 0 ? (
                  <p className="small-muted">No expenses found for this group.</p>
                ) : (
                  <ul className="space-y-3 max-h-[500px] overflow-y-auto">
                    {expenses.map(exp => (
                      <li key={exp._id} className="p-3 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 group">
                        <div className="flex items-center justify-between">
                          <div>
                            {exp.type === 'SETTLEMENT' ? (
                              <div className="font-semibold text-green-600 flex items-center">
                                💸 {exp.paidBy?.name} paid {exp.split[0]?.user?.name}
                              </div>
                            ) : (
                              <div className="font-medium">{exp.description}</div>
                            )}

                            <div className="small-muted text-xs">
                              <span className="font-semibold text-gray-700 dark:text-gray-300">{exp.paidBy?.name}</span> paid ₹{exp.amount}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <div className="text-xs text-gray-400 mr-2">{new Date(exp.createdAt).toLocaleDateString()}</div>

                            <>
                              <button
                                onClick={() => handleEditExpenseClick(exp)}
                                className="text-gray-300 hover:text-blue-500 transition-colors p-1"
                                title="Edit Expense"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(exp._id)}
                                className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                title="Delete Expense"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>

                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Right Column: Add Expense Form */}
            <div>
              <div className="card sticky top-6">
                <div className="flex items-center justify-between mb-4 border-b pb-2">
                  <h3 className="text-lg font-medium">
                    {editingExpenseId ? 'Edit Expense' : (isSettlement ? 'Record Payment' : 'Add New Expense')}
                  </h3>
                  {!editingExpenseId && (
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
                      className="text-xs px-2 py-1 rounded border hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {isSettlement ? 'Switch to Expense' : 'Switch to Settle Up'}
                    </button>
                  )}
                </div>

                <form onSubmit={handleAddExpense} className="space-y-4">
                  {!isSettlement && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
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
                    <label className="block text-sm font-medium mb-1">Amount (₹)</label>
                    <input
                      className="input-base w-full"
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
                      <label className="block text-sm font-medium mb-1">{isSettlement ? 'Payer (Who paid?)' : 'Paid By'}</label>
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
                    <label className="block text-sm font-medium mb-2">{isSettlement ? 'Receiver (Who got paid?)' : 'Split Details'}</label>

                    {!isSettlement && (
                      <div className="flex space-x-2 mb-2">
                        <button
                          type="button"
                          onClick={() => setSplitType('EQUAL')}
                          className={`flex-1 py-1 text-xs rounded border transition-colors ${splitType === 'EQUAL' ? 'bg-indigo-100 border-indigo-500 text-indigo-700 font-medium' : 'bg-white hover:bg-gray-50 text-gray-600'}`}
                        >
                          Split Equally (=)
                        </button>
                        <button
                          type="button"
                          onClick={() => setSplitType('EXACT')}
                          className={`flex-1 py-1 text-xs rounded border transition-colors ${splitType === 'EXACT' ? 'bg-indigo-100 border-indigo-500 text-indigo-700 font-medium' : 'bg-white hover:bg-gray-50 text-gray-600'}`}
                        >
                          Exact Amounts (₹)
                        </button>
                      </div>
                    )}

                    <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-2 bg-gray-50 dark:bg-gray-900">
                      {group?.members.map(member => (
                        <div key={member._id} className="flex items-center justify-between p-1 hover:bg-gray-100 rounded">
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
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                              {member.name} {member._id === currentUser?.id ? '(You)' : ''}
                            </span>
                          </label>

                          {/* Exact Amount Input */}
                          {!isSettlement && splitType === 'EXACT' && splitUsers.includes(member._id) && (
                            <div className="relative w-24">
                              <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">₹</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-full pl-5 pr-2 py-1 text-sm border rounded focus:ring-1 focus:ring-indigo-500 outline-none"
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
                      <div className="text-xs text-gray-500 mt-2 text-right font-medium">
                        {splitType === 'EQUAL' ? (
                          <span>Selected: {splitUsers.length} • Share: ₹{amount && splitUsers.length > 0 ? (amount / splitUsers.length).toFixed(2) : '0.00'} / person</span>
                        ) : (
                          <span className={Math.abs(splitUsers.reduce((sum, uid) => sum + (parseFloat(exactShares[uid]) || 0), 0) - (parseFloat(amount) || 0)) > 0.05 ? "text-red-500" : "text-green-600"}>
                            Assigned: ₹{splitUsers.reduce((sum, uid) => sum + (parseFloat(exactShares[uid]) || 0), 0).toFixed(2)} / {amount || '0.00'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {expenseError && <div className="text-red-500 text-sm p-2 bg-red-50 rounded">{expenseError}</div>}
                  {expenseSuccess && <div className="text-green-500 text-sm p-2 bg-green-50 rounded">{expenseSuccess}</div>}

                  <div className="flex items-center justify-end pt-2 space-x-2">
                    {editingExpenseId && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                      >
                        Cancel
                      </button>
                    )}
                    <button className={`w-full md:w-auto px-4 py-2 text-white rounded ${isSettlement ? 'bg-green-600 hover:bg-green-700' : 'btn-primary'}`} type="submit">
                      {editingExpenseId ? 'Update Expense' : (isSettlement ? 'Record Payment' : 'Add Expense')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default GroupDetails;

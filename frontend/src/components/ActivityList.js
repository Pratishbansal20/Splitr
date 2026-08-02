import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Activity as ActivityIcon, RefreshCw, Trash2 } from 'lucide-react';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatINR } from '../utils/currency';
import { expenseAmountCents, splitShareCents } from '../utils/money';
import { useApiData } from '../hooks/useApiData';
import { staggerContainer as container, staggerItem as item } from '../animations/stagger';
import { useTheme } from '../contexts/ThemeContext';

function ActivityList() {
    const { user } = useAuth();
    const { isGirly } = useTheme();
    const { showToast } = useToast();

    const fetchActivityRequest = useCallback(async () => {
        const res = await api.get('/expense/activity');
        return res.data || [];
    }, []);
    const { data: activities, loading, refetch: fetchActivity } = useApiData(fetchActivityRequest, [fetchActivityRequest], []);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this expense?")) return;
        try {
            await api.delete(`/expense/${id}`);
            fetchActivity(); // Refresh list
        } catch (e) {
            showToast(e.response?.data?.error || 'Failed to delete');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center" style={{ fontFamily: 'var(--font-display)' }}>
                    <ActivityIcon className="mr-2" style={{ color: 'var(--accent)' }} /> Recent Activity
                </h1>
                <button onClick={fetchActivity} className="p-2 rounded-full transition-colors" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
                    <RefreshCw size={18} />
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20 small-muted">Loading activity...</div>
            ) : activities.length === 0 ? (
                <div className="text-center py-20 rounded-[var(--radius-lg)] border border-dashed border-[var(--border)]">
                    <h3 className="text-lg font-bold">{isGirly ? 'No activity yet ✨' : 'No activity yet'}</h3>
                    <p className="small-muted text-sm">Expenses and settlements will appear here.</p>
                </div>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="space-y-3"
                >
                    {activities.map(act => {
                        const isPayer = act.paidBy._id === user.id;
                        const isSettlement = act.type === 'SETTLEMENT';

                        let actionText = '';
                        let amountClass = '';

                        if (isSettlement) {
                            if (isPayer) {
                                const receiver = act.split[0]?.user;
                                actionText = `You paid ${receiver?.name || 'someone'}`;
                            } else {
                                actionText = `${act.paidBy.name} paid you`;
                            }
                            amountClass = 'amount-profit';
                        } else {
                            if (isPayer) {
                                actionText = `You added "${act.description}"`;
                                amountClass = 'amount-profit';
                            } else {
                                actionText = `${act.paidBy.name} added "${act.description}"`;
                                amountClass = 'amount-loss';
                            }
                        }

                        return (
                            <motion.div key={act._id} variants={item} className="card !p-4 flex items-center justify-between group">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isSettlement ? 'bg-[var(--profit-soft)]' : 'bg-[var(--accent-soft)]'}`} style={{ color: isSettlement ? 'var(--profit)' : 'var(--accent)' }}>
                                        {isSettlement ? '₹' : <ActivityIcon size={18} />}
                                    </div>
                                    <div>
                                        <div className="font-bold">{actionText}</div>
                                        <div className="text-xs small-muted">
                                            {act.group?.name ? `in ${act.group.name}` : 'Personal'} • {new Date(act.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <div className="text-right">
                                        <div className={`font-bold money ${amountClass}`}>
                                            {isPayer
                                                ? `You paid ${formatINR(expenseAmountCents(act))}`
                                                : `You owe ${formatINR(splitShareCents(act.split.find(s => s.user._id === user.id) || { shareCents: 0 }))}`}
                                        </div>
                                        <div className="text-xs hidden sm:block money" style={{ color: 'var(--text-faint)' }}>
                                            Total: {formatINR(expenseAmountCents(act))}
                                        </div>
                                    </div>

                                    {isPayer && (
                                        <button
                                            onClick={() => handleDelete(act._id)}
                                            className="p-2 transition-colors opacity-0 group-hover:opacity-100 hover:text-[var(--loss)]"
                                            style={{ color: 'var(--text-faint)' }}
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}
        </div>
    );
}

export default ActivityList;

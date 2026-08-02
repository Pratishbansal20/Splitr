import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, User } from 'lucide-react';
import api from '../api';
import AddFriendModal from './AddFriendModal';
import { formatINR } from '../utils/currency';
import { toCents } from '../utils/money';
import { staggerContainer as container, staggerItemScale as item } from '../animations/stagger';
import { useTheme } from '../contexts/ThemeContext';

function FriendsList() {
    const { isGirly } = useTheme();
    const [friends, setFriends] = useState([]); // [{ _id, name, email }]
    const [balances, setBalances] = useState({}); // { friendId: amountCents }
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Get Friends
            const friendsRes = await api.get('/friends');
            const friendList = friendsRes.data || [];
            setFriends(friendList);

            // 2. Calculate Balances (Fetch all groups + expenses)
            // Note: In a large app, this should be a dedicated backend endpoint /friends/balances
            // For MVP, we calculate locally or add backend support.
            // Existing GET /group returns 'memberDetails' for each group!
            // We can use that!
            const groupsRes = await api.get('/group');
            const groups = groupsRes.data || [];

            // Sum in cents (not rupee floats) to avoid float drift when
            // aggregating a balance across many groups.
            const balMapCents = {};
            groups.forEach(group => {
                if (group.memberDetails) {
                    group.memberDetails.forEach(detail => {
                        balMapCents[detail.id] = (balMapCents[detail.id] || 0) + toCents(detail.amount);
                    });
                }
            });
            setBalances(balMapCents);

        } catch (e) {
            console.error("Failed to load friend data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Your Friends</h1>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 font-bold flex items-center transition-colors"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: isGirly ? '9999px' : 'var(--radius-sm)', color: 'var(--accent)' }}
                >
                    <UserPlus className="w-4 h-4 mr-2" /> Add Friend
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20 small-muted">Loading friends...</div>
            ) : friends.length === 0 ? (
                <div className="text-center py-20 rounded-[var(--radius-lg)] border border-dashed border-[var(--border)]">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--surface-2)', color: 'var(--text-faint)' }}>
                        <User size={32} />
                    </div>
                    <h3 className="text-lg font-bold">No friends yet</h3>
                    <p className="small-muted text-sm mb-4">Add friends to split bills easily!</p>
                    <button onClick={() => setShowAddModal(true)} className="font-bold hover:underline" style={{ color: 'var(--accent)' }}>Add a friend</button>
                </div>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    {friends.map(friend => {
                        const balanceCents = balances[friend._id] || 0;
                        return (
                            <motion.div key={friend._id} variants={item} className="card !p-4 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isGirly ? 'bg-gradient-to-br from-indigo-200 to-purple-200 text-gray-600' : 'bg-[var(--surface-2)] border border-[var(--border)]'}`}>
                                        {friend.name[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-bold">{friend.name}</div>
                                        <div className="text-xs small-muted">{friend.email}</div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    {balanceCents === 0 ? (
                                        <div className="text-xs font-medium bg-[var(--surface-2)] px-2 py-1 rounded-full small-muted">Settled</div>
                                    ) : (
                                        <div>
                                            <div className="text-xs font-medium uppercase small-muted">{balanceCents > 0 ? 'Owes you' : 'You owe'}</div>
                                            <div className={`font-bold money ${balanceCents > 0 ? 'amount-profit' : 'amount-loss'}`}>
                                                {formatINR(Math.abs(balanceCents))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}

            <AddFriendModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onFriendAdded={fetchData}
            />
        </div>
    );
}

export default FriendsList;

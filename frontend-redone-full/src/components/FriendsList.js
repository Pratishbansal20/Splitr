import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, User } from 'lucide-react';
import api from '../api';
import AddFriendModal from './AddFriendModal';

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { opacity: 0, scale: 0.9 },
    show: { opacity: 1, scale: 1 }
};

function FriendsList() {
    const [friends, setFriends] = useState([]); // [{ _id, name, email }]
    const [balances, setBalances] = useState({}); // { friendId: amount }
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

            const balMap = {};
            groups.forEach(group => {
                if (group.memberDetails) {
                    group.memberDetails.forEach(detail => {
                        balMap[detail.id] = (balMap[detail.id] || 0) + detail.amount;
                    });
                }
            });
            setBalances(balMap);

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
                <h1 className="text-2xl font-bold text-gray-800">Your Friends</h1>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-white text-teal-600 font-bold rounded-full shadow-md border border-teal-100 flex items-center hover:bg-teal-50 transition-colors"
                >
                    <UserPlus className="w-4 h-4 mr-2" /> Add Friend
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-400">Loading friends...</div>
            ) : friends.length === 0 ? (
                <div className="text-center py-20 bg-white/50 border border-dashed border-gray-300 rounded-3xl">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <User size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-600">No friends yet</h3>
                    <p className="text-gray-400 text-sm mb-4">Add friends to split bills easily!</p>
                    <button onClick={() => setShowAddModal(true)} className="text-teal-500 font-bold hover:underline">Add a friend</button>
                </div>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    {friends.map(friend => {
                        const balance = balances[friend._id] || 0;
                        return (
                            <motion.div key={friend._id} variants={item} className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-white/60 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-200 to-purple-200 flex items-center justify-center font-bold text-gray-600">
                                        {friend.name[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800">{friend.name}</div>
                                        <div className="text-xs text-gray-500">{friend.email}</div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    {Math.abs(balance) < 0.01 ? (
                                        <div className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded-full">Settled</div>
                                    ) : (
                                        <div>
                                            <div className="text-xs text-gray-400 font-medium uppercase">{balance > 0 ? 'Owes you' : 'You owe'}</div>
                                            <div className={`font-bold ${balance > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                ₹{Math.abs(balance).toFixed(2)}
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

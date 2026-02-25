import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity as ActivityIcon, RefreshCw, Trash2 } from 'lucide-react';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';

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
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

function ActivityList() {
    const { user } = useAuth();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchActivity = async () => {
        setLoading(true);
        try {
            const res = await api.get('/expense/activity');
            setActivities(res.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this expense?")) return;
        try {
            await api.delete(`/expense/${id}`);
            fetchActivity(); // Refresh list
        } catch (e) {
            alert('Failed to delete');
        }
    };

    useEffect(() => {
        fetchActivity();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center">
                    <ActivityIcon className="mr-2 text-pink-500" /> Recent Activity
                </h1>
                <button onClick={fetchActivity} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 text-gray-500">
                    <RefreshCw size={18} />
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-400">Loading activity...</div>
            ) : activities.length === 0 ? (
                <div className="text-center py-20 bg-white/50 border border-dashed border-gray-300 rounded-3xl">
                    <h3 className="text-lg font-bold text-gray-600">No activity yet</h3>
                    <p className="text-gray-400 text-sm">Expenses and settlements will appear here.</p>
                </div>
            ) : (
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="space-y-4"
                >
                    {activities.map(act => {
                        const isPayer = act.paidBy._id === user.id;
                        const isSettlement = act.type === 'SETTLEMENT';

                        // Determination involved logic
                        let actionText = '';
                        let amountColor = '';

                        if (isSettlement) {
                            if (isPayer) {
                                const receiver = act.split[0]?.user;
                                actionText = `You paid ${receiver?.name || 'someone'}`;
                                amountColor = 'text-green-600';
                            } else {
                                actionText = `${act.paidBy.name} paid you`;
                                amountColor = 'text-green-600';
                            }
                        } else {
                            if (isPayer) {
                                actionText = `You added "${act.description}"`;
                                amountColor = 'text-green-600';
                            } else {
                                actionText = `${act.paidBy.name} added "${act.description}"`;
                                amountColor = 'text-red-500';
                            }
                        }

                        return (
                            <motion.div key={act._id} variants={item} className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-white/60 flex items-center justify-between group">
                                <div className="flex items-center space-x-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${isSettlement ? 'bg-green-100 text-green-600' : 'bg-pink-100 text-pink-500'}`}>
                                        {isSettlement ? '₹' : <ActivityIcon size={18} />}
                                    </div>
                                    <div>
                                        <div className="font-bold text-gray-800">{actionText}</div>
                                        <div className="text-xs text-gray-500">
                                            {act.group?.name ? `in ${act.group.name}` : 'Personal'} • {new Date(act.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <div className="text-right">
                                        <div className={`font-bold ${amountColor}`}>
                                            {isPayer ? `You paid ₹${act.amount}` : `You owe ₹${act.split.find(s => s.user === user.id)?.share.toFixed(2) || 0}`}
                                        </div>
                                        <div className="text-xs text-gray-400 hidden sm:block">
                                            Total: ₹{act.amount}
                                        </div>
                                    </div>

                                    {isPayer && (
                                        <button
                                            onClick={() => handleDelete(act._id)}
                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
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

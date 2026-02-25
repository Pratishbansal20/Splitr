import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Search, X, Check } from 'lucide-react';
import api from '../api';

function AddFriendModal({ isOpen, onClose, onFriendAdded }) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(null); // 'success' | 'error'
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim()) return;

        setLoading(true);
        setStatus(null);
        try {
            await api.post('/friends/add', { email });
            setStatus('success');
            setMessage('Friend added successfully!');
            setTimeout(() => {
                onFriendAdded();
                onClose();
                setEmail('');
                setStatus(null);
            }, 1500);
        } catch (err) {
            setStatus('error');
            setMessage(err.response?.data?.error || 'Failed to add friend');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
                        >
                            <div className="bg-gradient-to-r from-teal-200 to-blue-200 p-6 flex justify-between items-center">
                                <h2 className="text-gray-800 font-bold text-lg flex items-center">
                                    <UserPlus className="w-5 h-5 mr-2" /> Add Friend
                                </h2>
                                <button onClick={onClose}><X className="w-5 h-5 text-gray-600 hover:text-gray-900" /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <p className="text-sm text-gray-500">Enter your friend's email address to add them to your list.</p>

                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="email"
                                        required
                                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-300 focus:border-teal-300 outline-none transition-all"
                                        placeholder="friend@example.com"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>

                                {status && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`text-sm p-3 rounded-lg flex items-center ${status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                    >
                                        {status === 'success' ? <Check className="w-4 h-4 mr-2" /> : <X className="w-4 h-4 mr-2" />}
                                        {message}
                                    </motion.div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || !email.trim()}
                                    className="w-full py-3 bg-gradient-to-r from-teal-400 to-blue-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Adding...' : 'Add Friend'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default AddFriendModal;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Users } from 'lucide-react';
import api from '../api';

function CreateGroupModal({ isOpen, onClose, onGroupCreated }) {
    const [name, setName] = useState('');
    const [members, setMembers] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadUsers();
            setName('');
            setMembers([]);
            setSearchTerm('');
        }
    }, [isOpen]);

    const loadUsers = async () => {
        setLoadingUsers(true);
        try {
            // Changed from /auth/users to /friends to restrict to friend list
            const res = await api.get('/friends');
            setAllUsers(res.data || []);
        } catch (e) {
            console.error("Failed to load friends", e);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setSubmitting(true);
        try {
            await api.post('/group/create', { name, members });
            if (onGroupCreated) onGroupCreated();
            onClose();
        } catch (e) {
            console.error(e);
            alert('Failed to create group');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleMember = (id) => {
        setMembers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const filteredUsers = allUsers.filter(u =>
        (u.name || u.email).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                        >
                            <div className="bg-gradient-to-r from-pink-200 to-purple-200 p-6 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                                    <Users className="w-5 h-5 mr-2" />
                                    New Group
                                </h2>
                                <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                                    <X className="w-5 h-5 text-gray-700" />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                                    <input
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-pink-300 focus:border-pink-300 outline-none transition-all"
                                        placeholder="e.g. Goa Trip 🌴"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Add Members</label>
                                    <input
                                        className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm mb-2"
                                        placeholder="Search friends..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />

                                    <div className="h-48 overflow-y-auto border border-gray-100 rounded-xl custom-scrollbar pr-1">
                                        {loadingUsers ? (
                                            <div className="p-4 text-center text-gray-400 text-sm">Loading friends...</div>
                                        ) : filteredUsers.length === 0 ? (
                                            <div className="p-4 text-center text-gray-400 text-sm">No users found.</div>
                                        ) : (
                                            <div className="space-y-1 p-1">
                                                {filteredUsers.map(u => (
                                                    <div
                                                        key={u.id || u._id}
                                                        onClick={() => toggleMember(u.id || u._id)}
                                                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${members.includes(u.id || u._id) ? 'bg-pink-50 border border-pink-100' : 'hover:bg-gray-50'}`}
                                                    >
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-200 to-teal-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                                                {(u.name || 'U')[0].toUpperCase()}
                                                            </div>
                                                            <span className="text-sm font-medium text-gray-700">{u.name || u.email}</span>
                                                        </div>
                                                        {members.includes(u.id || u._id) && <Check className="w-4 h-4 text-pink-500" />}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right text-xs text-gray-400 mt-1">
                                        {members.length} selected
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting || !name.trim()}
                                    className="w-full py-3 bg-gradient-to-r from-pink-400 to-purple-400 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Creating...' : 'Create Group ✨'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export default CreateGroupModal;

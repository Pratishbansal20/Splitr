import React, { useState, useEffect } from 'react';
import { Check, Users } from 'lucide-react';
import api from '../api';
import Modal from './Modal';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';

function CreateGroupModal({ isOpen, onClose, onGroupCreated }) {
    const { isGirly } = useTheme();
    const { showToast } = useToast();
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
            showToast(e.response?.data?.error || 'Failed to create group');
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
        <Modal isOpen={isOpen} onClose={onClose} title="New Group" icon={Users}>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
                <div>
                    <label className="label-eyebrow block mb-1.5">Group Name</label>
                    <input
                        className="input-base"
                        placeholder="e.g. Goa Trip 🌴"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        autoFocus
                    />
                </div>

                <div>
                    <label className="label-eyebrow block mb-1.5">Add Members</label>
                    <input
                        className="input-base text-sm mb-2"
                        placeholder="Search friends..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />

                    <div className="h-48 overflow-y-auto border border-[var(--border)] rounded-[var(--radius-sm)] pr-1">
                        {loadingUsers ? (
                            <div className="p-4 text-center text-sm small-muted">Loading friends...</div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="p-4 text-center text-sm small-muted">No users found.</div>
                        ) : (
                            <div className="space-y-1 p-1">
                                {filteredUsers.map(u => (
                                    <div
                                        key={u.id || u._id}
                                        onClick={() => toggleMember(u.id || u._id)}
                                        className="flex items-center justify-between p-2 rounded-[var(--radius-sm)] cursor-pointer transition-colors"
                                        style={members.includes(u.id || u._id) ? { background: 'var(--accent-soft)' } : undefined}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isGirly ? 'bg-gradient-to-tr from-blue-200 to-teal-200 text-gray-600' : 'bg-[var(--surface-2)] border border-[var(--border)]'}`}>
                                                {(u.name || 'U')[0].toUpperCase()}
                                            </div>
                                            <span className="text-sm font-medium">{u.name || u.email}</span>
                                        </div>
                                        {members.includes(u.id || u._id) && <Check className="w-4 h-4" style={{ color: 'var(--accent)' }} />}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="text-right text-xs mt-1 small-muted">
                        {members.length} selected
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={submitting || !name.trim()}
                    className={`w-full py-3 font-bold rounded-[var(--radius-sm)] transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isGirly ? 'bg-gradient-to-r from-pink-400 to-purple-400 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]' : ''}`}
                    style={isGirly ? { color: '#fff' } : { background: 'var(--accent)', color: 'var(--accent-contrast)' }}
                >
                    {submitting ? 'Creating...' : (isGirly ? 'Create Group ✨' : 'Create Group')}
                </button>
            </form>
        </Modal>
    );
}

export default CreateGroupModal;

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Search, X, Check } from 'lucide-react';
import api from '../api';
import Modal from './Modal';
import { useTheme } from '../contexts/ThemeContext';

function AddFriendModal({ isOpen, onClose, onFriendAdded }) {
    const { isGirly } = useTheme();
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
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Add Friend"
            icon={UserPlus}
            headerClassName="bg-gradient-to-r from-teal-200 to-blue-200"
            maxWidthClassName="max-w-sm"
        >
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <p className="text-sm small-muted">Enter your friend's email address to add them to your list.</p>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-faint)' }} />
                    <input
                        type="email"
                        required
                        className="input-base pl-10"
                        placeholder="friend@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                </div>

                {status && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm p-3 rounded-[var(--radius-sm)] flex items-center"
                        style={status === 'success'
                            ? { background: 'var(--profit-soft)', color: 'var(--profit)' }
                            : { background: 'var(--loss-soft)', color: 'var(--loss)' }}
                    >
                        {status === 'success' ? <Check className="w-4 h-4 mr-2" /> : <X className="w-4 h-4 mr-2" />}
                        {message}
                    </motion.div>
                )}

                <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className={`w-full py-3 font-bold rounded-[var(--radius-sm)] transition-all disabled:opacity-50 ${isGirly ? 'bg-gradient-to-r from-teal-400 to-blue-500 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]' : ''}`}
                    style={isGirly ? { color: '#fff' } : { background: 'var(--accent)', color: 'var(--accent-contrast)' }}
                >
                    {loading ? 'Adding...' : 'Add Friend'}
                </button>
            </form>
        </Modal>
    );
}

export default AddFriendModal;

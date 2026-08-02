import React, { useState, useCallback } from 'react';
import api from '../api';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Wallet, ChevronRight, Users } from 'lucide-react';
import CreateGroupModal from './CreateGroupModal';
import { formatINR } from '../utils/currency';
import { toCents, sumRupeesAsCents } from '../utils/money';
import { useApiData } from '../hooks/useApiData';
import { useTheme } from '../contexts/ThemeContext';
import { staggerContainer as container, staggerItem as item } from '../animations/stagger';

function GroupList() {
  const navigate = useNavigate();
  const { isGirly } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchGroupsRequest = useCallback(async () => {
    const res = await api.get('/group/');
    return res.data || [];
  }, []);
  const { data: groups, loading, refetch: fetchGroups } = useApiData(fetchGroupsRequest, [fetchGroupsRequest], []);

  const totalBalanceCents = sumRupeesAsCents(groups.map(g => g.myBalance));
  const isUp = totalBalanceCents >= 0;

  return (
    <div className="space-y-8">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Balance Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-card)] flex items-center justify-between"
        >
          <div>
            <div className="label-eyebrow">Total Net Balance</div>
            <div className={`text-4xl font-bold mt-1 money ${isUp ? 'amount-profit' : 'amount-loss'}`} style={{ fontFamily: isGirly ? 'var(--font-display)' : 'var(--font-mono)' }}>
              {isUp ? '+' : '-'}{formatINR(Math.abs(totalBalanceCents))}
            </div>
            <div className="text-xs mt-2 font-medium" style={{ color: 'var(--text-faint)' }}>
              {isGirly
                ? (isUp ? "You are doing great! 🌸" : "Time to settle up! 💸")
                : (isUp ? "Net positive across all groups." : "Net negative — you owe more than you're owed.")}
            </div>
          </div>
          <div className={`p-4 rounded-full ${isUp ? 'bg-[var(--profit-soft)] text-[var(--profit)]' : 'bg-[var(--loss-soft)] text-[var(--loss)]'}`}>
            <Wallet size={32} />
          </div>
        </motion.div>

        {/* Create Group CTA */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsModalOpen(true)}
          className={`p-6 rounded-[var(--radius-lg)] flex flex-col items-center justify-center text-center cursor-pointer border-none text-[var(--accent-contrast)] ${isGirly ? 'bg-gradient-to-br from-pink-400 to-purple-500 shadow-xl' : 'bg-[var(--accent)]'}`}
        >
          <div className="bg-white/20 p-3 rounded-full mb-3">
            <Plus size={32} />
          </div>
          <div className="font-bold text-xl" style={{ fontFamily: 'var(--font-display)' }}>Create New Group</div>
          <div className="text-white/80 text-sm">Start splitting expenses</div>
        </motion.button>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4 pl-1" style={{ fontFamily: 'var(--font-display)' }}>Your Groups</h2>

        {loading ? (
          <div className="py-10 text-center small-muted">{isGirly ? 'Loading your groups... ⏳' : 'Loading groups…'}</div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {/* Non-Group Expenses Card */}
            <motion.div variants={item}>
              <div
                onClick={() => navigate('/groups/nongroup')}
                className="bg-[var(--surface)] border border-[var(--border)] p-5 rounded-[var(--radius-lg)] hover:bg-[var(--surface-hover)] transition-all duration-300 flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-[var(--radius-sm)] bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center" style={{ color: 'var(--text-dim)' }}>
                    <Users size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold group-hover:text-[var(--accent)] transition-colors">Non-Group Expenses</h3>
                    <p className="text-xs small-muted">Friends & Personal Transactions</p>
                  </div>
                </div>
                <ChevronRight className="group-hover:translate-x-1 transition-all" style={{ color: 'var(--text-faint)' }} />
              </div>
            </motion.div>

            {/* Real Groups */}
            {groups.map(group => (
              <motion.div key={group._id} variants={item}>
                <Link to={`/groups/${group._id}`} className="block group">
                  <div className="bg-[var(--surface)] border border-[var(--border)] p-5 rounded-[var(--radius-lg)] hover:bg-[var(--surface-hover)] transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Info */}
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-[var(--radius-sm)] flex items-center justify-center text-xl font-bold ${isGirly ? 'bg-gradient-to-tr from-indigo-200 to-purple-200 text-gray-700' : 'bg-[var(--surface-2)] border border-[var(--border)]'}`} style={{ fontFamily: 'var(--font-mono)' }}>
                        {group.name[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold group-hover:text-[var(--accent)] transition-colors">{group.name}</h3>
                        <div className="text-xs flex items-center gap-1 small-muted">
                          <Users size={12} /> {group.members.length} members
                        </div>
                      </div>
                    </div>

                    {/* Middle: Detailed breakdown */}
                    <div className="flex-1 md:px-8">
                      {group.memberDetails && group.memberDetails.length > 0 ? (
                        <div className="flex flex-wrap gap-2 text-xs">
                          {group.memberDetails.filter(d => toCents(d.amount) !== 0).slice(0, 3).map(detail => (
                            <span key={detail.id} className={`px-2 py-1 rounded-md font-medium ${detail.amount > 0 ? 'bg-[var(--profit-soft)] text-[var(--profit)]' : 'bg-[var(--loss-soft)] text-[var(--loss)]'}`}>
                              {detail.name.split(' ')[0]} {detail.amount > 0 ? 'owes you' : 'you owe'} {formatINR(Math.abs(toCents(detail.amount)))}
                            </span>
                          ))}
                          {group.memberDetails.filter(d => toCents(d.amount) !== 0).length > 3 && (
                            <span className="px-2 py-1 bg-[var(--surface-2)] rounded-md small-muted">+{group.memberDetails.length - 3} more</span>
                          )}
                          {group.memberDetails.every(d => toCents(d.amount) === 0) && (
                            <span className="italic small-muted">{isGirly ? 'All settled up ✨' : 'Settled'}</span>
                          )}
                        </div>
                      ) : (
                        <div className="h-1 bg-[var(--surface-2)] rounded-full w-full max-w-[200px] overflow-hidden">
                          <div className="h-full bg-[var(--border)] w-1/3"></div>
                        </div>
                      )}
                    </div>

                    {/* Right: Net Balance */}
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="label-eyebrow">Your Balance</div>
                        <div className={`text-xl font-bold money ${group.myBalance > 0 ? 'amount-profit' : group.myBalance < 0 ? 'amount-loss' : 'amount-neutral'}`}>
                          {group.myBalance > 0 ? '+' : ''}{formatINR(Math.abs(toCents(group.myBalance || 0)))}
                        </div>
                      </div>
                      <ChevronRight className="group-hover:translate-x-1 transition-all" style={{ color: 'var(--text-faint)' }} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <CreateGroupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGroupCreated={() => {
          fetchGroups();
        }}
      />
    </div>
  );
}

export default GroupList;

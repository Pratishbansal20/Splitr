import React, { useEffect, useState } from 'react';
import api from '../api';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Wallet, ChevronRight, Users } from 'lucide-react';
import CreateGroupModal from './CreateGroupModal';

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

function GroupList() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await api.get('/group/');
      setGroups(res.data || []);
    } catch (e) {
      // console.error(e); // Removed as per instruction
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const totalBalance = groups.reduce((acc, g) => acc + (g.myBalance || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Balance Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/80 backdrop-blur-md border border-white/50 p-6 rounded-2xl shadow-xl flex items-center justify-between"
        >
          <div>
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Net Balance</div>
            <div className={`text-4xl font-bold mt-1 ${totalBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {totalBalance >= 0 ? '+' : '-'}{'₹'}{Math.abs(totalBalance).toFixed(2)}
            </div>
            <div className="text-xs text-gray-400 mt-2 font-medium">
              {totalBalance >= 0 ? "You are doing great! 🌸" : "Time to settle up! 💸"}
            </div>
          </div>
          <div className={`p-4 rounded-full ${totalBalance >= 0 ? 'bg-emerald-100 text-emerald-500' : 'bg-rose-100 text-rose-500'}`}>
            <Wallet size={32} />
          </div>
        </motion.div>

        {/* Create Group CTA */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-br from-pink-400 to-purple-500 text-white p-6 rounded-2xl shadow-xl flex flex-col items-center justify-center text-center cursor-pointer border-none"
        >
          <div className="bg-white/20 p-3 rounded-full mb-3">
            <Plus size={32} />
          </div>
          <div className="font-bold text-xl">Create New Group</div>
          <div className="text-white/80 text-sm">Start splitting expenses</div>
        </motion.button>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4 pl-1">Your Groups</h2>

        {loading ? (
          <div className="py-10 text-center text-gray-400">Loading your groups... ⏳</div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {/* Non-Group Expenses Card (Styled as a Row Item, White Theme) */}
            <motion.div variants={item}>
              <div
                onClick={() => navigate('/groups/nongroup')}
                className="bg-white/80 backdrop-blur-sm border border-white/60 p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-gray-200 to-gray-300 flex items-center justify-center text-gray-700 shadow-inner">
                    <Users size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-pink-500 transition-colors">Non-Group Expenses</h3>
                    <p className="text-xs text-gray-500">Friends & Personal Transactions</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-300 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
              </div>
            </motion.div>

            {/* Real Groups */}
            {groups.map(group => (
              <motion.div key={group._id} variants={item}>
                <Link to={`/groups/${group._id}`} className="block group">
                  <div className="bg-white/80 backdrop-blur-sm border border-white/60 p-5 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Left: Info */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-200 to-purple-200 flex items-center justify-center text-xl font-bold text-gray-700 shadow-inner">
                        {group.name[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 group-hover:text-pink-500 transition-colors">{group.name}</h3>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Users size={12} /> {group.members.length} members
                        </div>
                      </div>
                    </div>

                    {/* Middle: Detailed breakdown */}
                    <div className="flex-1 md:px-8">
                      {group.memberDetails && group.memberDetails.length > 0 ? (
                        <div className="flex flex-wrap gap-2 text-xs">
                          {group.memberDetails.filter(d => Math.abs(d.amount) > 0.01).slice(0, 3).map(detail => (
                            <span key={detail.id} className={`px-2 py-1 rounded-md font-medium ${detail.amount > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {detail.name.split(' ')[0]} {detail.amount > 0 ? 'owes you' : 'you owe'} ₹{Math.abs(detail.amount).toFixed(0)}
                            </span>
                          ))}
                          {group.memberDetails.filter(d => Math.abs(d.amount) > 0.01).length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-md">+{group.memberDetails.length - 3} more</span>
                          )}
                          {group.memberDetails.every(d => Math.abs(d.amount) < 0.01) && (
                            <span className="text-gray-400 italic">All settled up ✨</span>
                          )}
                        </div>
                      ) : (
                        <div className="h-1 bg-gray-100 rounded-full w-full max-w-[200px] overflow-hidden">
                          <div className="h-full bg-gray-200 w-1/3"></div>
                        </div>
                      )}
                    </div>

                    {/* Right: Net Balance */}
                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Your Balance</div>
                        <div className={`text-xl font-bold ${group.myBalance > 0 ? 'text-emerald-500' : group.myBalance < 0 ? 'text-rose-500' : 'text-gray-400'}`}>
                          {group.myBalance > 0 ? '+' : ''}₹{Math.abs(group.myBalance || 0).toFixed(2)}
                        </div>
                      </div>
                      <ChevronRight className="text-gray-300 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
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
          // Optional: Close modal if not handled inside
        }}
      />
    </div>
  );
}

export default GroupList;

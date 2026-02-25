import React, { useState, useEffect } from 'react';
import api from '../api';

function GroupCreateForm({ onGroupCreated }) {
  const [name, setName] = useState('');
  const [members, setMembers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await api.get('/auth/users');
        setAllUsers(res.data || []);
      } catch (e) {}
    }
    loadUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/group/create', { name, members });
      setName('');
      setMembers([]);
      if (onGroupCreated) onGroupCreated();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (id) => {
    setMembers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <form onSubmit={handleCreate} className="flex items-center space-x-2">
      <input className="input-base" placeholder="New group name" value={name} onChange={e => setName(e.target.value)} required />
      <select className="input-base" value="" onChange={e => toggleMember(e.target.value)}>
        <option value="">Add member</option>
        {allUsers.map(u => <option key={u.id || u._id} value={u.id || u._id}>{u.name || u.email}</option>)}
      </select>
      <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create'}</button>
    </form>
  );
}

export default GroupCreateForm;

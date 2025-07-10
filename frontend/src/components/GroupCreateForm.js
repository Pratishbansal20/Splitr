import React, { useState, useEffect } from 'react';
import api from '../api';

function GroupCreateForm({ onGroupCreated }) {
  const [name, setName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch users on mount
  useEffect(() => {
    api.get('/auth/users')
      .then(res => setUsers(res.data))
      .catch(() => setError('Failed to fetch users'));
  }, []);

  // Handle user selection
  const handleUserSelect = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setSelectedUserIds(selected);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || selectedUserIds.length === 0) {
      setError('Group name and at least one member are required.');
      return;
    }

    try {
      const res = await api.post('/group/create', {
        name,
        members: selectedUserIds
      });
      setSuccess('Group created!');
      setName('');
      setSelectedUserIds([]);
      if (onGroupCreated) onGroupCreated(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create group');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
      <input
        type="text"
        placeholder="Group Name"
        value={name}
        onChange={e => setName(e.target.value)}
        required
      />
      {/* Multi-select dropdown for users */}
      <select
        multiple
        value={selectedUserIds}
        onChange={handleUserSelect}
        style={{ marginLeft: '10px', minWidth: '200px', height: '80px' }}
        required
      >
        {users.map(user => (
          <option key={user._id} value={user._id}>
            {user.name} ({user.email})
          </option>
        ))}
      </select>
      <button type="submit" style={{ marginLeft: '10px' }}>Create Group</button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {success && <div style={{ color: 'green' }}>{success}</div>}
    </form>
  );
}

export default GroupCreateForm;

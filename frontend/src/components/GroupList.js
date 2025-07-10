import React, { useEffect, useState } from 'react';
import api from '../api';
import GroupCreateForm from './GroupCreateForm';
import { Link } from 'react-router-dom';



function GroupList() {
  const [groups, setGroups] = useState([]);

  const fetchGroups = async () => {
    const res = await api.get('/group/');
    setGroups(res.data);
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return (
    <div>
      <GroupCreateForm onGroupCreated={fetchGroups} />
      <h2>Your Groups</h2>
      <ul>
        {groups.map(group => (
            <li key={group._id}>
                <Link to={`/groups/${group._id}`}>{group.name}</Link>
            </li>
        ))}
      </ul>
    </div>
  );
}

export default GroupList;

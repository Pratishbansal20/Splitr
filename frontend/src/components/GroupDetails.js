import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

function GroupDetails() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch group details
  useEffect(() => {
    api.get(`/group/${groupId}`)
      .then(res => {
        setGroup(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load group details');
        setLoading(false);
      });
  }, [groupId]);

  // Fetch expenses for the group
  useEffect(() => {
    api.get(`/expense/?group=${groupId}`)
      .then(res => setExpenses(res.data))
      .catch(() => setExpenses([]));
  }, [groupId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!group) return <div>No group found.</div>;

  return (
    <div>
      <h2>{group.name}</h2>
      <h3>Members</h3>
      <ul>
        {group.members.map(member => (
          <li key={member._id}>{member.name} ({member.email})</li>
        ))}
      </ul>

      <h3>Expenses</h3>
      {expenses.length === 0 ? (
        <p>No expenses found for this group.</p>
      ) : (
        <ul>
          {expenses.map(expense => (
            <li key={expense._id}>
              {expense.description}: ₹{expense.amount} (Paid by {expense.paidBy.name || expense.paidBy})
            </li>
          ))}
        </ul>
      )}

      {/* Add more group info or expense management features here */}
    </div>
  );
}

export default GroupDetails;

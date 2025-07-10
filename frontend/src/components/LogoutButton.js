import React from 'react';
import { useAuth } from '../contexts/AuthContext';

function LogoutButton() {
  const { logout } = useAuth();

  return (
    <button onClick={logout} style={{ marginLeft: '10px' }}>
      Logout
    </button>
  );
}

export default LogoutButton;

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

function LogoutButton() {
  const { logout } = useAuth();
  const { isGirly } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 transition-all duration-300 group"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: isGirly ? '9999px' : 'var(--radius-sm)',
        color: 'var(--text-dim)',
      }}
    >
      <span className="text-sm font-medium">Logout</span>
      <LogOut size={16} className="transition-colors group-hover:opacity-80" />
    </button>
  );
}

export default LogoutButton;

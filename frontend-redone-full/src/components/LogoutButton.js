import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';

function LogoutButton() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 hover:bg-white/80 backdrop-blur-md border border-white/50 shadow-sm text-gray-600 hover:text-pink-500 transition-all duration-300 group"
    >
      <span className="text-sm font-medium">Logout</span>
      <LogOut size={16} className="text-gray-400 group-hover:text-pink-500 transition-colors" />
    </button>
  );
}

export default LogoutButton;

import React, { useState, useCallback, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Heart, Users, Activity, Sparkles } from "lucide-react";
import GroupList from "./components/GroupList";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import { ProtectedRoute, PublicOnlyRoute } from "./components/ProtectedRoute";
import { useAuth } from "./contexts/AuthContext";
import { useTheme } from "./contexts/ThemeContext";
import { useSecretCode, useTapCode } from "./hooks/useSecretCode";
import LogoutButton from "./components/LogoutButton";
import GroupDetails from "./components/GroupDetails";
import FriendsList from "./components/FriendsList";
import ActivityList from "./components/ActivityList";
import BackgroundAnimation from "./components/BackgroundAnimation";
import ToastStack from "./components/ToastStack";

const Tabs = [
  { id: "dashboard", label: "Dashboard", path: "/groups", icon: Home },
  { id: "friends", label: "Friends", path: "/friends", iconFinance: Users, iconGirly: Heart },
  { id: "activity", label: "Activity", path: "/activity", icon: Activity },
];

function TabNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { isGirly } = useTheme();

  if (!user) return null;

  return (
    <div className="flex justify-center">
      <div className="flex space-x-1 p-1.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: isGirly ? '9999px' : 'var(--radius-md)' }}>
        {Tabs.map((tab) => {
          const isActive = location.pathname === tab.path || (tab.path === '/groups' && location.pathname.startsWith('/groups'));
          const Icon = tab.icon || (isGirly ? tab.iconGirly : tab.iconFinance);
          return (
            <Link
              key={tab.id}
              to={tab.path}
              className="relative px-5 py-2.5 flex items-center space-x-2 transition-colors duration-300"
              style={{ borderRadius: isGirly ? '9999px' : 'var(--radius-sm)', color: isActive ? 'var(--accent-contrast)' : 'var(--text-dim)' }}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0"
                  style={{
                    background: isGirly ? 'linear-gradient(90deg, #f9a8d4, #c4b5fd)' : 'var(--accent)',
                    borderRadius: isGirly ? '9999px' : 'var(--radius-sm)',
                  }}
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <Icon className="w-4 h-4 z-10 relative" />
              <span className="font-medium text-sm z-10 relative">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function FloatingHeader({ onLogoTap }) {
  const { user } = useAuth();
  const { isGirly } = useTheme();
  return (
    <div className="flex justify-between items-center py-4 px-6 w-full">
      <div className="flex items-center flex-shrink-0">
        <img
          src="/logo.png"
          alt="Splitr"
          onClick={onLogoTap}
          className={`w-auto object-contain select-none ${isGirly ? 'h-24' : 'h-14 rounded-md'}`}
          style={{ cursor: 'default' }}
        />
      </div>

      <div className="flex-1 px-4">
        <TabNav />
      </div>

      <div className="flex-shrink-0 flex justify-end" style={{ minWidth: '6rem' }}>
        {user && <LogoutButton />}
      </div>
    </div>
  );
}

function UnlockToast({ mode }) {
  const isGirly = mode === 'girly';
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-5 py-3 shadow-lg"
      style={{
        background: isGirly ? 'linear-gradient(90deg, #f9a8d4, #c4b5fd)' : 'var(--surface-2)',
        border: `1px solid ${isGirly ? 'transparent' : 'var(--accent)'}`,
        borderRadius: isGirly ? '9999px' : 'var(--radius-md)',
        color: isGirly ? '#4a2545' : 'var(--text)',
      }}
    >
      <Sparkles className="w-4 h-4" style={{ color: isGirly ? '#4a2545' : 'var(--accent)' }} />
      <span className="text-sm font-semibold">
        {isGirly ? "You found it! Welcome to fairy mode ✨" : "Back to business."}
      </span>
    </motion.div>
  );
}

function App() {
  const { user } = useAuth();
  const { isGirly, toggleTheme } = useTheme();
  const [toastMode, setToastMode] = useState(null);
  const toastTimer = useRef(null);

  // Show a toast reflecting the theme *after* the toggle (computed from the
  // current value before flipping it), auto-dismissed after a few seconds.
  const triggerUnlock = useCallback(() => {
    const nextIsGirly = !isGirly;
    toggleTheme();
    setToastMode(nextIsGirly ? 'girly' : 'finance');
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMode(null), 2800);
  }, [isGirly, toggleTheme]);

  useSecretCode(triggerUnlock);
  // Mobile/no-keyboard fallback for the secret code: 5 taps on the logo.
  // Window is generous (3s) since thumb-tapping is slower than key-mashing.
  const registerLogoTap = useTapCode(triggerUnlock, { taps: 5, windowMs: 3000 });

  return (
    <Router>
      <div className="min-h-screen relative overflow-hidden">
        {isGirly && <BackgroundAnimation />}
        <ToastStack />

        <div className="max-w-6xl mx-auto relative z-10 flex flex-col min-h-screen">
          <FloatingHeader onLogoTap={registerLogoTap} />

          <main className="flex-grow px-4 pb-10">
            <Routes>
              <Route path="/login" element={<PublicOnlyRoute><LoginForm /></PublicOnlyRoute>} />
              <Route path="/register" element={<PublicOnlyRoute><RegisterForm /></PublicOnlyRoute>} />

              <Route path="/groups" element={<ProtectedRoute><GroupList /></ProtectedRoute>} />
              <Route path="/groups/:groupId" element={<ProtectedRoute><GroupDetails /></ProtectedRoute>} />

              <Route path="/friends" element={<ProtectedRoute><FriendsList /></ProtectedRoute>} />
              <Route path="/activity" element={<ProtectedRoute><ActivityList /></ProtectedRoute>} />

              <Route path="*" element={<Navigate to={user ? "/groups" : "/login"} />} />
            </Routes>
          </main>

          <footer className="text-center py-4 text-xs font-medium" style={{ color: 'var(--text-faint)' }}>
            {isGirly ? "Made with 💖 using Splitr" : "Splitr — split smarter."}
          </footer>
        </div>

        <AnimatePresence>
          {toastMode && <UnlockToast mode={toastMode} />}
        </AnimatePresence>
      </div>
    </Router>
  );
}

export default App;

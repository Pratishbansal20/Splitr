import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, Heart, Activity } from "lucide-react";
import GroupList from "./components/GroupList";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import { useAuth } from "./contexts/AuthContext";
import LogoutButton from "./components/LogoutButton";
import GroupDetails from "./components/GroupDetails";
import FriendsList from "./components/FriendsList";
import ActivityList from "./components/ActivityList";
import BackgroundAnimation from "./components/BackgroundAnimation";

const Tabs = [
  { id: "dashboard", label: "Dashboard", path: "/groups", icon: Home },
  { id: "friends", label: "Friends", path: "/friends", icon: Heart },
  { id: "activity", label: "Activity", path: "/activity", icon: Activity },
];

function TabNav() {
  const location = useLocation();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex justify-center">
      <div className="flex space-x-2 bg-white/60 backdrop-blur-md p-2 rounded-full shadow-sm">
        {Tabs.map((tab) => {
          const isActive = location.pathname === tab.path || (tab.path === '/groups' && location.pathname.startsWith('/groups'));
          return (
            <Link
              key={tab.id}
              to={tab.path}
              className={`relative px-6 py-3 rounded-full flex items-center space-x-2 transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-600 hover:text-pink-400'}`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-pink-300 to-purple-300 rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <tab.icon className="w-4 h-4 z-10 relative" />
              <span className="font-medium text-sm z-10 relative">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function FloatingHeader() {
  const { user } = useAuth();
  return (
    <div className="flex justify-between items-center py-4 px-6 w-full">
      <div className="flex items-center flex-shrink-0">
        {/* Logo */}
        <img src="/logo.png" alt="Splitr" className="h-24 w-auto object-contain" />
      </div>

      {/* Tabs - Centered */}
      <div className="flex-1 px-4">
        <TabNav />
      </div>

      <div className="flex-shrink-0 w-24 flex justify-end">
        {user && <LogoutButton />}
      </div>
    </div>
  );
}

function PlaceholderPage({ title }) {
  return (
    <div className="card text-center py-20">
      <h2 className="text-2xl font-bold text-gray-700 mb-2">{title}</h2>
      <p className="text-gray-500">Coming soon in Phase 6 & 7! ✨</p>
    </div>
  );
}

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <div className="min-h-screen relative overflow-hidden">
        <BackgroundAnimation />

        <div className="max-w-6xl mx-auto relative z-10 flex flex-col min-h-screen">
          <FloatingHeader />
          {/* TabNav removed from here */}

          <main className="flex-grow px-4 pb-10">
            <Routes>
              <Route path="/login" element={!user ? <LoginForm /> : <Navigate to="/groups" />} />
              <Route path="/register" element={!user ? <RegisterForm /> : <Navigate to="/groups" />} />

              <Route path="/groups" element={user ? <GroupList /> : <Navigate to="/login" />} />
              <Route path="/groups/:groupId" element={user ? <GroupDetails /> : <Navigate to="/login" />} />

              <Route path="/friends" element={user ? <FriendsList /> : <Navigate to="/login" />} />
              <Route path="/activity" element={user ? <ActivityList /> : <Navigate to="/login" />} />

              <Route path="*" element={<Navigate to={user ? "/groups" : "/login"} />} />
            </Routes>
          </main>

          <footer className="text-center py-4 text-xs text-gray-400 font-medium">
            Made with 💖 using Splitr
          </footer>
        </div>
      </div>
    </Router>
  );
}

export default App;

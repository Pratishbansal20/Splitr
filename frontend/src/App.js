import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import GroupList from './components/GroupList';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import { useAuth } from './contexts/AuthContext';
import LogoutButton from './components/LogoutButton';
import { NavLink } from 'react-router-dom';
import GroupDetails from './components/GroupDetails';

function NavBar() {
  const { user } = useAuth();

  return (
    <nav style={{ marginBottom: '20px' }}>
      {!user && (
        <>
          <NavLink to="/login" style={{ marginRight: '10px' }}>Login</NavLink>
          <NavLink to="/register" style={{ marginRight: '10px' }}>Register</NavLink>
        </>
      )}
      <NavLink to="/groups" style={{ marginRight: '10px' }}>Groups</NavLink>
      {user && <LogoutButton />}
    </nav>
  );
}

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1>Splitr</h1>
        </div>
        <NavBar />
        <Routes>
          <Route path="/login" element={!user ? <LoginForm /> : <Navigate to="/groups" />} />
          <Route path="/register" element={!user ? <RegisterForm /> : <Navigate to="/groups" />} />
          <Route path="/groups" element={user ? <GroupList /> : <Navigate to="/login" />} />
          <Route path="/groups/:groupId" element={user ? <GroupDetails /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to={user ? "/groups" : "/login"} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

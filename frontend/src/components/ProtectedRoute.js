import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Wraps a route that requires an authenticated user, replacing the inline
// `user ? <X /> : <Navigate to="/login" />` ternary that used to be
// duplicated on every protected route.
export function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

// Wraps a route that should only be reachable when signed out (login/register).
export function PublicOnlyRoute({ children }) {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/groups" replace />;
}

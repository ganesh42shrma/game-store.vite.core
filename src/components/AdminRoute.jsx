import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminRoute({ children }) {
  const { user, isAdmin } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }
  if (!isAdmin) {
    return <Navigate to="/home" replace />;
  }

  return children;
}

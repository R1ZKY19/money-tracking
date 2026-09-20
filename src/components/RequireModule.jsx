import { Navigate } from 'react-router-dom';
import { useUserRole } from '@/lib/UserRoleContext';

export default function RequireModule({ module, children }) {
  const { loading, hasModule } = useUserRole();
  if (loading) return null;
  if (!hasModule(module)) return <Navigate to="/" replace />;
  return children;
}
// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wrap any route element that should be protected by auth and/or role.
 *
 * Props:
 * - children: the element to render if access is allowed
 * - role?: limit access to a specific role (e.g. 'Admin')
 *
 * Behavior:
 * 1) If not logged in → redirect to /login and remember the original URL.
 * 2) If logged in but wrong role → redirect to home (/).
 * 3) Else render the children.
 */
export default function ProtectedRoute({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: 'Admin';
}) {
  const { user } = useAuth();
  const location = useLocation(); // current URL, used to send user back after login

  // Not authenticated → go to /login and keep "from" so we can navigate back later
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Authenticated but lacks required role → send to home
  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  // Allowed → render the protected content
  return <>{children}</>;
}

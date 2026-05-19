import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

export default function ProtectedRoute({
  children,
  roles,
  requireVerified = false,
}) {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireVerified && !user?.isVerified) {
    return <Navigate to="/profile" replace state={{ verifyRequired: true }} />;
  }

  return children;
}

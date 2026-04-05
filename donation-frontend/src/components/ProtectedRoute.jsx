import { Navigate } from "react-router-dom";

function ProtectedRoute({ allowedRole, children }) {
  const token = localStorage.getItem("access");
  const role = localStorage.getItem("role");

  // If not logged in → go to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Role compatibility for unified dashboard
  const userRoles = ["donor", "receiver", "volunteer", "user"];
  const isCompatibleUser = userRoles.includes(role) && userRoles.includes(allowedRole);

  if (allowedRole && role !== allowedRole && !isCompatibleUser) {
    // Otherwise, redirect to their default dashboard
    const redirectPath = userRoles.includes(role) ? "/dashboard/user" : `/dashboard/${role}`;
    return <Navigate to={redirectPath} replace />;
  }

  // If everything is OK → show the page
  return children;
}

export default ProtectedRoute;

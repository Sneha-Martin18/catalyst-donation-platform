import { Navigate } from "react-router-dom";

function ProtectedRoute({ allowedRole, children }) {
  const token = localStorage.getItem("access");
  const role = localStorage.getItem("role");

  // If not logged in → go to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If logged in but wrong role → send to correct dashboard
  if (allowedRole && role !== allowedRole) {
    return <Navigate to={`/dashboard/${role}`} replace />;
  }

  // If everything is OK → show the page
  return children;
}

export default ProtectedRoute;

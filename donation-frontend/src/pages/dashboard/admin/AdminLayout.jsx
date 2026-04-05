import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import "./AdminLayout.css";

function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    if (path === "" && location.pathname === "/dashboard/admin") return true;
    return path !== "" && location.pathname.includes(path);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <h3>⚙️ Admin</h3>
          <p>Control Center</p>
        </div>

        <nav className="sidebar-nav">
          {/* DASHBOARD */}
          <Link
            to=""
            className={`nav-link ${isActive("") ? "active" : ""}`}
          >
            <span className="icon">📊</span>
            <span>Dashboard</span>
          </Link>

          {/* USERS */}
          <Link
            to="users"
            className={`nav-link ${isActive("users") ? "active" : ""}`}
          >
            <span className="icon">👥</span>
            <span>Users</span>
          </Link>

          {/* APPROVALS */}
          <Link
            to="approvals"
            className={`nav-link ${isActive("approvals") ? "active" : ""}`}
          >
            <span className="icon">✅</span>
            <span>Approvals</span>
          </Link>

          {/* RECEIVER REQUESTS */}
          <Link
            to="receiver-requests"
            className={`nav-link ${isActive("receiver-requests") ? "active" : ""}`}
          >
            <span className="icon">📋</span>
            <span>Requests</span>
          </Link>

          {/* ASSIGN VOLUNTEERS */}
          <Link
            to="assign-volunteers"
            className={`nav-link ${isActive("assign-volunteers") ? "active" : ""}`}
          >
            <span className="icon">🛵</span>
            <span>Assign Volunteers</span>
          </Link>

          {/* 🔹 REPORTS (NEW) */}
          <Link
            to="reports"
            className={`nav-link ${isActive("reports") ? "active" : ""}`}
          >
            <span className="icon">📄</span>
            <span>Reports</span>
          </Link>

          {/* 🔹 CAMPAIGNS (NEW) */}
          <Link
            to="campaigns"
            className={`nav-link ${isActive("campaigns") ? "active" : ""}`}
          >
            <span className="icon">📢</span>
            <span>Live Campaigns</span>
          </Link>

          {/* PROFILE (global) */}
          <Link
            to="/profile"
            className={`nav-link ${location.pathname === "/profile" ? "active" : ""
              }`}
          >
            <span className="icon">👤</span>
            <span>Profile</span>
          </Link>

          <Link
            to="/dashboard/admin/about"
            className={`nav-link ${isActive("about") ? "active" : ""}`}
          >
            <span className="icon">ℹ️</span>
            <span>About</span>
          </Link>

          {/* LOGOUT */}
          <button
            className="nav-link"
            onClick={handleLogout}
            style={{
              background: "transparent",
              border: "none",
              width: "100%",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <span className="icon">🚪</span>
            <span>Logout</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <p className="help-text">Need help? Check logs</p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}

export default AdminLayout;

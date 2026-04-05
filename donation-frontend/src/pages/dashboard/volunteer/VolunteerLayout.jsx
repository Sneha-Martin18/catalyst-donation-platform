import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import "./VolunteerLayout.css";

function VolunteerLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    if (path === "" && location.pathname === "/dashboard/volunteer") return true;
    return location.pathname.includes(path) && path !== "";
  };

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("role");
    navigate("/login", { replace: true });
  };

  return (
    <div className="volunteer-layout">
      <aside className="volunteer-sidebar">
        {/* HEADER */}
        <div className="sidebar-header">
          <h3>🤝 Volunteer</h3>
          <p>Delivery Partner</p>
        </div>

        {/* NAV */}
        <nav className="sidebar-nav">
          <Link
            to=""
            className={`nav-link ${isActive("") ? "active" : ""}`}
          >
            📊 Dashboard
          </Link>

          <Link
            to="profile"
            className={`nav-link ${isActive("profile") ? "active" : ""}`}
          >
            👤 Profile
          </Link>

          <Link
            to="tasks"
            className={`nav-link ${isActive("tasks") ? "active" : ""}`}
          >
            📋 All Tasks
          </Link>

          <Link
            to="history"
            className={`nav-link ${isActive("history") ? "active" : ""}`}
          >
            📜 History
          </Link>
        </nav>

        {/* FOOTER + LOGOUT */}
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      <main className="volunteer-main">
        <Outlet />
      </main>
    </div>
  );
}

export default VolunteerLayout;

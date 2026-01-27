import { Outlet, Link, useLocation } from "react-router-dom";
import "./VolunteerLayout.css";

function VolunteerLayout() {
  const location = useLocation();

  const isActive = (path) => {
    if (path === "" && location.pathname === "/dashboard/volunteer") return true;
    return location.pathname.includes(path) && path !== "";
  };

  return (
    <div className="volunteer-layout">
      
      {/* SIDEBAR */}
      <aside className="volunteer-sidebar">
        <div className="sidebar-header">
          <h3>🤝 Volunteer</h3>
          <p>Delivery Partner</p>
        </div>

        <nav className="sidebar-nav">
          <Link 
            to="" 
            className={`nav-link ${isActive("") ? "active" : ""}`}
          >
            <span className="icon">📊</span>
            <span>Dashboard</span>
          </Link>
          <Link 
            to="tasks" 
            className={`nav-link ${isActive("tasks") ? "active" : ""}`}
          >
            <span className="icon">📋</span>
            <span>All Tasks</span>
          </Link>
          <Link 
            to="history" 
            className={`nav-link ${isActive("history") ? "active" : ""}`}
          >
            <span className="icon">📜</span>
            <span>History</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <p className="help-text">Need help? Contact support</p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="volunteer-main">
        <Outlet />
      </main>

    </div>
  );
}

export default VolunteerLayout;

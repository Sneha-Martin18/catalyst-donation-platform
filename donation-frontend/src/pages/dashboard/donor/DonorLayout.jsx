import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import "./DonorLayout.css";

function DonorLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const isActive = (path) => {
    if (path === "" && location.pathname === "/dashboard/donor") return true;
    return location.pathname.includes(path) && path !== "";
  };

  return (
    <div className="donor-layout">
      
      {/* SIDEBAR */}
      <aside className="donor-sidebar">
        <div className="sidebar-header">
          <h3>🎁 Donor</h3>
          <p>Donation Center</p>
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
            to="donate"
            className={`nav-link ${isActive("donate") ? "active" : ""}`}
          >
            <span className="icon">➕</span>
            <span>New Donation</span>
          </Link>

          <Link
            to="donations"
            className={`nav-link ${isActive("donations") ? "active" : ""}`}
          >
            <span className="icon">📦</span>
            <span>My Donations</span>
          </Link>

          <Link
            to="history"
            className={`nav-link ${isActive("history") ? "active" : ""}`}
          >
            <span className="icon">📜</span>
            <span>History</span>
          </Link>

          {/* PROFILE */}
          <Link
            to="/profile"
            className={`nav-link ${location.pathname === "/profile" ? "active" : ""}`}
          >
            <span className="icon">👤</span>
            <span>Profile</span>
          </Link>

          {/* LOGOUT */}
          <button
            className="nav-link logout-btn"
            onClick={handleLogout}
          >
            <span className="icon">🚪</span>
            <span>Logout</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <p className="help-text">Keep giving, keep caring</p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="donor-main">
        <Outlet />
      </main>
    </div>
  );
}

export default DonorLayout;

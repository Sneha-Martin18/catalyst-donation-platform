import { Outlet, Link, useNavigate } from "react-router-dom";
import api from "../../../api/api";
import "./ReceiverLayout.css";

function ReceiverLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // 1️⃣ Remove tokens
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");

    // 2️⃣ Remove Authorization header
    delete api.defaults.headers.common["Authorization"];

    // 3️⃣ Redirect to login
    navigate("/login");
  };

  return (
    <div className="receiver-layout">

      {/* Sidebar */}
      <aside className="receiver-sidebar">
        <div className="sidebar-header">
          <h3>Receiver Panel</h3>
        </div>

        <nav className="sidebar-nav">
          <ul>
            <li>
              <Link to="" className="nav-link">📊 Dashboard</Link>
            </li>
            <li>
              <Link to="create" className="nav-link">📝 Create Request</Link>
            </li>
            <li>
              <Link to="my-requests" className="nav-link">📋 My Requests</Link>
            </li>
            <li>
              <Link to="browse" className="nav-link">🎁 Browse Donations</Link>
            </li>
            <li>
              <Link to="my-orders" className="nav-link">📦 My Orders</Link>
            </li>
          </ul>
        </nav>

        {/* 🔴 LOGOUT BUTTON */}
        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="receiver-content">
        <Outlet />
      </main>

    </div>
  );
}

export default ReceiverLayout;

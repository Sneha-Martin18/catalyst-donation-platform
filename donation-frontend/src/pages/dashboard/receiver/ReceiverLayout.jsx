import { Outlet, Link } from "react-router-dom";
import "./ReceiverLayout.css";

function ReceiverLayout() {
  return (
    <div className="receiver-layout">
      
      {/* Sidebar */}
      <aside className="receiver-sidebar">
        <div className="sidebar-header">
          <h3>Receiver Panel</h3>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li><Link to="" className="nav-link">📊 Dashboard</Link></li>
            <li><Link to="create" className="nav-link">📝 Create Request</Link></li>
            <li><Link to="requests" className="nav-link">📋 My Requests</Link></li>
            <li><Link to="browse-donations" className="nav-link">🎁 Browse Donations</Link></li>
            <li><Link to="my-orders" className="nav-link">📦 My Orders</Link></li>
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <main className="receiver-content">
        <Outlet />
      </main>

    </div>
  );
}

export default ReceiverLayout;

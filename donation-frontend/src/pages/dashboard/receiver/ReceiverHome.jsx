import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../../api/api";
import RecommendationEngine from "../../../components/Recommendations/RecommendationEngine";
import "./ReceiverHome.css";

function ReceiverHome() {
  const [stats, setStats] = useState({
    pendingRequests: 0,
    approvedRequests: 0,
    totalOrders: 0,
    completedOrders: 0,
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch requests
      const requestsRes = await api.get("receiver/requests/");
      const requests = requestsRes.data;

      // Fetch orders
      const ordersRes = await api.get("receiver/orders/");
      const orders = ordersRes.data;

      // Calculate stats
      const pendingReqs = requests.filter(r => r.status === 'pending').length;
      const approvedReqs = requests.filter(r => r.status === 'approved').length;
      const completedOrds = orders.filter(o => o.status === 'completed').length;

      setStats({
        pendingRequests: pendingReqs,
        approvedRequests: approvedReqs,
        totalOrders: orders.length,
        completedOrders: completedOrds,
      });

      setRecentRequests(requests.slice(-3).reverse());
      setRecentOrders(orders.slice(-3).reverse());

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="receiver-home"><p>Loading dashboard...</p></div>;
  }

  return (
    <div className="receiver-home">
      <h1>Receiver Dashboard</h1>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon pending">📝</div>
          <div className="stat-content">
            <h3>{stats.pendingRequests}</h3>
            <p>Pending Requests</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon approved">✅</div>
          <div className="stat-content">
            <h3>{stats.approvedRequests}</h3>
            <p>Approved Requests</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orders">📦</div>
          <div className="stat-content">
            <h3>{stats.totalOrders}</h3>
            <p>Total Orders</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon completed">🎉</div>
          <div className="stat-content">
            <h3>{stats.completedOrders}</h3>
            <p>Completed</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <Link to="create" className="action-btn btn-primary">
            📝 Create New Request
          </Link>
          <Link to="browse" className="action-btn btn-secondary">
            🎁 Browse Donations
          </Link>
          <Link to="my-requests" className="action-btn btn-info">
            📋 View All Requests
          </Link>
          <Link to="my-orders" className="action-btn btn-success">
            📦 View Orders
          </Link>
        </div>

        <section className="dashboard-recommendations">
          <RecommendationEngine />
        </section>
      </div>

      {/* Recent Requests */}
      <div className="section">
        <h2>Recent Requests</h2>
        {recentRequests.length > 0 ? (
          <div className="list-table">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map(req => (
                  <tr key={req.id}>
                    <td>{req.item_name}</td>
                    <td>{req.category}</td>
                    <td>{req.quantity}</td>
                    <td>
                      <span className={`status-badge status-${req.status}`}>
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">No requests yet. <Link to="create">Create one now</Link></p>
        )}
      </div>

      {/* Recent Orders */}
      <div className="section">
        <h2>Recent Orders</h2>
        {recentOrders.length > 0 ? (
          <div className="list-table">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr key={order.id}>
                    <td>{order.donation.item_name}</td>
                    <td>{order.donation.category}</td>
                    <td>
                      <span className={`status-badge status-${order.status}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">No orders yet. <Link to="browse">Browse donations</Link></p>
        )}
      </div>
    </div>
  );
}

export default ReceiverHome;


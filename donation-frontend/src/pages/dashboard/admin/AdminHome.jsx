import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";
import AdminAnalytics from "./AdminAnalytics";
import "./AdminHome.css";


function AdminHome() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeDonors: 0,
    activeReceivers: 0,
    pendingApprovals: 0,
    totalDeliveries: 0,
    completedDeliveries: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const usersRes = await api.get("users/admin/users/");
      const users = usersRes.data || [];

      const donationsRes = await api.get("donation/");
      const donations = donationsRes.data || [];

      const activeDonors = users.filter(
        (u) => u.role === "donor" && u.is_active
      ).length;

      const activeReceivers = users.filter(
        (u) => u.role === "receiver" && u.is_active
      ).length;

      const pendingDonations = donations.filter(
        (d) => d.status === "pending"
      ).length;

      setStats({
        totalUsers: users.length,
        activeDonors,
        activeReceivers,
        pendingApprovals: pendingDonations,
        totalDeliveries: donations.length,
        completedDeliveries: donations.filter(
          (d) => d.status === "delivered"
        ).length,
      });

      setRecentActivities(donations.slice(-5).reverse());
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-home">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-home">
      {/* HEADER */}
      <div className="header">
        <h1>Admin Dashboard</h1>
        <p className="subtitle">System Control & Monitoring</p>
      </div>

      {/* STATS GRID */}
      <div className="stats-grid">
        <div className="stat-card users">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <div className="stat-card donors">
          <div className="stat-icon">🎁</div>
          <div className="stat-content">
            <h3>{stats.activeDonors}</h3>
            <p>Active Donors</p>
          </div>
        </div>

        <div className="stat-card receivers">
          <div className="stat-icon">🙏</div>
          <div className="stat-content">
            <h3>{stats.activeReceivers}</h3>
            <p>Active Receivers</p>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.pendingApprovals}</h3>
            <p>Pending Approvals</p>
          </div>
        </div>

        <div className="stat-card deliveries">
          <div className="stat-icon">🚚</div>
          <div className="stat-content">
            <h3>{stats.totalDeliveries}</h3>
            <p>Total Deliveries</p>
          </div>
        </div>

        <div className="stat-card completed">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.completedDeliveries}</h3>
            <p>Completed</p>
          </div>
        </div>
      </div>

      {/* 🔍 ANALYTICS & INSIGHTS */}
      <section style={{ marginTop: "32px" }}>
        <AdminAnalytics />
      </section>

      {/* QUICK ACTIONS */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button
            className="action-btn btn-primary"
            onClick={() => navigate("users")}
          >
            👥 Manage Users
          </button>
          <button
            className="action-btn btn-warning"
            onClick={() => navigate("approvals")}
          >
            ✅ Review Approvals
          </button>
          <button
            className="action-btn btn-info"
            onClick={() => navigate("receiver-requests")}
          >
            📋 View Requests
          </button>
          <button
            className="action-btn btn-success"
            onClick={fetchDashboardData}
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>

      {/* RECENT ACTIVITIES */}
      <div className="section">
        <h2>Recent Activities</h2>
        {recentActivities.length > 0 ? (
          <div className="activity-list">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">📦</div>
                <div className="activity-content">
                  <p className="activity-title">{activity.item_name}</p>
                  <p className="activity-meta">
                    Quantity: {activity.quantity} | Category:{" "}
                    {activity.category}
                  </p>
                </div>
                <div className="activity-status">
                  <span className={`status-badge status-${activity.status}`}>
                    {activity.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">No recent activities</p>
        )}
      </div>

      {/* SYSTEM INFO */}
      <div className="section info-box">
        <h2>System Status</h2>
        <div className="info-grid">
          <div className="info-item">
            <h4>✅ Platform Health</h4>
            <p>All systems operational</p>
          </div>
          <div className="info-item">
            <h4>🔐 Security</h4>
            <p>SSL enabled, JWT authentication</p>
          </div>
          <div className="info-item">
            <h4>📊 Analytics</h4>
            <p>Real-time monitoring active</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminHome;

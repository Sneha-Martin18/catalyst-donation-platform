import { useEffect, useState } from "react";
import api from "../../api/api";

function AdminProfile({ profile, onEditClick }) {
  const [stats, setStats] = useState({
    total_users: 0,
    donors: 0,
    receivers: 0,
    volunteers: 0,
    total_donations: 0,
    total_requests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch admin dashboard stats
        const usersRes = await api.get("/users/all-users/");
        const donationsRes = await api.get("/donations/all-donations/");
        const requestsRes = await api.get("/receiver/all-requests/");

        const users = usersRes.data || [];
        const donors = users.filter((u) => u.role === "donor").length;
        const receivers = users.filter((u) => u.role === "receiver").length;
        const volunteers = users.filter((u) => u.role === "volunteer").length;

        setStats({
          total_users: users.length,
          donors: donors,
          receivers: receivers,
          volunteers: volunteers,
          total_donations: donationsRes.data?.length || 0,
          total_requests: requestsRes.data?.length || 0,
        });
      } catch (err) {
        console.error("Failed to load admin stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="role-profile admin-profile">
      <h2>Admin Control Center</h2>

      {/* System Statistics */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card users">
          <span className="stat-icon">👥</span>
          <p className="stat-number">{stats.total_users}</p>
          <p className="stat-label">Total Users</p>
          <div className="stat-breakdown">
            <small>👤 Receivers: {stats.receivers}</small>
            <small>🎁 Donors: {stats.donors}</small>
            <small>👥 Volunteers: {stats.volunteers}</small>
          </div>
        </div>

        <div className="admin-stat-card donations">
          <span className="stat-icon">📦</span>
          <p className="stat-number">{stats.total_donations}</p>
          <p className="stat-label">Total Donations</p>
        </div>

        <div className="admin-stat-card requests">
          <span className="stat-icon">📋</span>
          <p className="stat-number">{stats.total_requests}</p>
          <p className="stat-label">Total Requests</p>
        </div>

        <div className="admin-stat-card system">
          <span className="stat-icon">⚙️</span>
          <p className="stat-number">Active</p>
          <p className="stat-label">System Status</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="admin-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <div className="action-card">
            <span className="action-icon">👥</span>
            <p>Manage Users</p>
          </div>
          <div className="action-card">
            <span className="action-icon">✓</span>
            <p>Approve Donations</p>
          </div>
          <div className="action-card">
            <span className="action-icon">📊</span>
            <p>View Reports</p>
          </div>
          <div className="action-card">
            <span className="action-icon">⚙️</span>
            <p>System Settings</p>
          </div>
        </div>
      </div>

      {/* Admin Notes */}
      <div className="admin-notes">
        <h3>System Information</h3>
        <p>
          <strong>Role:</strong> Administrator
        </p>
        <p>
          <strong>Access Level:</strong> Full System Access
        </p>
        <p>
          <strong>Responsibilities:</strong> User management, donation approval,
          request verification, and system monitoring
        </p>
      </div>
    </div>
  );
}

export default AdminProfile;

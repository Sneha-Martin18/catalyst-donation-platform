import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../../api/api";
import "./DonorHome.css";

function DonorHome() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalDonations: 0,
    pendingDonations: 0,
    approvedDonations: 0,
    deliveredDonations: 0,
    totalItems: 0,
    averageRating: 0,
  });
  const [recentDonations, setRecentDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch donations
      const donationsRes = await api.get("donation/");
      const donations = donationsRes.data || [];

      // Fetch user profile for rating
      const userRes = await api.get("users/profile/");
      const userRating = userRes.data?.profile?.rating || 0;

      // Calculate stats
      const pending = donations.filter(d => d.status === "pending").length;
      const approved = donations.filter(d => d.status === "approved").length;
      const delivered = donations.filter(d => d.status === "delivered").length;
      const totalItems = donations.reduce((sum, d) => sum + (d.quantity || 0), 0);

      setStats({
        totalDonations: donations.length,
        pendingDonations: pending,
        approvedDonations: approved,
        deliveredDonations: delivered,
        totalItems,
        averageRating: userRating,
      });

      setRecentDonations(donations.slice(-3).reverse());

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="donor-home"><p>Loading dashboard...</p></div>;
  }

  return (
    <div className="donor-home">
      <div className="header">
        <h1>Donor Dashboard</h1>
        <p className="subtitle">Your Donation Impact</p>
      </div>

      {/* STATS GRID */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>{stats.totalDonations}</h3>
            <p>Total Donations</p>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.pendingDonations}</h3>
            <p>Pending</p>
          </div>
        </div>

        <div className="stat-card approved">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.approvedDonations}</h3>
            <p>Approved</p>
          </div>
        </div>

        <div className="stat-card delivered">
          <div className="stat-icon">🎉</div>
          <div className="stat-content">
            <h3>{stats.deliveredDonations}</h3>
            <p>Delivered</p>
          </div>
        </div>

        <div className="stat-card items">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.totalItems}</h3>
            <p>Items Donated</p>
          </div>
        </div>

        <div className="stat-card rating">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>{stats.averageRating.toFixed(1)}</h3>
            <p>Your Rating</p>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <Link to="donate" className="action-btn btn-primary">
            ➕ Create Donation
          </Link>
          <Link to="donations" className="action-btn btn-secondary">
            📦 My Donations
          </Link>
          <Link to="history" className="action-btn btn-info">
            📜 Donation History
          </Link>
          <button 
            className="action-btn btn-success"
            onClick={fetchDashboardData}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* RECENT DONATIONS */}
      <div className="section">
        <h2>Recent Donations</h2>
        {recentDonations.length > 0 ? (
          <div className="donations-list">
            {recentDonations.map(donation => (
              <div key={donation.id} className="donation-card">
                <div className="donation-header">
                  <h3>{donation.item_name}</h3>
                  <span className={`status-badge status-${donation.status}`}>
                    {donation.status.toUpperCase()}
                  </span>
                </div>
                <div className="donation-details">
                  <p><strong>Category:</strong> {donation.category}</p>
                  <p><strong>Quantity:</strong> {donation.quantity} items</p>
                  <p><strong>Condition:</strong> {donation.condition}</p>
                  <p><strong>Description:</strong> {donation.description || 'N/A'}</p>
                </div>
                <div className="donation-actions">
                  {donation.status === "pending" && (
                    <Link 
                      to={`/dashboard/donor/edit/${donation.id}`}
                      className="btn btn-edit"
                    >
                      ✏️ Edit
                    </Link>
                  )}
                  <button className="btn btn-view">View Details</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">No donations yet. <Link to="donate">Create your first donation</Link></p>
        )}
      </div>

      {/* IMPACT SECTION */}
      <div className="section impact-box">
        <h2>Your Impact</h2>
        <div className="impact-content">
          <div className="impact-item">
            <span className="impact-number">{stats.totalItems}</span>
            <span className="impact-label">Items Shared</span>
          </div>
          <div className="impact-item">
            <span className="impact-number">{stats.deliveredDonations}</span>
            <span className="impact-label">Lives Touched</span>
          </div>
          <div className="impact-item">
            <span className="impact-number">{stats.approvedDonations}</span>
            <span className="impact-label">Verified Donations</span>
          </div>
        </div>
        <p className="impact-message">
          🌟 Thank you for making a difference! Every donation helps someone in need.
        </p>
      </div>
    </div>
  );
}

export default DonorHome;
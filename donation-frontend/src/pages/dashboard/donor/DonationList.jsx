import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import StatusBadge from "../../../components/StatusBadge";
import DonationTimeline from "../../../components/DonationTimeline";
import api from "../../../api/api";
import "./DonationList.css";

function DonationList() {
  const navigate = useNavigate(); 
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const res = await api.get("/donation/");
        setDonations(res.data);
      } catch (error) {
        console.error("Failed to fetch donations");
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, []);

  // Filter donations
  const filteredDonations = donations.filter((donation) => {
    if (filter === "all") return true;
    if (filter === "pending") return donation.status === "pending";
    if (filter === "approved") return donation.status === "approved";
    if (filter === "delivered") return donation.status === "delivered";
    return true;
  });

  // Sort donations
  const sortedDonations = [...filteredDonations].sort((a, b) => {
    if (sortBy === "recent") {
      return new Date(b.created_at) - new Date(a.created_at);
    }
    if (sortBy === "oldest") {
      return new Date(a.created_at) - new Date(b.created_at);
    }
    if (sortBy === "quantity") {
      return b.quantity - a.quantity;
    }
    return 0;
  });

  // Calculate stats
  const stats = {
    total: donations.length,
    pending: donations.filter(d => d.status === "pending").length,
    approved: donations.filter(d => d.status === "approved").length,
    delivered: donations.filter(d => d.status === "delivered").length,
  };

  if (loading) {
    return (
      <div className="donation-list-page">
        <div className="loading-spinner">
          <p>📦 Loading your donations...</p>
        </div>
      </div>
    );
  }

  if (donations.length === 0) {
    return (
      <div className="donation-list-page">
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h2>No Donations Yet</h2>
          <p>Start sharing items with those in need</p>
          <Link to="/dashboard/donor/donate" className="btn-primary">
            Create Your First Donation
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="donation-list-page">
      <div className="page-header">
        <h1>My Donations</h1>
        <Link to="/dashboard/donor/donate" className="btn-add-donation">
          ➕ New Donation
        </Link>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Donations</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{stats.approved}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-box">
          <div className="stat-value">{stats.delivered}</div>
          <div className="stat-label">Delivered</div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="controls">
        <div className="filter-section">
          <p className="section-label">Filter by Status</p>
          <div className="filter-buttons">
            {["all", "pending", "approved", "delivered"].map((status) => (
              <button
                key={status}
                className={`filter-btn ${filter === status ? "active" : ""}`}
                onClick={() => setFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status !== "all" && (
                  <span className="count">
                    {status === "pending" && stats.pending}
                    {status === "approved" && stats.approved}
                    {status === "delivered" && stats.delivered}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="sort-section">
          <label htmlFor="sort-select">Sort By:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="quantity">Highest Quantity</option>
          </select>
        </div>
      </div>

      {/* Donations Grid */}
      <div className="donations-grid">
        {sortedDonations.map((donation) => (
          <div key={donation.id} className="donation-card">
            <div className="donation-header">
              <div className="item-info">
                <h3>{donation.item_name}</h3>
                <p className="category">{donation.category}</p>
              </div>
              <StatusBadge status={donation.status} />
            </div>

            <div className="donation-details">
              <div className="detail-item">
                <span className="label">Quantity:</span>
                <span className="value">{donation.quantity} unit(s)</span>
              </div>
              <div className="detail-item">
                <span className="label">Condition:</span>
                <span className="value">{donation.condition.replace(/_/g, " ")}</span>
              </div>
              {donation.description && (
                <div className="detail-item full">
                  <span className="label">Description:</span>
                  <p className="value">{donation.description}</p>
                </div>
              )}
            </div>

            <div className="donation-timeline">
              <DonationTimeline status={donation.status} />
            </div>

            <div className="donation-actions">
              {donation.status === "pending" ? (
                <>
                  <button
                    className="btn-edit"
                    onClick={() => navigate(`/dashboard/donor/edit/${donation.id}`)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="btn-cancel"
                    onClick={() => navigate(`/dashboard/donor/edit/${donation.id}`)}
                  >
                    🗑️ Cancel
                  </button>
                </>
              ) : (
                <span className="read-only">📌 Read-only</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {sortedDonations.length === 0 && (
        <div className="no-results">
          <p>No donations found with the selected filter.</p>
        </div>
      )}
    </div>
  );
}

export default DonationList;

import { useEffect, useState } from "react";
import StatusBadge from "../../../components/StatusBadge";
import DonationTimeline from "../../../components/DonationTimeline";
import api from "../../../api/api";
import "./DonorHistory.css";

function History() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get("/donation/history/");
        setDonations(res.data);
      } catch (err) {
        setError("Failed to load donation history");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Filter donations
  const filteredDonations = selectedCategory === "all" 
    ? donations 
    : donations.filter(d => d.category === selectedCategory);

  // Sort donations
  const sortedDonations = [...filteredDonations].sort((a, b) => {
    if (sortBy === "recent") {
      return new Date(b.updated_at) - new Date(a.updated_at);
    }
    if (sortBy === "oldest") {
      return new Date(a.updated_at) - new Date(b.updated_at);
    }
    if (sortBy === "quantity") {
      return b.quantity - a.quantity;
    }
    return 0;
  });

  // Get unique categories
  const categories = ["all", ...new Set(donations.map(d => d.category))];

  // Calculate stats
  const stats = {
    total: donations.length,
    totalQuantity: donations.reduce((sum, d) => sum + d.quantity, 0),
    delivered: donations.filter(d => d.status === "delivered").length,
  };

  if (loading) {
    return (
      <div className="history-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>📜 Loading your donation history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-page">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (donations.length === 0) {
    return (
      <div className="history-page">
        <div className="empty-history">
          <div className="empty-icon">📭</div>
          <h2>No Donation History</h2>
          <p>Your completed donations will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="history-header">
        <h1>Donation History</h1>
        <p className="subtitle">Track all your past donations</p>
      </div>

      {/* Impact Summary */}
      <div className="impact-summary">
        <div className="impact-card">
          <div className="impact-icon">📦</div>
          <div className="impact-content">
            <div className="impact-value">{stats.total}</div>
            <div className="impact-label">Total Donations</div>
          </div>
        </div>
        <div className="impact-card">
          <div className="impact-icon">✅</div>
          <div className="impact-content">
            <div className="impact-value">{stats.delivered}</div>
            <div className="impact-label">Delivered Successfully</div>
          </div>
        </div>
        <div className="impact-card">
          <div className="impact-icon">📊</div>
          <div className="impact-content">
            <div className="impact-value">{stats.totalQuantity}</div>
            <div className="impact-label">Items Shared</div>
          </div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="history-controls">
        <div className="category-filter">
          <label>Filter by Category:</label>
          <div className="filter-chips">
            {categories.map((category) => (
              <button
                key={category}
                className={`chip ${selectedCategory === category ? "active" : ""}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category === "all" ? "All Categories" : category}
              </button>
            ))}
          </div>
        </div>

        <div className="sort-controls">
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

      {/* Timeline View */}
      <div className="history-timeline">
        {sortedDonations.map((donation, index) => (
          <div key={donation.id} className="timeline-item">
            <div className="timeline-marker"></div>
            <div className="timeline-content">
              <div className="donation-header">
                <div>
                  <h3>{donation.item_name}</h3>
                  <p className="donation-meta">
                    {donation.category} • Qty: {donation.quantity}
                  </p>
                </div>
                <StatusBadge status={donation.status} />
              </div>

              <div className="donation-info">
                <div className="info-row">
                  <span className="label">Condition:</span>
                  <span className="value">{donation.condition.replace(/_/g, " ")}</span>
                </div>
                {donation.description && (
                  <div className="info-row">
                    <span className="label">Description:</span>
                    <span className="value">{donation.description}</span>
                  </div>
                )}
                <div className="info-row">
                  <span className="label">Created:</span>
                  <span className="value">
                    {new Date(donation.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              <div className="donation-timeline-box">
                <DonationTimeline status={donation.status} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {sortedDonations.length === 0 && (
        <div className="no-matching">
          <p>No donations found in this category.</p>
        </div>
      )}
    </div>
  );
}

export default History;

import { useEffect, useState } from "react";
import { useNavigate, Link, useOutletContext } from "react-router-dom";
import StatusBadge from "../../../components/StatusBadge";
import DonationTimeline from "../../../components/DonationTimeline";
import api from "../../../api/api";
import BackButton from "../../../components/BackButton";
import Pagination from "../../../components/Pagination";
import "./DonationList.css";

function DonationList() {
  const navigate = useNavigate();
  const { isVerified, loading: userLoading, setIsModalOpen } = useOutletContext();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    assigned: 0,
    delivered: 0,
  });

  const handleNewDonationClick = (e) => {
    // If user profile is still loading, wait or allow
    if (userLoading) return;

    if (!isVerified) {
      e.preventDefault();
      setIsModalOpen(true);
    }
  };

  const fetchDonations = async (currentPage = 1) => {
    setLoading(true);
    try {
      const res = await api.get(`/donation/?page=${currentPage}`);
      if (res.data.results) {
        setDonations(res.data.results);
        setTotalCount(res.data.count);
        if (res.data.stats) setStats(res.data.stats);
      } else {
        // Handle non-paginated or error state
        const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setDonations(data);
        setTotalCount(res.data.count || data.length);
        if (res.data.stats) {
          setStats(res.data.stats);
        } else {
          setStats({
            total: data.length,
            pending: data.filter(d => d.status === "pending").length,
            verified: data.filter(d => d.status === "verified").length,
            assigned: data.filter(d => d.status === "assigned").length,
            delivered: data.filter(d => d.status === "delivered").length,
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch donations", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations(page);
  }, [page]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ===================== FILTER ===================== */
  const filteredDonations = donations.filter((donation) => {
    if (filter === "all") return true;
    if (filter === "pending") return donation.status === "pending";
    if (filter === "verified") return donation.status === "verified";
    if (filter === "assigned") return donation.status === "assigned";
    if (filter === "delivered") return donation.status === "delivered";
    return true;
  });

  /* ===================== SORT ===================== */
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

  /* ===================== STATS ===================== */
  // Now using state 'stats' populated from backend

  if (loading) {
    return (
      <div className="donation-list-page">
        <div className="loading-spinner">
          <p>📦 Loading your donations...</p>
        </div>
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="donation-list-page">
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h2>Your Donation Journey Starts Here</h2>
          <p>You haven't created any donations yet. Make a difference by sharing items with those who need them most.</p>
          <Link to="/dashboard/user/donate" className="btn-primary" onClick={handleNewDonationClick}>
            Create Your First Donation
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="donation-list-page">
      <BackButton />
      <div className="page-header">
        <h1>My Donations</h1>
        <Link to="/dashboard/user/donate" className="btn-add-donation" onClick={handleNewDonationClick}>
          ➕ New Donation
        </Link>
      </div>

      {/* ===================== STATS ===================== */}
      {/* ===================== STATS ===================== */}
      <div className="stats-row">
        <div className="stat-box">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total</div>
          </div>
        </div>
        <div className="stat-box pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
        <div className="stat-box verified">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-value">{stats.verified}</div>
            <div className="stat-label">Verified</div>
          </div>
        </div>
        <div className="stat-box assigned">
          <div className="stat-icon">🤝</div>
          <div className="stat-info">
            <div className="stat-value">{stats.assigned}</div>
            <div className="stat-label">Assigned</div>
          </div>
        </div>
        <div className="stat-box delivered">
          <div className="stat-icon">🚚</div>
          <div className="stat-info">
            <div className="stat-value">{stats.delivered}</div>
            <div className="stat-label">Delivered</div>
          </div>
        </div>
      </div>

      {/* ===================== CONTROLS ===================== */}
      {/* ===================== CONTROLS ===================== */}
      <div className="controls-toolbar">
        <div className="filter-group">
          {["all", "pending", "verified", "assigned", "delivered"].map((status) => (
            <button
              key={status}
              className={`filter-tab ${filter === status ? "active" : ""}`}
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        <div className="sort-group">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-dropdown"
          >
            <option value="recent">📅 Recent</option>
            <option value="oldest">🕰️ Oldest</option>
            <option value="quantity">📦 Quantity</option>
          </select>
        </div>
      </div>

      {/* ===================== GRID ===================== */}
      <div className="donations-grid">
        {sortedDonations.map((donation) => (
          <div key={donation.id} className="donation-card">

            {/* 1. Image Area with Status & Hover Overlay */}
            <div className="card-image-container">
              <div className="status-pill" data-status={donation.status}>
                {donation.status}
              </div>

              {donation.images?.length > 0 ? (
                <img src={donation.images[0].image_url} alt={donation.item_name} className="card-img" />
              ) : (
                <div className="card-placeholder">
                  <span className="placeholder-icon">📷</span>
                  <span className="placeholder-text">No Image</span>
                </div>
              )}

              {/* Hover Overlay - "Just Learn More" */}
              <div className="card-hover-overlay">
                <Link to={`/dashboard/user/details-donation/${donation.id}`} className="btn-overlay-learn">
                  View Details
                </Link>
              </div>
            </div>

            {/* 2. Content Body */}
            <div className="card-content">

              {/* Title & Category */}
              <div className="card-header-row">
                <h3 className="card-title">{donation.item_name}</h3>
                <span className="category-pill">{donation.category}</span>
              </div>

              {/* Data Grid */}
              <div className="card-data-grid">
                <div className="data-col">
                  <span className="data-label">QUANTITY</span>
                  <span className="data-value">{donation.quantity}</span>
                </div>
                <div className="data-col">
                  <span className="data-label">CONDITION</span>
                  <span className="data-value">{donation.condition?.replace(/_/g, " ")}</span>
                </div>
              </div>

              {/* Timeline */}
              <div className="card-timeline-section">
                <DonationTimeline status={donation.status} compact={true} />
              </div>

              {/* Assigned Info Box (if applicable) */}
              {donation.status === "assigned" && donation.order && (
                <div className="receiver-info-box" style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", marginTop: "10px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                    <span style={{ fontSize: "0.8em", fontWeight: "600", color: "#64748b" }}>ASSIGNED TO</span>
                    <span style={{
                      fontSize: "0.75em",
                      fontWeight: "700",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      backgroundColor: donation.order.delivery_type === 'self_pickup' ? "#fef3c7" : "#e0e7ff",
                      color: donation.order.delivery_type === 'self_pickup' ? "#92400e" : "#4338ca",
                    }}>
                      {donation.order.delivery_type === 'self_pickup' ? '🏠 SELF PICKUP' : '🚲 VOLUNTEER'}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div className="receiver-icon" style={{ fontSize: "20px" }}>👤</div>
                    <div className="receiver-text">
                      <strong style={{ color: "#1e293b" }}>{donation.order.receiver_name || "Receiver"}</strong> requested this.
                      <div className="receiver-sub" style={{ fontSize: "0.8em", color: "#64748b" }}>Ordered on {new Date(donation.order.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                  {donation.order.delivery_type === 'self_pickup' && (
                    <div style={{ marginTop: "10px", fontSize: "0.85em", color: "#92400e", backgroundColor: "#fffbeb", padding: "8px", borderRadius: "4px", border: "1px solid #fef3c7" }}>
                      📢 Please coordinate with the receiver for pickup.
                    </div>
                  )}
                </div>
              )}

              {/* Divider */}
              <div className="card-divider"></div>

              {/* Footer */}
              <div className="card-footer-row">
                <div className="footer-left">
                  {donation.status === "pending" ? (
                    <div className="status-text editable">
                      ✏️ Editable
                    </div>
                  ) : (
                    <div className="status-text locked">
                      🔒 Read-only
                    </div>
                  )}
                </div>
                <div className="footer-right">
                  <Link to={`/dashboard/user/details-donation/${donation.id}`} className="link-details">
                    View Details →
                  </Link>
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>

      <Pagination
        currentPage={page}
        totalPages={Math.ceil(totalCount / 10)}
        onPageChange={handlePageChange}
      />

      {
        sortedDonations.length === 0 && (
          <div className="no-results">
            <p>No donations found.</p>
          </div>
        )
      }
    </div >
  );
}

export default DonationList;

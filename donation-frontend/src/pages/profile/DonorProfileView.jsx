import { useEffect, useState } from "react";
import api from "../../api/api";
import ItemCard from "./ItemCard";

function DonorProfileView({ userId }) {
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    delivered: 0,
    pending: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const res = await api.get(`/donations/user/${userId}/donations/`);
        const verified = res.data?.filter((d) => d.status === "verified");
        const delivered = res.data?.filter((d) => d.status === "delivered");
        const pending = res.data?.filter((d) => d.status === "pending");

        setDonations(res.data || []);
        setStats({
          total: res.data?.length || 0,
          verified: verified?.length || 0,
          delivered: delivered?.length || 0,
          pending: pending?.length || 0,
        });
      } catch (err) {
        console.error("Failed to load donations", err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchDonations();
    }
  }, [userId]);

  const filteredDonations = filter === "all" 
    ? donations 
    : donations.filter(d => d.status === filter);

  return (
    <div className="role-profile donor-profile-view">
      <div className="profile-view-header">
        <h2>🎁 Donation History</h2>
        <p className="profile-view-subtitle">View all donations made by this user</p>
      </div>

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card total">
          <span className="stat-icon">📦</span>
          <p className="stat-number">{stats.total}</p>
          <p className="stat-label">Total Donations</p>
        </div>

        <div className="stat-card pending">
          <span className="stat-icon">⏳</span>
          <p className="stat-number">{stats.pending}</p>
          <p className="stat-label">Pending</p>
        </div>

        <div className="stat-card verified">
          <span className="stat-icon">✓</span>
          <p className="stat-number">{stats.verified}</p>
          <p className="stat-label">Verified</p>
        </div>

        <div className="stat-card delivered">
          <span className="stat-icon">🚚</span>
          <p className="stat-number">{stats.delivered}</p>
          <p className="stat-label">Delivered</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All ({stats.total})
        </button>
        <button
          className={`filter-tab ${filter === "pending" ? "active" : ""}`}
          onClick={() => setFilter("pending")}
        >
          Pending ({stats.pending})
        </button>
        <button
          className={`filter-tab ${filter === "verified" ? "active" : ""}`}
          onClick={() => setFilter("verified")}
        >
          Verified ({stats.verified})
        </button>
        <button
          className={`filter-tab ${filter === "delivered" ? "active" : ""}`}
          onClick={() => setFilter("delivered")}
        >
          Delivered ({stats.delivered})
        </button>
      </div>

      {/* Donations List */}
      <div className="items-section">
        {loading ? (
          <div className="loading-container">
            <p className="loading-text">📦 Loading donations...</p>
          </div>
        ) : filteredDonations.length === 0 ? (
          <div className="empty-container">
            <p className="empty-icon">📭</p>
            <p className="empty-text">No donations found</p>
          </div>
        ) : (
          <div className="items-list">
            {filteredDonations.map((donation) => (
              <ItemCard key={donation.id} item={donation} type="donation" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DonorProfileView;

import { useEffect, useState } from "react";
import api from "../../api/api";
import ItemCard from "./ItemCard";

function ReceiverProfileView({ userId }) {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({
    requests: 0,
    pending: 0,
    approved: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const requestsRes = await api.get(`/receiver/user/${userId}/requests/`);
        const pending = requestsRes.data?.filter((r) => r.status === "pending");
        const approved = requestsRes.data?.filter((r) => r.status === "approved");
        const completed = requestsRes.data?.filter((r) => r.status === "completed");

        setRequests(requestsRes.data || []);
        setStats({
          requests: requestsRes.data?.length || 0,
          pending: pending?.length || 0,
          approved: approved?.length || 0,
          completed: completed?.length || 0,
        });
      } catch (err) {
        console.error("Failed to load receiver data", err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId]);

  const filteredRequests = filter === "all"
    ? requests
    : requests.filter(r => r.status === filter);

  return (
    <div className="role-profile receiver-profile-view">
      <div className="profile-view-header">
        <h2>🙏 Request History</h2>
        <p className="profile-view-subtitle">View all item requests made by this user</p>
      </div>

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card requests">
          <span className="stat-icon">📋</span>
          <p className="stat-number">{stats.requests}</p>
          <p className="stat-label">Total Requests</p>
        </div>

        <div className="stat-card pending">
          <span className="stat-icon">⏳</span>
          <p className="stat-number">{stats.pending}</p>
          <p className="stat-label">Pending</p>
        </div>

        <div className="stat-card approved">
          <span className="stat-icon">✓</span>
          <p className="stat-number">{stats.approved}</p>
          <p className="stat-label">Approved</p>
        </div>

        <div className="stat-card completed">
          <span className="stat-icon">🎉</span>
          <p className="stat-number">{stats.completed}</p>
          <p className="stat-label">Completed</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All ({stats.requests})
        </button>
        <button
          className={`filter-tab ${filter === "pending" ? "active" : ""}`}
          onClick={() => setFilter("pending")}
        >
          Pending ({stats.pending})
        </button>
        <button
          className={`filter-tab ${filter === "approved" ? "active" : ""}`}
          onClick={() => setFilter("approved")}
        >
          Approved ({stats.approved})
        </button>
        <button
          className={`filter-tab ${filter === "completed" ? "active" : ""}`}
          onClick={() => setFilter("completed")}
        >
          Completed ({stats.completed})
        </button>
      </div>

      {/* Item Requests */}
      <div className="items-section">
        {loading ? (
          <div className="loading-container">
            <p className="loading-text">📋 Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="empty-container">
            <p className="empty-icon">📭</p>
            <p className="empty-text">No requests found</p>
          </div>
        ) : (
          <div className="items-list">
            {filteredRequests.map((request) => (
              <ItemCard key={request.id} item={request} type="request" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReceiverProfileView;

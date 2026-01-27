import { useEffect, useState } from "react";
import api from "../../../api/api";
import "./ReceiverRequests.css";

function ReceiverRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [confirmAction, setConfirmAction] = useState(null);

  const fetchRequests = async () => {
    try {
      const res = await api.get("/receiver/staff/item-requests/");
      setRequests(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const approveRequest = async (id) => {
    try {
      await api.patch(`/receiver/staff/item-requests/${id}/approve/`);
      fetchRequests();
      setConfirmAction(null);
    } catch (err) {
      console.error(err);
      alert("Action failed");
    }
  };

  const rejectRequest = async (id) => {
    try {
      await api.patch(`/receiver/staff/item-requests/${id}/reject/`);
      fetchRequests();
      setConfirmAction(null);
    } catch (err) {
      console.error(err);
      alert("Action failed");
    }
  };

  // Filter requests
  const filteredRequests = requests.filter(r => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  // Sort requests
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (sortBy === "recent") {
      return new Date(b.created_at) - new Date(a.created_at);
    }
    if (sortBy === "oldest") {
      return new Date(a.created_at) - new Date(b.created_at);
    }
    return 0;
  });

  // Calculate stats
  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    rejected: requests.filter(r => r.status === "rejected").length,
  };

  if (loading) {
    return (
      <div className="receiver-requests-page">
        <div className="loading-spinner">
          <p>⏳ Loading receiver requests...</p>
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="receiver-requests-page">
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h2>No Receiver Requests</h2>
          <p>All receiver requests will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="receiver-requests-page">
      <div className="page-header">
        <h1>Receiver Requests</h1>
        <p className="subtitle">Manage item requests from receivers</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Requests</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending Review</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.approved}</div>
            <div className="stat-label">Approved</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <div className="stat-value">{stats.rejected}</div>
            <div className="stat-label">Rejected</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls">
        <div className="filter-section">
          <label>Filter Status:</label>
          <div className="filter-buttons">
            {["all", "pending", "approved", "rejected"].map(status => (
              <button
                key={status}
                className={`filter-btn ${filter === status ? "active" : ""}`}
                onClick={() => setFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status !== "all" && (
                  <span className="filter-count">
                    {status === "pending" && stats.pending}
                    {status === "approved" && stats.approved}
                    {status === "rejected" && stats.rejected}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="sort-section">
          <label htmlFor="sort">Sort By:</label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Requests Grid */}
      <div className="requests-grid">
        {sortedRequests.map(request => (
          <div key={request.id} className={`request-card status-${request.status}`}>
            <div className="card-header">
              <div>
                <h3>{request.item_name || request.item_category || "Item Request"}</h3>
                <p className="requester">
                  👤 {request.receiver_user?.username || "Unknown User"}
                </p>
              </div>
              <span className={`status-badge ${request.status}`}>
                {request.status === "pending" ? "⏳" : request.status === "approved" ? "✅" : "❌"}
                {" " + request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </span>
            </div>

            <div className="card-content">
              {request.item_category && (
                <p><strong>Category:</strong> {request.item_category}</p>
              )}
              {request.quantity && (
                <p><strong>Quantity:</strong> {request.quantity}</p>
              )}
              {request.item_description && (
                <p><strong>Description:</strong> {request.item_description}</p>
              )}
              {request.condition && (
                <p><strong>Required Condition:</strong> {request.condition.replace(/_/g, " ")}</p>
              )}
              <p className="request-date">
                🕐 Requested on {new Date(request.created_at).toLocaleDateString("en-IN")}
              </p>
            </div>

            {request.status === "pending" && (
              <div className="card-actions">
                <button
                  className="btn-approve"
                  onClick={() => setConfirmAction({ type: "approve", id: request.id, name: request.item_name })}
                >
                  ✅ Approve
                </button>
                <button
                  className="btn-reject"
                  onClick={() => setConfirmAction({ type: "reject", id: request.id, name: request.item_name })}
                >
                  ❌ Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {sortedRequests.length === 0 && (
        <div className="no-results">
          <p>No requests found with the selected filter.</p>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <h3>Confirm Action</h3>
            <p>
              Are you sure you want to {confirmAction.type} the request for <strong>{confirmAction.name}</strong>?
            </p>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </button>
              <button
                className={`btn-confirm ${confirmAction.type}`}
                onClick={() => {
                  if (confirmAction.type === "approve") {
                    approveRequest(confirmAction.id);
                  } else {
                    rejectRequest(confirmAction.id);
                  }
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReceiverRequests;

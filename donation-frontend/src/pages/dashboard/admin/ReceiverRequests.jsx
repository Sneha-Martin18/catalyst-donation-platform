import { useEffect, useState } from "react";
import api from "../../../api/api";
import BackButton from "../../../components/BackButton";
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

  const deleteRequest = async (id) => {
    try {
      await api.delete(`/receiver/staff/item-requests/${id}/delete/`);
      fetchRequests();
      setConfirmAction(null);
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  const updateDeliveryPreference = async (id, newPref) => {
    try {
      await api.patch(`/receiver/staff/item-requests/${id}/delivery-preference/`, {
        delivery_preference: newPref
      });
      fetchRequests();
    } catch (err) {
      console.error(err);
      alert("Update failed");
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
      <BackButton />
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
              {request.category && (
                <p><strong>Category:</strong> {request.category}</p>
              )}
              {request.quantity && (
                <p><strong>Quantity:</strong> {request.quantity}</p>
              )}
              {request.description && (
                <p><strong>Description:</strong> {request.description}</p>
              )}
              {request.condition && (
                <p><strong>Required Condition:</strong> {request.condition.replace(/_/g, " ")}</p>
              )}

              <div className="delivery-pref-section" style={{ marginTop: '10px', padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 'bold' }}>📍 Delivery Preference:</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className={`pref-toggle-btn ${request.delivery_preference === 'self_pickup' ? 'active' : ''}`}
                    onClick={() => updateDeliveryPreference(request.id, 'self_pickup')}
                    style={{
                      flex: 1, padding: '6px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #ddd',
                      background: request.delivery_preference === 'self_pickup' ? '#b0c924' : 'white',
                      color: request.delivery_preference === 'self_pickup' ? 'white' : '#666',
                      cursor: 'pointer', fontWeight: '600'
                    }}
                  >
                    🏠 Self Pickup
                  </button>
                  <button
                    className={`pref-toggle-btn ${request.delivery_preference === 'volunteer' ? 'active' : ''}`}
                    onClick={() => updateDeliveryPreference(request.id, 'volunteer')}
                    style={{
                      flex: 1, padding: '6px', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid #ddd',
                      background: request.delivery_preference === 'volunteer' ? '#b0c924' : 'white',
                      color: request.delivery_preference === 'volunteer' ? 'white' : '#666',
                      cursor: 'pointer', fontWeight: '600'
                    }}
                  >
                    🚲 Volunteer
                  </button>
                </div>
              </div>

              <p className="request-date">
                🕐 Requested on {new Date(request.created_at).toLocaleDateString("en-IN")}
              </p>
            </div>

            <div className="card-actions">
              {request.status === "pending" && (
                <>
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
                </>
              )}
              <button
                className="btn-delete-request"
                style={{ marginLeft: 'auto', background: 'none', border: '1px solid #ff416c', color: '#ff416c', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                onClick={() => setConfirmAction({ type: "delete", id: request.id, name: request.item_name })}
                title="Delete Request"
              >
                🗑️ Delete
              </button>
            </div>
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
                  } else if (confirmAction.type === "reject") {
                    rejectRequest(confirmAction.id);
                  } else if (confirmAction.type === "delete") {
                    deleteRequest(confirmAction.id);
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

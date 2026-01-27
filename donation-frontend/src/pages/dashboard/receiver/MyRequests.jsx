import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../../api/api";
import "./MyRequests.css";

function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("receiver/requests/");
      setRequests(response.data);
    } catch (err) {
      console.error("Failed to fetch requests:", err);
      setError("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests =
    filterStatus === "all"
      ? requests
      : requests.filter((req) => req.status === filterStatus);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "status-pending";
      case "approved":
        return "status-approved";
      case "rejected":
        return "status-rejected";
      case "completed":
        return "status-completed";
      default:
        return "";
    }
  };

  const getConditionLabel = (condition) => {
    const labels = {
      new_unused: "New (Unused)",
      like_new: "Like New",
      gently_used: "Gently Used",
      used_functional: "Used but Functional",
      refurbished: "Refurbished",
    };
    return labels[condition] || condition;
  };

  if (loading) {
    return (
      <div className="my-requests">
        <h1>My Requests</h1>
        <p className="loading">Loading requests...</p>
      </div>
    );
  }

  return (
    <div className="my-requests">
      <div className="requests-header">
        <h1>My Item Requests</h1>
        <Link to="../create" className="btn-new-request">
          + Create New Request
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* FILTERS */}
      <div className="filters">
        <h3>Filter by Status</h3>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterStatus === "all" ? "active" : ""}`}
            onClick={() => setFilterStatus("all")}
          >
            All ({requests.length})
          </button>
          <button
            className={`filter-btn ${filterStatus === "pending" ? "active" : ""}`}
            onClick={() => setFilterStatus("pending")}
          >
            Pending ({requests.filter((r) => r.status === "pending").length})
          </button>
          <button
            className={`filter-btn ${filterStatus === "approved" ? "active" : ""}`}
            onClick={() => setFilterStatus("approved")}
          >
            Approved ({requests.filter((r) => r.status === "approved").length})
          </button>
          <button
            className={`filter-btn ${filterStatus === "rejected" ? "active" : ""}`}
            onClick={() => setFilterStatus("rejected")}
          >
            Rejected ({requests.filter((r) => r.status === "rejected").length})
          </button>
        </div>
      </div>

      {/* REQUESTS LIST */}
      {filteredRequests.length > 0 ? (
        <div className="requests-grid">
          {filteredRequests.map((request) => (
            <div key={request.id} className="request-card">
              <div className="card-header">
                <h3>{request.item_name}</h3>
                <span className={`status-badge ${getStatusColor(request.status)}`}>
                  {request.status}
                </span>
              </div>

              <div className="card-body">
                <div className="detail-row">
                  <label>Category:</label>
                  <span>{request.category}</span>
                </div>

                <div className="detail-row">
                  <label>Quantity:</label>
                  <span>{request.quantity}</span>
                </div>

                <div className="detail-row">
                  <label>Condition:</label>
                  <span>{getConditionLabel(request.condition)}</span>
                </div>

                {request.used_duration_months && (
                  <div className="detail-row">
                    <label>Duration of Use:</label>
                    <span>{request.used_duration_months} months</span>
                  </div>
                )}

                {request.description && (
                  <div className="detail-row full-width">
                    <label>Description:</label>
                    <p className="description">{request.description}</p>
                  </div>
                )}

                {request.images_required && (
                  <div className="detail-row">
                    <label>Images Required:</label>
                    <span className="badge-info">📸 Yes</span>
                  </div>
                )}

                <div className="detail-row full-width dates">
                  <small>
                    Created: {new Date(request.created_at).toLocaleDateString()}
                  </small>
                  {request.updated_at !== request.created_at && (
                    <small>
                      Updated: {new Date(request.updated_at).toLocaleDateString()}
                    </small>
                  )}
                </div>
              </div>

              <div className="card-footer">
                {request.status === "approved" && (
                  <Link
                    to="../../browse-donations"
                    className="btn btn-primary"
                  >
                    Browse Matching Donations
                  </Link>
                )}
                {request.status === "pending" && (
                  <p className="status-info">
                    ⏳ Awaiting approval by our team...
                  </p>
                )}
                {request.status === "rejected" && (
                  <p className="status-info error">
                    ❌ Request was rejected. Try creating a new one.
                  </p>
                )}
                {request.status === "completed" && (
                  <p className="status-info success">
                    ✅ Request fulfilled!
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h2>No requests found</h2>
          {filterStatus !== "all" ? (
            <p>No requests with "{filterStatus}" status</p>
          ) : (
            <p>You haven't created any item requests yet.</p>
          )}
          <Link to="../create" className="btn btn-primary">
            Create Your First Request
          </Link>
        </div>
      )}
    </div>
  );
}

export default MyRequests;

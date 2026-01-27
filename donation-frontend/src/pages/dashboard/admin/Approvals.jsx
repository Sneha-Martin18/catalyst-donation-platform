import { useEffect, useState } from "react";
import api from "../../../api/api";
import "./Approvals.css";

function Approvals() {
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("donations");
  const [confirmAction, setConfirmAction] = useState(null);

  const fetchAllApprovals = async () => {
    try {
      const [donationRes, requestRes] = await Promise.all([
        api.get("/donation/admin/approvals/"),
        api.get("/receiver/staff/item-requests/"),
      ]);

      setDonations(donationRes.data);
      setRequests(requestRes.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllApprovals();
  }, []);

  const verifyDonation = async (id) => {
    try {
      await api.patch(`/donation/admin/verify/${id}/`);
      fetchAllApprovals();
      setConfirmAction(null);
    } catch (err) {
      console.error(err);
      alert("Verify failed");
    }
  };

  const assignDonation = async (id) => {
    try {
      await api.patch(`/donation/admin/assign/${id}/`);
      fetchAllApprovals();
      setConfirmAction(null);
    } catch (err) {
      console.error(err);
      alert("Assign failed");
    }
  };

  const approveRequest = async (id) => {
    try {
      await api.patch(`/receiver/staff/item-requests/${id}/approve/`);
      fetchAllApprovals();
      setConfirmAction(null);
    } catch (err) {
      console.error(err);
      alert("Approve failed");
    }
  };

  const rejectRequest = async (id) => {
    try {
      await api.patch(`/receiver/staff/item-requests/${id}/reject/`);
      fetchAllApprovals();
      setConfirmAction(null);
    } catch (err) {
      console.error(err);
      alert("Reject failed");
    }
  };

  // Calculate stats
  const stats = {
    pendingDonations: donations.filter(d => d.status === "pending").length,
    verifiedDonations: donations.filter(d => d.status === "verified").length,
    assignedDonations: donations.filter(d => d.status === "assigned").length,
    totalDonations: donations.length,
    pendingRequests: requests.filter(r => r.status === "pending").length,
    approvedRequests: requests.filter(r => r.status === "approved").length,
    rejectedRequests: requests.filter(r => r.status === "rejected").length,
    totalRequests: requests.length,
  };

  if (loading) {
    return (
      <div className="approvals-page">
        <div className="loading-spinner">
          <p>⏳ Loading approvals...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="approvals-page">
        <div className="error-alert">
          <p>❌ {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="approvals-page">
      <div className="page-header">
        <h1>Admin Approvals</h1>
        <p className="subtitle">Manage donation and request approvals</p>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-item">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalDonations}</div>
            <div className="stat-label">Total Donations</div>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <div className="stat-value">{stats.pendingDonations}</div>
            <div className="stat-label">Pending Review</div>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-value">{stats.verifiedDonations}</div>
            <div className="stat-label">Verified</div>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">📍</div>
          <div className="stat-info">
            <div className="stat-value">{stats.assignedDonations}</div>
            <div className="stat-label">Assigned</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === "donations" ? "active" : ""}`}
          onClick={() => setActiveTab("donations")}
        >
          📦 Donation Approvals
        </button>
        <button
          className={`tab-btn ${activeTab === "requests" ? "active" : ""}`}
          onClick={() => setActiveTab("requests")}
        >
          📋 Request Approvals
        </button>
      </div>

      {/* Donations Tab */}
      {activeTab === "donations" && (
        <div className="tab-content">
          {/* Pending Donations */}
          <div className="section">
            <div className="section-header">
              <h2>⏳ Pending Donations</h2>
              <span className="count-badge">{stats.pendingDonations}</span>
            </div>
            {stats.pendingDonations === 0 ? (
              <div className="empty-section">No pending donations</div>
            ) : (
              <div className="cards-grid">
                {donations.filter(d => d.status === "pending").map(d => (
                  <div key={d.id} className="approval-card pending">
                    <div className="card-header">
                      <h3>{d.item_name}</h3>
                      <span className="status-badge pending">Pending</span>
                    </div>
                    <div className="card-details">
                      <p><strong>Quantity:</strong> {d.quantity}</p>
                      <p><strong>Category:</strong> {d.category}</p>
                      <p><strong>Condition:</strong> {d.condition.replace(/_/g, " ")}</p>
                      {d.description && <p><strong>Description:</strong> {d.description}</p>}
                    </div>
                    <div className="card-actions">
                      <button
                        className="btn-approve"
                        onClick={() => setConfirmAction({ type: "verify", id: d.id, item: d.item_name })}
                      >
                        ✅ Verify
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Verified Donations */}
          <div className="section">
            <div className="section-header">
              <h2>✅ Verified Donations</h2>
              <span className="count-badge">{stats.verifiedDonations}</span>
            </div>
            {stats.verifiedDonations === 0 ? (
              <div className="empty-section">No verified donations</div>
            ) : (
              <div className="cards-grid">
                {donations.filter(d => d.status === "verified").map(d => (
                  <div key={d.id} className="approval-card verified">
                    <div className="card-header">
                      <h3>{d.item_name}</h3>
                      <span className="status-badge verified">Verified</span>
                    </div>
                    <div className="card-details">
                      <p><strong>Quantity:</strong> {d.quantity}</p>
                      <p><strong>Category:</strong> {d.category}</p>
                      <p><strong>Condition:</strong> {d.condition.replace(/_/g, " ")}</p>
                      {d.description && <p><strong>Description:</strong> {d.description}</p>}
                    </div>
                    <div className="card-actions">
                      <button
                        className="btn-assign"
                        onClick={() => setConfirmAction({ type: "assign", id: d.id, item: d.item_name })}
                      >
                        📍 Assign
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assigned Donations */}
          <div className="section">
            <div className="section-header">
              <h2>📍 Assigned Donations</h2>
              <span className="count-badge">{stats.assignedDonations}</span>
            </div>
            {stats.assignedDonations === 0 ? (
              <div className="empty-section">No assigned donations</div>
            ) : (
              <div className="cards-grid">
                {donations.filter(d => d.status === "assigned").map(d => (
                  <div key={d.id} className="approval-card assigned">
                    <div className="card-header">
                      <h3>{d.item_name}</h3>
                      <span className="status-badge assigned">Assigned</span>
                    </div>
                    <div className="card-details">
                      <p><strong>Quantity:</strong> {d.quantity}</p>
                      <p><strong>Category:</strong> {d.category}</p>
                      <p><strong>Condition:</strong> {d.condition.replace(/_/g, " ")}</p>
                      {d.description && <p><strong>Description:</strong> {d.description}</p>}
                    </div>
                    <div className="card-info">
                      <p>✅ Assigned and ready for delivery</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Requests Tab */}
      {activeTab === "requests" && (
        <div className="tab-content">
          {/* Pending Requests */}
          <div className="section">
            <div className="section-header">
              <h2>⏳ Pending Requests</h2>
              <span className="count-badge">{stats.pendingRequests}</span>
            </div>
            {stats.pendingRequests === 0 ? (
              <div className="empty-section">No pending requests</div>
            ) : (
              <div className="cards-grid">
                {requests.filter(r => r.status === "pending").map(r => (
                  <div key={r.id} className="approval-card pending">
                    <div className="card-header">
                      <h3>{r.item_category || "Item Request"}</h3>
                      <span className="status-badge pending">Pending</span>
                    </div>
                    <div className="card-details">
                      <p><strong>Requested by:</strong> {r.receiver_user?.username || "Unknown"}</p>
                      <p><strong>Status:</strong> Awaiting approval</p>
                      {r.item_description && <p><strong>Description:</strong> {r.item_description}</p>}
                    </div>
                    <div className="card-actions">
                      <button
                        className="btn-approve"
                        onClick={() => setConfirmAction({ type: "approveRequest", id: r.id, item: r.item_category })}
                      >
                        ✅ Approve
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => setConfirmAction({ type: "rejectRequest", id: r.id, item: r.item_category })}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Approved Requests */}
          <div className="section">
            <div className="section-header">
              <h2>✅ Approved Requests</h2>
              <span className="count-badge">{stats.approvedRequests}</span>
            </div>
            {stats.approvedRequests === 0 ? (
              <div className="empty-section">No approved requests</div>
            ) : (
              <div className="cards-grid">
                {requests.filter(r => r.status === "approved").map(r => (
                  <div key={r.id} className="approval-card verified">
                    <div className="card-header">
                      <h3>{r.item_category || "Item Request"}</h3>
                      <span className="status-badge verified">Approved</span>
                    </div>
                    <div className="card-details">
                      <p><strong>Requested by:</strong> {r.receiver_user?.username || "Unknown"}</p>
                      <p><strong>Status:</strong> Approved and ready</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rejected Requests */}
          <div className="section">
            <div className="section-header">
              <h2>❌ Rejected Requests</h2>
              <span className="count-badge">{stats.rejectedRequests}</span>
            </div>
            {stats.rejectedRequests === 0 ? (
              <div className="empty-section">No rejected requests</div>
            ) : (
              <div className="cards-grid">
                {requests.filter(r => r.status === "rejected").map(r => (
                  <div key={r.id} className="approval-card">
                    <div className="card-header">
                      <h3>{r.item_category || "Item Request"}</h3>
                      <span className="status-badge rejected">Rejected</span>
                    </div>
                    <div className="card-details">
                      <p><strong>Requested by:</strong> {r.receiver_user?.username || "Unknown"}</p>
                      <p><strong>Status:</strong> Request rejected</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <h3>Confirm Action</h3>
            <p>Are you sure you want to {confirmAction.type === "verify" ? "verify" : confirmAction.type === "assign" ? "assign" : confirmAction.type === "approveRequest" ? "approve" : "reject"} <strong>{confirmAction.item}</strong>?</p>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </button>
              <button
                className="btn-confirm"
                onClick={() => {
                  if (confirmAction.type === "verify") verifyDonation(confirmAction.id);
                  else if (confirmAction.type === "assign") assignDonation(confirmAction.id);
                  else if (confirmAction.type === "approveRequest") approveRequest(confirmAction.id);
                  else if (confirmAction.type === "rejectRequest") rejectRequest(confirmAction.id);
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

export default Approvals;

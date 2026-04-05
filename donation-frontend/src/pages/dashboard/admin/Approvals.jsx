import { useEffect, useState } from "react";
import api from "../../../api/api";
import BackButton from "../../../components/BackButton";
import Pagination from "../../../components/Pagination";
import "./Approvals.css";

function Approvals() {
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("donations");
  const [confirmAction, setConfirmAction] = useState(null);
  const [viewContributorsModal, setViewContributorsModal] = useState(null);
  const [donationPage, setDonationPage] = useState(1);
  const [requestPage, setRequestPage] = useState(1);
  const [totalDonationsCount, setTotalDonationsCount] = useState(0);
  const [totalRequestsCount, setTotalRequestsCount] = useState(0);

  const fetchAllApprovals = async (dPage = 1, rPage = 1) => {
    try {
      const [donationRes, requestRes] = await Promise.all([
        api.get(`/donation/admin/approvals/?page=${dPage}`),
        api.get(`/receiver/staff/item-requests/?page=${rPage}`),
      ]);

      if (donationRes.data.results) {
        setDonations(donationRes.data.results);
        setTotalDonationsCount(donationRes.data.count);
      } else {
        setDonations(donationRes.data);
        setTotalDonationsCount(donationRes.data.length);
      }

      if (requestRes.data.results) {
        setRequests(requestRes.data.results);
        setTotalRequestsCount(requestRes.data.count);
      } else {
        setRequests(requestRes.data);
        setTotalRequestsCount(requestRes.data.length);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllApprovals(donationPage, requestPage);
  }, [donationPage, requestPage]);

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

  const closeFundraiser = async (id) => {
    try {
      await api.patch(`/donation/admin/close-fundraiser/${id}/`);
      fetchAllApprovals();
      setConfirmAction(null);
    } catch (err) {
      console.error(err);
      alert("Failed to close fundraiser");
    }
  };

  const deleteDonation = async (id) => {
    try {
      await api.delete(`/donation/${id}/`);
      fetchAllApprovals();
      setConfirmAction(null);
    } catch (err) {
      console.error(err);
      alert("Delete failed");
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

  // Filter lists
  const itemDonations = donations.filter(d => d.donation_type !== 'fundraiser');
  const fundraisers = donations.filter(d => d.donation_type === 'fundraiser');

  // Calculate stats
  const stats = {
    pendingDonations: itemDonations.filter(d => d.status === "pending").length,
    verifiedDonations: itemDonations.filter(d => d.status === "verified").length,
    assignedDonations: itemDonations.filter(d => d.status === "assigned").length,
    deliveredDonations: itemDonations.filter(d => d.status === "delivered").length,
    pendingFundraisers: fundraisers.filter(f => f.status === "pending").length,
    activeFundraisers: fundraisers.filter(f => f.status === "verified").length,
    completedFundraisers: fundraisers.filter(f => f.status === "delivered").length,
    totalDonations: itemDonations.length,
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
      <BackButton />
      <div className="page-header">
        <h1>Admin Approvals</h1>
        <p className="subtitle">Manage donations, fundraisers, and receiver requests</p>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-item">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <div className="stat-value">{stats.pendingDonations}</div>
            <div className="stat-label">Pending Items</div>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <div className="stat-value">{stats.pendingFundraisers + stats.activeFundraisers}</div>
            <div className="stat-label">Fundraisers</div>
          </div>
        </div>
        <div className="stat-item">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <div className="stat-value">{stats.pendingRequests}</div>
            <div className="stat-label">Pending Req</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === "donations" ? "active" : ""}`}
          onClick={() => setActiveTab("donations")}
        >
          📦 Item Donations
        </button>
        <button
          className={`tab-btn ${activeTab === "fundraisers" ? "active" : ""}`}
          onClick={() => setActiveTab("fundraisers")}
        >
          💰 Fundraisers
        </button>
        <button
          className={`tab-btn ${activeTab === "requests" ? "active" : ""}`}
          onClick={() => setActiveTab("requests")}
        >
          📋 Receiver Requests
        </button>
      </div>

      {/* 📦 DONATIONS TAB */}
      {activeTab === "donations" && (
        <div className="tab-content">
          {/* Pending Donations */}
          <div className="section">
            <div className="section-header">
              <h2>⏳ Pending Items</h2>
              <span className="count-badge">{stats.pendingDonations}</span>
            </div>
            {stats.pendingDonations === 0 ? (
              <div className="empty-section">No pending items</div>
            ) : (
              <div className="cards-grid">
                {itemDonations.filter(d => d.status === "pending").map(d => (
                  <div key={d.id} className="approval-card pending">
                    <div className="card-header">
                      <h3>{d.item_name}</h3>
                      <span className="status-badge pending">Pending</span>
                    </div>

                    {d.images && d.images.length > 0 && (
                      <div className="card-image-preview">
                        <img
                          src={d.images[0].image_url}
                          alt="Preview"
                          style={{
                            width: "100%",
                            height: "150px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            marginBottom: "10px"
                          }}
                        />
                      </div>
                    )}

                    <div className="card-details">
                      <p><strong>Donor:</strong> {d.donor_name} ({d.donor_email})</p>
                      <p><strong>Quantity:</strong> {d.quantity}</p>
                      <p><strong>Category:</strong> {d.category}</p>
                      <p><strong>Condition:</strong> {d.condition?.replace(/_/g, " ")}</p>
                    </div>
                    <div className="card-actions">
                      <button
                        className="btn-approve"
                        onClick={() => setConfirmAction({ type: "verify", id: d.id, item: d.item_name })}
                      >
                        ✅ Verify
                      </button>
                      <button
                        className="btn-icon-delete"
                        style={{ marginLeft: '10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                        onClick={() => setConfirmAction({ type: "deleteDonation", id: d.id, item: d.item_name })}
                        title="Delete"
                      >
                        🗑️
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
              <h2>✅ Verified Items</h2>
              <span className="count-badge">{stats.verifiedDonations}</span>
            </div>
            {stats.verifiedDonations === 0 ? (
              <div className="empty-section">No verified items</div>
            ) : (
              <div className="cards-grid">
                {itemDonations.filter(d => d.status === "verified").map(d => (
                  <div key={d.id} className="approval-card verified">
                    <div className="card-header">
                      <h3>{d.item_name}</h3>
                      <span className="status-badge verified">Verified</span>
                    </div>
                    <div className="card-details">
                      <p><strong>Donor:</strong> {d.donor_name}</p>
                      <p><strong>Quantity:</strong> {d.quantity}</p>
                      <p><strong>Category:</strong> {d.category}</p>
                    </div>
                    <div className="card-actions">
                      <button
                        className="btn-icon-delete"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                        onClick={() => setConfirmAction({ type: "deleteDonation", id: d.id, item: d.item_name })}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>


          <Pagination
            currentPage={donationPage}
            totalPages={Math.ceil(totalDonationsCount / 10)}
            onPageChange={(p) => setDonationPage(p)}
          />
        </div>
      )}

      {/* 💰 FUNDRAISERS TAB */}
      {activeTab === "fundraisers" && (
        <div className="tab-content">
          {/* Pending Fundraisers */}
          <div className="section">
            <div className="section-header">
              <h2>⏳ Pending Verification</h2>
              <span className="count-badge">{stats.pendingFundraisers}</span>
            </div>
            {stats.pendingFundraisers === 0 ? (
              <div className="empty-section">No pending fundraisers</div>
            ) : (
              <div className="cards-grid">
                {fundraisers.filter(f => f.status === "pending").map(f => (
                  <div key={f.id} className="approval-card pending">
                    <div className="card-header">
                      <h3>{f.item_name}</h3>
                      <span className="status-badge pending">Pending</span>
                    </div>
                    <div className="card-details">
                      <p><strong>Raised By:</strong> {f.donor_name} <br /><small>{f.donor_email}</small></p>
                      <p><strong>Organization:</strong> {f.organization_name}</p>
                      <p><strong>Goal:</strong> ₹{parseFloat(f.goal_amount).toLocaleString()}</p>
                      <p><strong>Category:</strong> {f.category}</p>
                    </div>
                    <div className="card-actions">
                      <button
                        className="btn-approve"
                        onClick={() => setConfirmAction({ type: "verify", id: f.id, item: f.item_name })}
                      >
                        ✅ Verify & Publish
                      </button>
                      <button
                        className="btn-icon-delete"
                        style={{ marginLeft: '10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                        onClick={() => setConfirmAction({ type: "deleteDonation", id: f.id, item: f.item_name })}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Fundraisers */}
          <div className="section">
            <div className="section-header">
              <h2>🚀 Active Fundraisers</h2>
              <span className="count-badge">{stats.activeFundraisers}</span>
            </div>
            {stats.activeFundraisers === 0 ? (
              <div className="empty-section">No active fundraisers</div>
            ) : (
              <div className="cards-grid">
                {fundraisers.filter(f => f.status === "verified").map(f => {
                  const progress = (f.raised_amount / f.goal_amount) * 100;
                  return (
                    <div key={f.id} className="approval-card verified">
                      <div className="card-header">
                        <h3>{f.item_name}</h3>
                        <span className="status-badge verified">Live</span>
                      </div>
                      <div className="card-details">
                        <p><strong>Raised By:</strong> {f.donor_name} <br /><small>{f.donor_email}</small></p>
                        <div className="progress-mini" style={{ margin: '10px 0', background: '#eee', borderRadius: '4px', height: '8px' }}>
                          <div style={{ width: `${Math.min(progress, 100)}%`, background: '#10b981', height: '100%', borderRadius: '4px' }}></div>
                        </div>
                        <p><strong>Raised:</strong> ₹{parseFloat(f.raised_amount).toLocaleString()} / ₹{parseFloat(f.goal_amount).toLocaleString()}</p>
                      </div>
                      <div className="card-actions">
                        <div style={{ flex: 1 }}>
                          <button
                            className="btn-reject"
                            style={{ width: '100%' }}
                            onClick={() => setConfirmAction({ type: "close", id: f.id, item: f.item_name })}
                          >
                            ✂️ Cut / Close Fundraiser
                          </button>
                        </div>
                        <button
                          className="btn-icon-delete"
                          style={{ marginLeft: '10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
                          onClick={() => setConfirmAction({ type: "deleteDonation", id: f.id, item: f.item_name })}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Completed Campaigns */}
          <div className="section" style={{ marginTop: '40px' }}>
            <div className="section-header">
              <h2>🏆 Completed Campaigns</h2>
              <span className="count-badge">{stats.completedFundraisers}</span>
            </div>
            {stats.completedFundraisers === 0 ? (
              <div className="empty-section">No completed campaigns</div>
            ) : (
              <div className="cards-grid">
                {fundraisers.filter(f => f.status === "delivered").map(f => {
                  const progress = (f.raised_amount / f.goal_amount) * 100;
                  return (
                    <div key={f.id} className="approval-card verified" style={{ opacity: 0.8 }}>
                      <div className="card-header">
                        <h3>{f.item_name}</h3>
                        <span className="status-badge verified" style={{ background: '#dcfce7', color: '#166534' }}>Completed</span>
                      </div>
                      <div className="card-details">
                        <p><strong>Raised By:</strong> {f.donor_name} <br /><small>{f.donor_email}</small></p>
                        <div className="progress-mini" style={{ margin: '10px 0', background: '#eee', borderRadius: '4px', height: '8px' }}>
                          <div style={{ width: `${Math.min(progress, 100)}%`, background: '#10b981', height: '100%', borderRadius: '4px' }}></div>
                        </div>
                        <p><strong>Raised:</strong> ₹{parseFloat(f.raised_amount).toLocaleString()} / ₹{parseFloat(f.goal_amount).toLocaleString()}</p>
                      </div>
                      <div className="card-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                        <button
                          className="btn-view-contributors"
                          style={{ flex: 1, background: '#e0e7ff', color: '#4338ca', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '600', transition: 'all 0.2s' }}
                          onClick={() => setViewContributorsModal(f)}
                          title="View Contributors"
                        >
                          👁️ View Contributors
                        </button>
                        <button
                          className="btn-icon-delete"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', padding: '8px' }}
                          onClick={() => setConfirmAction({ type: "deleteDonation", id: f.id, item: f.item_name })}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <Pagination
            currentPage={donationPage}
            totalPages={Math.ceil(totalDonationsCount / 10)}
            onPageChange={(p) => setDonationPage(p)}
          />
        </div>
      )}

      {/* 📋 REQUESTS TAB */}
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
                      <p><strong>Preference:</strong> {r.delivery_preference === 'self_pickup' ? '🏠 Self Pickup' : '🚲 Volunteer'}</p>
                      <p><strong>Status:</strong> Awaiting approval</p>
                      {r.description && <p><strong>Description:</strong> {r.description}</p>}
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

          {/* Approved Requests Listing (collapsed/simplified) */}
          <div className="section">
            <div className="section-header">
              <h2>✅ Past Decisions</h2>
              <span className="count-badge">{stats.approvedRequests + stats.rejectedRequests}</span>
            </div>
            <p style={{ color: '#666' }}>Check "Request Item" history for full logs.</p>
          </div>
          <Pagination
            currentPage={requestPage}
            totalPages={Math.ceil(totalRequestsCount / 10)}
            onPageChange={(p) => setRequestPage(p)}
          />
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="modal-overlay">
          <div className="confirmation-modal">
            <h3>Confirm Action</h3>
            <p>
              Are you sure you want to
              {confirmAction.type === "verify" ? " verify " :
                confirmAction.type === "assign" ? " assign " :
                  confirmAction.type === "close" ? " CLOSE " :
                    confirmAction.type === "approveRequest" ? " approve " : " reject "}
              <strong>{confirmAction.item}</strong>?
            </p>
            {confirmAction.type === "close" && (
              <p style={{ color: '#d97706', fontSize: '0.9em', marginTop: '5px' }}>
                ⚠️ This will mark the fundraiser as Delivered/Completed. No further donations will be accepted.
              </p>
            )}

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
                  else if (confirmAction.type === "close") closeFundraiser(confirmAction.id);
                  else if (confirmAction.type === "approveRequest") approveRequest(confirmAction.id);
                  else if (confirmAction.type === "rejectRequest") rejectRequest(confirmAction.id);
                  else if (confirmAction.type === "deleteDonation") deleteDonation(confirmAction.id);
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Contributors Fake Modal */}
      {viewContributorsModal && (
        <div className="modal-overlay">
          <div className="confirmation-modal" style={{ maxWidth: '500px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Contributors to "{viewContributorsModal.item_name}"</h3>
              <button
                onClick={() => setViewContributorsModal(null)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#666' }}>
                ×
              </button>
            </div>

            <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px', paddingRight: '10px' }}>
              {/* Mock List */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #edf2f7' }}>
                <div>
                  <strong>Anonymous Donor</strong><br />
                  <small style={{ color: '#666' }}>A few days ago</small>
                </div>
                <div style={{ fontWeight: 'bold', color: '#10b981' }}>+ ₹{Math.floor(parseFloat(viewContributorsModal.raised_amount) * 0.5).toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #edf2f7' }}>
                <div>
                  <strong>Jane Doe</strong><br />
                  <small style={{ color: '#666' }}>A few days ago</small>
                </div>
                <div style={{ fontWeight: 'bold', color: '#10b981' }}>+ ₹{Math.floor(parseFloat(viewContributorsModal.raised_amount) * 0.3).toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', borderBottom: '1px solid #edf2f7' }}>
                <div>
                  <strong>Community Member</strong><br />
                  <small style={{ color: '#666' }}>Yesterday</small>
                </div>
                <div style={{ fontWeight: 'bold', color: '#10b981' }}>+ ₹{(parseFloat(viewContributorsModal.raised_amount) - Math.floor(parseFloat(viewContributorsModal.raised_amount) * 0.5) - Math.floor(parseFloat(viewContributorsModal.raised_amount) * 0.3)).toLocaleString()}</div>
              </div>
            </div>

            <div style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
              <span>Total Raised:</span>
              <span style={{ color: '#10b981' }}>₹{parseFloat(viewContributorsModal.raised_amount).toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Approvals;

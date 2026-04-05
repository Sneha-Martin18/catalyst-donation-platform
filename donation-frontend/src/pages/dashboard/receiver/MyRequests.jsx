import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../../api/api";
import BackButton from "../../../components/BackButton";
import Pagination from "../../../components/Pagination";
import "./MyRequests.css";

function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Delivery selection states
  const [selectedFulfillment, setSelectedFulfillment] = useState(null);
  const [deliveryType, setDeliveryType] = useState("volunteer");
  const [dropAddress, setDropAddress] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchRequests(page);
  }, [page]);

  const confirmAcceptDonation = async () => {
    if (!selectedFulfillment) return;
    setIsProcessing(true);

    try {
      await api.post("receiver/orders/", {
        donation: selectedFulfillment.id,
        delivery_type: deliveryType,
        drop_address: deliveryType === "volunteer" ? dropAddress : "",
      });

      alert("Donation accepted successfully! Order created.");
      setSelectedFulfillment(null);
      setSelectedRequest(null); // Close the detail modal
      setDropAddress("");
      fetchRequests(page); // Refresh the list
    } catch (err) {
      alert(
        err.response?.data?.error ||
        "Failed to accept donation. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchRequests = async (currentPage = 1) => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get(`receiver/requests/?page=${currentPage}`);

      if (response.data.results) {
        setRequests(response.data.results);
        setTotalCount(response.data.count);
      } else {
        setRequests(response.data);
        setTotalCount(response.data.length);
      }
    } catch (err) {
      console.error("Failed to fetch requests:", err);
      setError("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      <BackButton />
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
      {/* REQUESTS LIST - Simplified Cards */}
      {requests.length > 0 ? (
        <div className="requests-table-grid">
          {requests.map((request) => (
            <div key={request.id} className="request-summary-card">
              <div className="card-top-info">
                <h3>{request.item_name}</h3>
                <span className={`status-badge ${getStatusColor(request.status)}`}>
                  {(request.status || "PENDING").toUpperCase()}
                </span>
              </div>

              <div className="card-bottom-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedRequest(request)}
                >
                  View Details
                </button>
                {request.status === "approved" && (
                  <Link
                    to={`../browse?category=${encodeURIComponent(request.category)}&search=${encodeURIComponent(request.item_name)}`}
                    className="btn btn-primary"
                  >
                    Browse Items
                  </Link>
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

      {requests.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={Math.ceil(totalCount / 10)}
          onPageChange={handlePageChange}
        />
      )}

      {/* DETAILS MODAL - Based on User Image */}
      {
        selectedRequest && (
          <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
            <div className="request-details-modal" onClick={e => e.stopPropagation()}>
              <button className="close-modal" onClick={() => setSelectedRequest(null)}>×</button>

              <div className="modal-header-premium">
                <h2>{selectedRequest.item_name}</h2>
                <span className={`status-badge-premium ${getStatusColor(selectedRequest.status)}`}>
                  {selectedRequest.status.toUpperCase()}
                </span>
              </div>

              <div className="modal-body-premium">
                <div className="premium-detail-row">
                  <label>Category:</label>
                  <span>{selectedRequest.category}</span>
                </div>
                <div className="premium-detail-row">
                  <label>Quantity:</label>
                  <span>{selectedRequest.quantity}</span>
                </div>
                <div className="premium-detail-row">
                  <label>Condition:</label>
                  <span>{getConditionLabel(selectedRequest.condition)}</span>
                </div>
                {selectedRequest.used_duration_months && (
                  <div className="premium-detail-row">
                    <label>Duration of Use:</label>
                    <span>{selectedRequest.used_duration_months} months</span>
                  </div>
                )}

                <div className="premium-description-section">
                  <label>Description:</label>
                  <p>{selectedRequest.description || "No description provided."}</p>
                </div>

                <div className="premium-detail-row highlight" style={{ marginBottom: "20px" }}>
                  <label>Delivery Preference:</label>
                  <span>
                    {selectedRequest.delivery_preference === 'self_pickup' ? '🏠 Self Pickup' : '🚲 Volunteer Delivery'}
                  </span>
                </div>

                {/* MATCHED DONATION SECTION */}
                {selectedRequest.fulfillments && selectedRequest.fulfillments.length > 0 && selectedRequest.status === 'approved' && (
                  <div className="fulfillment-acceptance-section">
                    <h3>🎁 Matching Donation Found!</h3>

                    {!selectedFulfillment ? (
                      <div className="matched-item-preview">
                        <div className="match-info">
                          <div>
                            <strong className="match-title">{selectedRequest.fulfillments[0].item_name}</strong>
                            <span className="match-condition">Condition: {selectedRequest.fulfillments[0].condition?.replace(/_/g, " ")}</span>
                          </div>
                          <button
                            className="btn btn-primary"
                            onClick={() => {
                              setSelectedFulfillment(selectedRequest.fulfillments[0]);
                              setDeliveryType(selectedRequest.delivery_preference || "volunteer");
                            }}
                          >
                            Accept & Choose Delivery
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="delivery-selection-flow">
                        <h4>Choose Delivery Method for this item:</h4>

                        <div className="delivery-method-grid">
                          <div
                            onClick={() => setDeliveryType("self_pickup")}
                            className={`delivery-box ${deliveryType === "self_pickup" ? 'active' : ''}`}
                          >
                            <span className="delivery-icon">🏠</span>
                            <strong>Self Pickup</strong>
                          </div>
                          <div
                            onClick={() => setDeliveryType("volunteer")}
                            className={`delivery-box ${deliveryType === "volunteer" ? 'active' : ''}`}
                          >
                            <span className="delivery-icon">🚲</span>
                            <strong>Volunteer</strong>
                          </div>
                        </div>

                        {deliveryType === "volunteer" && (
                          <div className="address-input-group">
                            <label>Drop Location</label>
                            <textarea
                              rows="2"
                              placeholder="Where should the volunteer deliver this?"
                              value={dropAddress}
                              onChange={(e) => setDropAddress(e.target.value)}
                            />
                          </div>
                        )}

                        <div className="acceptance-actions">
                          <button
                            className="btn btn-secondary"
                            onClick={() => setSelectedFulfillment(null)}
                          >
                            Back
                          </button>
                          <button
                            className="btn btn-confirm-accept"
                            onClick={confirmAcceptDonation}
                            disabled={isProcessing}
                          >
                            {isProcessing ? "Processing..." : "Confirm & Accept Item"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="premium-detail-row highlight">
                  <label>Images Required:</label>
                  <span className="images-badge">
                    {selectedRequest.images_required ? "📸 Yes" : "No"}
                  </span>
                </div>

                <div className="modal-footer-date">
                  <small>Created: {new Date(selectedRequest.created_at).toLocaleDateString()}</small>
                </div>

                {selectedRequest.status === "approved" && (
                  <Link
                    to={`../browse?category=${encodeURIComponent(selectedRequest.category)}&search=${encodeURIComponent(selectedRequest.item_name)}`}
                    className="btn-browse-large"
                  >
                    Browse Matching Donations
                  </Link>
                )}
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}

export default MyRequests;

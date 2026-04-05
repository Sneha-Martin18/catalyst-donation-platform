import { useState, useEffect } from "react";
import api from "../../../api/api";
import BackButton from "../../../components/BackButton";
import Pagination from "../../../components/Pagination";
import "./MyOrders.css";

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [ratingData, setRatingData] = useState({ orderId: null, rating: 5, comment: "" });
  const [isRating, setIsRating] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [confirmConfig, setConfirmConfig] = useState({ show: false, title: "", message: "", onConfirm: null });

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  useEffect(() => {
    fetchOrders(page);
  }, [page]);

  const fetchOrders = async (currentPage = 1) => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get(`receiver/orders/?page=${currentPage}`);

      if (response.data.results) {
        setOrders(response.data.results);
        setTotalCount(response.data.count);
      } else {
        setOrders(response.data);
        setTotalCount(response.data.length || 0);
      }
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const initiateCancel = (orderId) => {
    setConfirmConfig({
      show: true,
      title: "Cancel Order",
      message: "Are you sure you want to cancel this order? The item will be made available for others.",
      onConfirm: () => handleCancelOrder(orderId)
    });
  };

  const initiateReceive = (orderId) => {
    setConfirmConfig({
      show: true,
      title: "Confirm Receipt",
      message: "Confirm that you have received the item?",
      onConfirm: () => handleMarkAsReceived(orderId)
    });
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelOrder = async (orderId) => {
    setConfirmConfig({ ...confirmConfig, show: false });
    try {
      await api.patch(`receiver/orders/${orderId}/cancel/`);
      showSuccess("Order canceled successfully.");
      setSelectedOrder(null);
      fetchOrders(page);
    } catch (err) {
      console.error("Failed to cancel order:", err);
      const errorMsg = err.response?.data?.error || "Failed to cancel order. Please try again.";
      setError(errorMsg);
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleMarkAsReceived = async (orderId) => {
    setConfirmConfig({ ...confirmConfig, show: false });
    try {
      await api.patch(`receiver/orders/${orderId}/mark-delivered/`);
      showSuccess("Item marked as received. Thank you!");
      setSelectedOrder(null);
      fetchOrders(page);
    } catch (err) {
      console.error("Failed to mark as received:", err);
      const errorMsg = err.response?.data?.error || "Failed to mark as received. Please try again.";
      setError(errorMsg);
      setTimeout(() => setError(""), 5000);
    }
  };

  const handleRateVolunteer = async () => {
    if (!ratingData.orderId) return;

    try {
      setIsRating(true);
      await api.post("receiver/orders/rate-volunteer/", {
        order: ratingData.orderId,
        rating: ratingData.rating,
        comment: ratingData.comment
      });
      showSuccess("Thank you for your feedback!");
      setRatingData({ orderId: null, rating: 5, comment: "" });
      setSelectedOrder(null);
      fetchOrders(page);
    } catch (err) {
      console.error("Failed to submit rating:", err);
      const errorMsg = typeof err.response?.data === 'object'
        ? Object.values(err.response.data)[0]
        : "Failed to submit rating. Please try again.";
      alert(errorMsg);
    } finally {
      setIsRating(false);
    }
  };

  const filteredOrders =
    filterStatus === "all"
      ? orders
      : orders.filter((order) => order.status === filterStatus);

  const getStatusColor = (status) => {
    switch (status) {
      case "assigned":
        return "status-approved";
      case "picked_up":
        return "status-approved";
      case "delivered":
        return "status-completed";
      case "pending":
        return "status-pending";
      case "approved":
        return "status-approved";
      case "rejected":
        return "status-rejected";
      case "completed":
        return "status-completed";
      case "canceled":
        return "status-rejected";
      default:
        return "";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "assigned":
        return "📍";
      case "picked_up":
        return "🚚";
      case "delivered":
        return "🎉";
      case "pending":
        return "⏳";
      case "approved":
        return "✅";
      case "rejected":
        return "❌";
      case "completed":
        return "🎉";
      case "canceled":
        return "🚫";
      default:
        return "📦";
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
      <div className="my-orders">
        <h1>My Orders</h1>
        <p className="loading">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="my-orders">
      <BackButton />
      <h1>My Donation Orders</h1>

      {successMessage && <div className="alert alert-success">{successMessage}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* FILTERS */}
      <div className="filters">
        <h3>Filter by Status</h3>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterStatus === "all" ? "active" : ""}`}
            onClick={() => setFilterStatus("all")}
          >
            All ({orders.length})
          </button>
          <button
            className={`filter-btn ${filterStatus === "pending" ? "active" : ""}`}
            onClick={() => setFilterStatus("pending")}
          >
            Pending ({orders.filter((o) => o.status === "pending").length})
          </button>
          <button
            className={`filter-btn ${filterStatus === "approved" ? "active" : ""}`}
            onClick={() => setFilterStatus("approved")}
          >
            Approved ({orders.filter((o) => o.status === "approved").length})
          </button>
          <button
            className={`filter-btn ${filterStatus === "delivered" ? "active" : ""}`}
            onClick={() => setFilterStatus("delivered")}
          >
            Delivered ({orders.filter((o) => o.status === "delivered").length})
          </button>
          <button
            className={`filter-btn ${filterStatus === "completed" ? "active" : ""}`}
            onClick={() => setFilterStatus("completed")}
          >
            Completed ({orders.filter((o) => o.status === "completed").length})
          </button>
          <button
            className={`filter-btn ${filterStatus === "canceled" ? "active" : ""}`}
            onClick={() => setFilterStatus("canceled")}
          >
            Canceled ({orders.filter((o) => o.status === "canceled").length})
          </button>
        </div>
      </div>

      {/* ORDERS LIST - Compact Small Boxes */}
      {filteredOrders.length > 0 ? (
        <div className="orders-table-grid">
          {filteredOrders.map((order) => (
            <div key={order.id} className="order-summary-card">
              <div className="card-top-info">
                <div className="card-title-row">
                  <span className="status-icon-small">{getStatusIcon(order.status)}</span>
                  <h3>{order.donation.item_name}</h3>
                </div>
                <div className="card-badges">
                  <span className={`status-badge ${getStatusColor(order.status)}`}>
                    {order.status.toUpperCase()}
                  </span>
                  <span className={`delivery-badge-mini ${order.delivery_type === 'self_pickup' ? 'self' : 'volunteer'}`}>
                    {order.delivery_type === 'self_pickup' ? '🏠 Self' : '🚲 Vol'}
                  </span>
                </div>
              </div>

              <div className="card-bottom-actions">
                <button
                  className="btn-view-details"
                  onClick={() => setSelectedOrder(order)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h2>No orders found</h2>
          {filterStatus !== "all" ? (
            <p>No orders with "{filterStatus}" status</p>
          ) : (
            <p>You haven't created any donation orders yet.</p>
          )}
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="order-details-modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedOrder(null)}>×</button>

            <div className="modal-header-premium">
              <div className="header-title-group">
                <span className="status-icon-large">{getStatusIcon(selectedOrder.status)}</span>
                <h2>{selectedOrder.donation.item_name}</h2>
              </div>
              <div className="header-badges">
                <span className={`delivery-badge ${selectedOrder.delivery_type === 'self_pickup' ? 'self' : 'volunteer'}`} style={{
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "0.85em",
                  fontWeight: "600",
                  background: selectedOrder.delivery_type === 'self_pickup' ? "#fef3c7" : "#e0e7ff",
                  color: selectedOrder.delivery_type === 'self_pickup' ? "#92400e" : "#4338ca",
                  border: `1px solid ${selectedOrder.delivery_type === 'self_pickup' ? "#fde68a" : "#c7d2fe"}`
                }}>
                  {selectedOrder.delivery_type === 'self_pickup' ? '🏠 Self Pickup' : '🚲 Volunteer'}
                </span>
                <span className={`status-badge-premium ${getStatusColor(selectedOrder.status)}`}>
                  {selectedOrder.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="modal-body-premium">
              <div className="info-grid-premium">
                <div className="premium-detail-row">
                  <label>Category:</label>
                  <span>{selectedOrder.donation.category}</span>
                </div>
                <div className="premium-detail-row">
                  <label>Condition:</label>
                  <span>{getConditionLabel(selectedOrder.donation.condition)}</span>
                </div>
                <div className="premium-detail-row">
                  <label>Quantity:</label>
                  <span>{selectedOrder.donation.quantity}</span>
                </div>
                <div className="premium-detail-row">
                  <label>Order Date:</label>
                  <span>{new Date(selectedOrder.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {selectedOrder.donation.used_duration_months && (
                <div className="premium-section">
                  <label>Duration of Use:</label>
                  <p>{selectedOrder.donation.used_duration_months} months</p>
                </div>
              )}

              {selectedOrder.donation.description && (
                <div className="premium-section">
                  <label>Item Description:</label>
                  <p className="description-text">{selectedOrder.donation.description}</p>
                </div>
              )}

              {selectedOrder.donation.images && selectedOrder.donation.images.length > 0 && (
                <div className="premium-section">
                  <label>Item Photos ({selectedOrder.donation.images.length}):</label>
                  <div className="images-scroll-grid">
                    {selectedOrder.donation.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img.image_url}
                        alt={`${selectedOrder.donation.item_name} ${idx + 1}`}
                        className="modal-thumbnail"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* VOLUNTEER INFO */}
              {(selectedOrder.status === "picked_up" || selectedOrder.status === "delivered") && selectedOrder.volunteer_name && (
                <div className="volunteer-info-banner">
                  <div className="banner-icon">🛵</div>
                  <div className="banner-content">
                    <p className="banner-title">Delivery Partner Assigned</p>
                    <p className="banner-text"><strong>{selectedOrder.volunteer_name}</strong> is handling your order.</p>
                    {selectedOrder.volunteer_phone && (
                      <p className="banner-phone">📞 {selectedOrder.volunteer_phone}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="modal-status-feedback">
                {selectedOrder.status === "pending" && (
                  <div className="status-notice pending">⏳ Awaiting staff approval. You'll be notified soon.</div>
                )}
                {selectedOrder.status === "assigned" && (
                  <div className="status-notice approved">
                    {selectedOrder.delivery_type === "self_pickup"
                      ? "📍 Ready for pickup! Please coordinate with the donor."
                      : "📍 Order assigned! Waiting for a volunteer to pick it up."
                    }
                  </div>
                )}
                {selectedOrder.status === "picked_up" && (
                  <div className="status-notice approved">🚚 Order is out for delivery!</div>
                )}
                {selectedOrder.status === "delivered" && (
                  <div className="delivery-success-zone">
                    <div className="status-notice completed">🎉 Order delivered! Enjoy your item.</div>
                    <div className="thanks-card">
                      <p>❤️ <strong>Thank you for being part of Catalyst!</strong></p>
                      <p>We are happy to have helped you. Your support keeps our community growing.</p>
                    </div>

                    {!selectedOrder.has_rated && (
                      <div className="modal-rating-section">
                        <h4>Rate your Delivery Partner</h4>
                        <div className="star-rating">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span
                              key={star}
                              className={`star ${ratingData.orderId === selectedOrder.id && ratingData.rating >= star ? "active" : ""}`}
                              onClick={() => setRatingData({ ...ratingData, orderId: selectedOrder.id, rating: star })}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        {ratingData.orderId === selectedOrder.id && (
                          <div className="rating-form">
                            <textarea
                              placeholder="Add a comment (optional)..."
                              value={ratingData.comment}
                              onChange={(e) => setRatingData({ ...ratingData, comment: e.target.value })}
                            />
                            <button className="btn-submit-rating" onClick={handleRateVolunteer} disabled={isRating}>
                              {isRating ? "Submitting..." : "Submit Rating"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                    {selectedOrder.has_rated && <p className="rated-label-modal">✅ You have rated this delivery. Thank you!</p>}
                  </div>
                )}
                {selectedOrder.status === "approved" && <div className="status-notice approved">✅ Order approved! Delivery will be arranged soon.</div>}
                {selectedOrder.status === "completed" && <div className="status-notice completed">🎉 Order completed! Thank you!</div>}
                {selectedOrder.status === "rejected" && <div className="status-notice rejected">❌ Order was rejected.</div>}
                {selectedOrder.status === "canceled" && <div className="status-notice rejected">🚫 Order was canceled.</div>}
              </div>
            </div>

            <div className="modal-footer-actions">
              {selectedOrder.delivery_type === "self_pickup" && selectedOrder.status === "assigned" && (
                <button
                  className="btn-mark-received-large"
                  onClick={() => initiateReceive(selectedOrder.id)}
                >
                  Confirm Received
                </button>
              )}
              {["assigned", "approved", "pending"].includes(selectedOrder.status) && (
                <button
                  className="btn-cancel-order-large"
                  onClick={() => initiateCancel(selectedOrder.id)}
                >
                  Cancel Order
                </button>
              )}
              {selectedOrder.updated_at !== selectedOrder.created_at && (
                <small className="modal-update-time">
                  Last updated: {new Date(selectedOrder.updated_at).toLocaleDateString()}
                </small>
              )}
            </div>
          </div>
        </div>
      )}

      {orders.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={Math.ceil(totalCount / 10)}
          onPageChange={handlePageChange}
        />
      )}
      {confirmConfig.show && (
        <div className="modal-overlay" onClick={() => setConfirmConfig({ ...confirmConfig, show: false })}>
          <div className="order-details-modal confirm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', padding: '30px' }}>
            <h2 style={{ marginBottom: '15px' }}>{confirmConfig.title}</h2>
            <p style={{ marginBottom: '25px', color: '#64748b' }}>{confirmConfig.message}</p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                className="btn-view-details"
                onClick={() => setConfirmConfig({ ...confirmConfig, show: false })}
                style={{ padding: '12px 24px', flex: 1 }}
              >
                No, Cancel
              </button>
              <button
                className="btn-mark-received-large"
                onClick={confirmConfig.onConfirm}
                style={{ flex: 1, padding: '12px 24px' }}
              >
                Yes, Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyOrders;

import { useState, useEffect } from "react";
import api from "../../../api/api";
import "./MyOrders.css";

function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("receiver/orders/");
      setOrders(response.data);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      setError("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders =
    filterStatus === "all"
      ? orders
      : orders.filter((order) => order.status === filterStatus);

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

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return "⏳";
      case "approved":
        return "✅";
      case "rejected":
        return "❌";
      case "completed":
        return "🎉";
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
      <h1>My Donation Orders</h1>

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
            className={`filter-btn ${filterStatus === "completed" ? "active" : ""}`}
            onClick={() => setFilterStatus("completed")}
          >
            Completed ({orders.filter((o) => o.status === "completed").length})
          </button>
        </div>
      </div>

      {/* ORDERS LIST */}
      {filteredOrders.length > 0 ? (
        <div className="orders-list">
          {filteredOrders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-title">
                  <span className="status-icon">
                    {getStatusIcon(order.status)}
                  </span>
                  <h3>{order.donation.item_name}</h3>
                </div>
                <span className={`status-badge ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>

              <div className="order-body">
                <div className="info-grid">
                  <div className="info-item">
                    <label>Category</label>
                    <span>{order.donation.category}</span>
                  </div>

                  <div className="info-item">
                    <label>Condition</label>
                    <span>
                      {getConditionLabel(order.donation.condition)}
                    </span>
                  </div>

                  <div className="info-item">
                    <label>Quantity</label>
                    <span>{order.donation.quantity}</span>
                  </div>

                  <div className="info-item">
                    <label>Order Date</label>
                    <span>
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {order.donation.used_duration_months && (
                  <div className="info-section">
                    <label>Duration of Use:</label>
                    <span>{order.donation.used_duration_months} months</span>
                  </div>
                )}

                {order.donation.description && (
                  <div className="info-section">
                    <label>Item Description:</label>
                    <p className="description">
                      {order.donation.description}
                    </p>
                  </div>
                )}

                {order.donation.images && order.donation.images.length > 0 && (
                  <div className="images-section">
                    <label>Item Photos ({order.donation.images.length}):</label>
                    <div className="images-grid">
                      {order.donation.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img.image_url}
                          alt={`${order.donation.item_name} ${idx + 1}`}
                          className="thumbnail"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="order-footer">
                {order.status === "pending" && (
                  <p className="status-message pending">
                    ⏳ Awaiting staff approval. You'll be notified soon.
                  </p>
                )}
                {order.status === "approved" && (
                  <p className="status-message approved">
                    ✅ Order approved! Delivery will be arranged soon.
                  </p>
                )}
                {order.status === "completed" && (
                  <p className="status-message completed">
                    🎉 Order completed! Thank you for using our service.
                  </p>
                )}
                {order.status === "rejected" && (
                  <p className="status-message rejected">
                    ❌ Order was rejected. Please try requesting another item.
                  </p>
                )}

                {order.updated_at !== order.created_at && (
                  <small className="update-date">
                    Last updated: {new Date(order.updated_at).toLocaleDateString()}
                  </small>
                )}
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
    </div>
  );
}

export default MyOrders;

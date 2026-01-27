import { useEffect, useState } from "react";
import api from "../../api/api";
import ProfileCard from "./ProfileCard";
import AadhaarVerification from "./AadhaarVerification";

function ReceiverProfile({ profile, refreshProfile, onEditClick }) {
  const [requests, setRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    requests: 0,
    approved: 0,
    completed: 0,
    items_received: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const requestsRes = await api.get("/receiver/requests/");
        const ordersRes = await api.get("/receiver/orders/");

        setRequests(requestsRes.data || []);
        setOrders(ordersRes.data || []);

        // Calculate stats
        const statsData = {
          requests: requestsRes.data?.length || 0,
          approved:
            requestsRes.data?.filter((r) => r.status === "approved").length ||
            0,
          completed:
            requestsRes.data?.filter((r) => r.status === "completed").length ||
            0,
          items_received: ordersRes.data?.length || 0,
        };
        setStats(statsData);
      } catch (err) {
        console.error("Failed to load receiver data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="role-profile receiver-profile">
      {/* Profile Card */}
      <div className="profile-card-section">
        <ProfileCard profile={profile} onEditClick={onEditClick} />
      </div>

      {/* Aadhaar Verification */}
      <AadhaarVerification profile={profile} onVerified={refreshProfile} />

      <h2>Receiver Dashboard</h2>

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card requests">
          <span className="stat-icon">📋</span>
          <p className="stat-number">{stats.requests}</p>
          <p className="stat-label">Requests</p>
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

        <div className="stat-card received">
          <span className="stat-icon">📦</span>
          <p className="stat-number">{stats.items_received}</p>
          <p className="stat-label">Items Received</p>
        </div>
      </div>

      {/* Item Requests */}
      <div className="requests-section">
        <h3>My Requests</h3>

        {loading ? (
          <p className="loading-text">Loading requests...</p>
        ) : requests.length === 0 ? (
          <p className="empty-text">No requests yet. Create one to get started!</p>
        ) : (
          <div className="requests-list">
            {requests.slice(0, 5).map((request) => (
              <div key={request.id} className="request-item">
                <div className="request-header">
                  <h4>{request.item_name}</h4>
                  <span className={`status-badge ${request.status}`}>
                    {request.status}
                  </span>
                </div>
                <p className="request-detail">
                  <strong>Category:</strong> {request.category}
                </p>
                <p className="request-detail">
                  <strong>Quantity:</strong> {request.quantity}
                </p>
                <p className="request-detail">
                  <strong>Condition:</strong> {request.condition}
                </p>
                <p className="request-detail timestamp">
                  {new Date(request.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Orders Received */}
      {orders.length > 0 && (
        <div className="orders-section">
          <h3>Orders</h3>
          <div className="orders-list">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="order-item">
                <p className="order-detail">
                  <strong>Status:</strong> {order.status}
                </p>
                <p className="order-detail timestamp">
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ReceiverProfile;

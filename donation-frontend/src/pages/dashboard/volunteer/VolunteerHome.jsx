import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";
import { useUser } from "../../../context/UserContext";
import "./VolunteerHome.css";

function VolunteerHome() {
  const navigate = useNavigate();
  const { user: volunteerInfo, loading: userLoading } = useUser();
  const [stats, setStats] = useState({
    activeDeliveries: 0,
    completedDeliveries: 0,
    failedDeliveries: 0,
    averageRating: 0,
  });
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    if (volunteerInfo) {
      fetchDashboardData();
    }
  }, [volunteerInfo]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch stats from receiver app
      const statsRes = await api.get("receiver/volunteer/dashboard-stats/");
      setStats({
        activeDeliveries: statsRes.data.active_deliveries,
        completedDeliveries: statsRes.data.completed_deliveries,
        failedDeliveries: statsRes.data.failed_deliveries,
        averageRating: statsRes.data.average_rating || 0,
      });

      // Fetch active order from receiver app
      const activeOrderRes = await api.get("receiver/volunteer/active-order/");
      if (activeOrderRes.data && activeOrderRes.data.id) {
        setActiveDeliveries([activeOrderRes.data]);
      } else {
        setActiveDeliveries([]);
      }

      // Fetch availability status
      const availabilityRes = await api.get("receiver/volunteer/availability/");
      setIsAvailable(availabilityRes.data.is_available);

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      if (newStatus === 'picked_up') {
        await api.patch(`receiver/volunteer/orders/${orderId}/picked-up/`);
      } else if (newStatus === 'delivered') {
        await api.patch(`receiver/volunteer/orders/${orderId}/delivered/`);
      }
      // Refresh data
      fetchDashboardData();
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Error: " + (error.response?.data?.error || "Could not update status"));
    }
  };

  const handleAvailabilityToggle = async () => {
    setUpdatingAvailability(true);
    try {
      const response = await api.patch("receiver/volunteer/availability/", {
        is_available: !isAvailable,
      });
      setIsAvailable(response.data.is_available);
    } catch (error) {
      console.error("Failed to update availability:", error);
      alert("Failed to update availability status");
    } finally {
      setUpdatingAvailability(false);
    }
  };

  if (loading || userLoading) {
    return <div className="volunteer-home"><p>Loading dashboard...</p></div>;
  }

  return (
    <div className="volunteer-home">
      <div className="header">
        <h1>Volunteer Portal Dashboard</h1>
        <p className="volunteer-code">ID: {volunteerInfo?.volunteer_code || "N/A"}</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card active">
          <div className="stat-icon">🚚</div>
          <div className="stat-content">
            <h3>{stats.activeDeliveries}</h3>
            <p>Active Deliveries</p>
          </div>
        </div>

        <div className="stat-card completed">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.completedDeliveries}</h3>
            <p>Completed</p>
          </div>
        </div>

        <div className="stat-card failed">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <h3>{stats.failedDeliveries}</h3>
            <p>Failed Deliveries</p>
          </div>
        </div>

        <div className="stat-card rating">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>{Number(stats.averageRating || 0).toFixed(1)}</h3>
            <p>Avg Rating</p>
          </div>
        </div>
      </div>

      {/* Active Deliveries */}
      <div className="section" style={{ marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h2>My Active Deliveries</h2>
          {activeDeliveries.length > 0 && (
            <button className="btn btn-muted" onClick={fetchDashboardData}>🔄 Refresh</button>
          )}
        </div>

        {activeDeliveries.length > 0 ? (
          <div className="deliveries-list">
            {activeDeliveries.map(order => {
              const isExpanded = expandedOrderId === order.id;
              return (
                <div key={order.id} className="delivery-card" style={{ padding: '15px' }}>
                  <div className="delivery-header" style={{ marginBottom: isExpanded ? '15px' : '0' }}>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                      <h3 style={{ fontSize: '1.1rem' }}>Order #{order.id}</h3>
                      <span className={`status-badge status-${order.status}`} style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <p style={{ margin: 0, fontWeight: '500' }}>Item: {order.donation_item || "N/A"}</p>
                      <button
                        className="btn btn-muted"
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                      >
                        {isExpanded ? '🔼 Hide Details' : '🔽 View Details'}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <>
                      <div className="delivery-details" style={{ marginTop: '15px', backgroundColor: '#f9fafb', border: '1px solid #edf2f7' }}>
                        <div className="detail-row">
                          <label>Pickup Address:</label>
                          <p>{order.pickup_address || "N/A"}</p>
                        </div>
                        <div className="detail-row">
                          <label>Drop Address:</label>
                          <p>{order.drop_address || order.receiver_name + "'s Address"}</p>
                        </div>
                        <div className="detail-row">
                          <label>Receiver:</label>
                          <p>{order.receiver_name || "N/A"}</p>
                        </div>
                      </div>

                      <div className="delivery-actions" style={{ marginTop: '15px', borderTop: '1px solid #edf2f7', paddingTop: '15px' }}>
                        {order.status === 'assigned' && (
                          <button
                            className="btn btn-action"
                            onClick={() => handleStatusUpdate(order.id, 'picked_up')}
                            style={{ width: '100%' }}
                          >
                            📦 Mark Picked Up
                          </button>
                        )}
                        {order.status === 'picked_up' && (
                          <button
                            className="btn btn-success"
                            onClick={() => handleStatusUpdate(order.id, 'delivered')}
                            style={{ width: '100%' }}
                          >
                            ✅ Delivered
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-delivery-state" style={{ textAlign: 'center', padding: '20px' }}>
            <p className="empty-state">No active deliveries. You're all caught up! 🎉</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/dashboard/user/tasks')}
              style={{ padding: '10px 20px', borderRadius: '8px' }}
            >
              Find New Tasks
            </button>
          </div>
        )}
      </div>

      {/* Availability Toggle Section */}
      <div className="availability-card" style={{
        backgroundColor: "white",
        borderRadius: "15px",
        padding: "24px",
        marginTop: "30px",
        boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        border: `1px solid ${isAvailable ? "#10b98120" : "#ef444420"}`
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{
            width: "50px",
            height: "50px",
            borderRadius: "12px",
            backgroundColor: isAvailable ? "#10b98115" : "#ef444415",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem"
          }}>
            {isAvailable ? "🛵" : "🛑"}
          </div>
          <div>
            <h3 style={{ margin: "0", color: "#2d3748" }}>Availability Status</h3>
            <p style={{ margin: "5px 0 0", color: "#718096", fontSize: "0.9rem" }}>
              {isAvailable
                ? "You are currently online and can receive new delivery tasks."
                : "You are currently offline. You won't receive new task suggestions."}
            </p>
          </div>
        </div>

        <button
          onClick={handleAvailabilityToggle}
          disabled={updatingAvailability}
          className={`availability-btn ${isAvailable ? "active" : "inactive"}`}
          style={{
            padding: "12px 24px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: isAvailable ? "#ef4444" : "#10b981",
            color: "white",
            fontWeight: "600",
            cursor: updatingAvailability ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            minWidth: "160px"
          }}
        >
          {updatingAvailability
            ? "Updating..."
            : (isAvailable ? "Go Offline" : "Go Online")}
        </button>
      </div>


    </div>
  );
}

export default VolunteerHome;

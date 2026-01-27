import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";
import "./VolunteerHome.css";

function VolunteerHome() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeDeliveries: 0,
    completedDeliveries: 0,
    failedDeliveries: 0,
    averageRating: 0,
  });
  const [activeDeliveries, setActiveDeliveries] = useState([]);
  const [volunteerInfo, setVolunteerInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch deliveries
      const deliveriesRes = await api.get("delivery/volunteer/deliveries/");
      const deliveries = deliveriesRes.data || [];

      // Get volunteer info from local storage
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setVolunteerInfo(user);

      // Calculate stats
      const active = deliveries.filter(d => 
        ['assigned', 'en_route', 'picked'].includes(d.status)
      );
      const completed = deliveries.filter(d => d.status === 'delivered');
      const failed = deliveries.filter(d => d.status === 'failed');

      // Get volunteer ratings
      let avgRating = 0;
      try {
        const ratingsRes = await api.get("delivery/volunteer/ratings/");
        if (ratingsRes.data && ratingsRes.data.average_rating) {
          avgRating = ratingsRes.data.average_rating;
        }
      } catch (error) {
        console.log("Could not fetch ratings");
      }

      setStats({
        activeDeliveries: active.length,
        completedDeliveries: completed.length,
        failedDeliveries: failed.length,
        averageRating: avgRating,
      });

      setActiveDeliveries(active);

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (deliveryId, newStatus) => {
    try {
      await api.patch(`delivery/deliveries/${deliveryId}/status/`, {
        status: newStatus
      });
      // Refresh data
      fetchDashboardData();
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Error updating delivery status");
    }
  };

  if (loading) {
    return <div className="volunteer-home"><p>Loading dashboard...</p></div>;
  }

  return (
    <div className="volunteer-home">
      <div className="header">
        <h1>Volunteer Dashboard</h1>
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
            <h3>{stats.averageRating.toFixed(1)}</h3>
            <p>Avg Rating</p>
          </div>
        </div>
      </div>

      {/* Active Deliveries */}
      <div className="section">
        <h2>Active Deliveries</h2>
        {activeDeliveries.length > 0 ? (
          <div className="deliveries-list">
            {activeDeliveries.map(delivery => (
              <div key={delivery.id} className="delivery-card">
                <div className="delivery-header">
                  <h3>Delivery #{delivery.id}</h3>
                  <span className={`status-badge status-${delivery.status}`}>
                    {delivery.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="delivery-details">
                  <div className="detail-row">
                    <label>Item:</label>
                    <p>{delivery.donation?.item_name || "N/A"}</p>
                  </div>
                  <div className="detail-row">
                    <label>Pickup Address:</label>
                    <p>{delivery.pickup_address}</p>
                  </div>
                  <div className="detail-row">
                    <label>Drop Address:</label>
                    <p>{delivery.drop_address}</p>
                  </div>
                  <div className="detail-row">
                    <label>Scheduled Pickup:</label>
                    <p>{new Date(delivery.scheduled_pickup).toLocaleString()}</p>
                  </div>
                </div>

                <div className="delivery-actions">
                  {delivery.status === 'assigned' && (
                    <button 
                      className="btn btn-action"
                      onClick={() => handleStatusUpdate(delivery.id, 'en_route')}
                    >
                      🚗 Mark En Route
                    </button>
                  )}
                  {delivery.status === 'en_route' && (
                    <>
                      <button 
                        className="btn btn-success"
                        onClick={() => handleStatusUpdate(delivery.id, 'picked')}
                      >
                        📦 Picked Up
                      </button>
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleStatusUpdate(delivery.id, 'failed')}
                      >
                        ❌ Failed
                      </button>
                    </>
                  )}
                  {delivery.status === 'picked' && (
                    <>
                      <button 
                        className="btn btn-success"
                        onClick={() => handleStatusUpdate(delivery.id, 'delivered')}
                      >
                        ✅ Delivered
                      </button>
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleStatusUpdate(delivery.id, 'failed')}
                      >
                        ❌ Failed
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">No active deliveries. You're all caught up! 🎉</p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button 
            className="action-btn btn-primary"
            onClick={() => navigate('history')}
          >
            📜 View History
          </button>
          <button 
            className="action-btn btn-info"
            onClick={() => navigate('tasks')}
          >
            📋 View All Tasks
          </button>
        </div>
      </div>
    </div>
  );
}

export default VolunteerHome;
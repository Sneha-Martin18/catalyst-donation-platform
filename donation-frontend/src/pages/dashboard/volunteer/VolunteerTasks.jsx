import React, { useState, useEffect } from "react";
import api from "../../../api/api";
import BackButton from "../../../components/BackButton";
import OptimizedRouteModal from "../../../components/OptimizedRouteModal";
import "./VolunteerTasks.css";

function VolunteerTasks() {
  const [activeTab, setActiveTab] = useState("available"); // 'available' or 'my_task'
  const [availableTasks, setAvailableTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [error, setError] = useState("");
  const [addressModal, setAddressModal] = useState(null);
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const fetchLock = React.useRef(false);

  useEffect(() => {
    if (!fetchLock.current) {
      fetchLock.current = true;
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch Availability Status
      const availabilityRes = await api.get("receiver/volunteer/availability/");
      setIsAvailable(availabilityRes.data.is_available);

      // 2. Fetch Available Tasks (only if available)
      if (availabilityRes.data.is_available) {
        const availableRes = await api.get("receiver/volunteer/tasks/");
        setAvailableTasks(availableRes.data || []);
      } else {
        setAvailableTasks([]);
      }

      // 3. Fetch Active Task
      const activeRes = await api.get("receiver/volunteer/active-order/");
      if (activeRes.data && activeRes.data.id) {
        setActiveTask(activeRes.data);
        // If user has active task, switch to that tab by default on load
        setActiveTab("my_task");
      } else {
        setActiveTask(null);
        // If not available and no active task, make sure we aren't stuck on available tab
        if (!availabilityRes.data.is_available) {
          setActiveTab("my_task");
        }
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      // Don't show error if just 404 on active order
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityToggle = async () => {
    setUpdatingAvailability(true);
    try {
      const response = await api.patch("receiver/volunteer/availability/", {
        is_available: !isAvailable,
      });
      setIsAvailable(response.data.is_available);

      // If setting to unavailable, clear available tasks
      if (!response.data.is_available) {
        setAvailableTasks([]);
        setActiveTab("my_task");
      } else {
        // If setting to available, fetch tasks
        const availableRes = await api.get("receiver/volunteer/tasks/");
        setAvailableTasks(availableRes.data || []);
      }
    } catch (err) {
      console.error("Failed to update availability:", err);
      alert("Failed to update availability status");
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const handleAcceptTask = async (taskId) => {
    try {
      await api.post(`receiver/volunteer/tasks/${taskId}/accept/`);
      // Refresh
      fetchData();
      setActiveTab("my_task");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to accept task.");
    }
  };

  const handleStatusUpdate = async (deliveryId, newStatus) => {
    try {
      if (newStatus === 'picked_up') {
        await api.patch(`receiver/volunteer/orders/${deliveryId}/picked-up/`);
      } else if (newStatus === 'delivered') {
        await api.patch(`receiver/volunteer/orders/${deliveryId}/delivered/`);
      }
      fetchData();
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Error: " + (error.response?.data?.error || "Could not update status"));
    }
  };

  // Helper to render status badge
  const renderStatusBadge = (status) => (
    <span className={`status-badge status-${status}`}>
      {status.toUpperCase().replace("_", " ")}
    </span>
  );

  if (loading && !availableTasks.length && !activeTask) {
    return <div className="volunteer-tasks"><p>Loading tasks...</p></div>;
  }

  return (
    <div className="volunteer-tasks">
      <BackButton />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Volunteer Portal</h1>
        <button className="btn btn-muted" onClick={fetchData} disabled={loading}>🔄 Sync</button>
      </div>

      {/* AVAILABILITY TOGGLE */}
      <div style={{
        background: isAvailable ? '#f0fdf4' : '#fef2f2',
        border: `2px solid ${isAvailable ? '#10b981' : '#ef4444'}`,
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', color: isAvailable ? '#10b981' : '#dc2626' }}>
            {isAvailable ? '✅ Available for Deliveries' : '❌ Unavailable'}
          </h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
            {isAvailable ? 'You will receive delivery tasks' : 'You will not receive new delivery tasks'}
          </p>
        </div>
        <button
          onClick={handleAvailabilityToggle}
          disabled={updatingAvailability}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            background: isAvailable ? '#dc2626' : '#10b981',
            color: 'white',
            fontWeight: '600',
            cursor: updatingAvailability ? 'not-allowed' : 'pointer',
            opacity: updatingAvailability ? 0.7 : 1
          }}
        >
          {updatingAvailability ? '⏳ Updating...' : (isAvailable ? 'Set Unavailable' : 'Set Available')}
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '20px', borderBottom: '2px solid #eee' }}>
        {isAvailable && (
          <button
            className={`tab-btn ${activeTab === "available" ? "active" : ""}`}
            onClick={() => setActiveTab("available")}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'available' ? '3px solid #10b981' : 'none',
              color: activeTab === 'available' ? '#10b981' : '#666',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Available Tasks ({availableTasks.length})
          </button>
        )}
        <button
          className={`tab-btn ${activeTab === "my_task" ? "active" : ""}`}
          onClick={() => setActiveTab("my_task")}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'my_task' ? '3px solid #10b981' : 'none',
            color: activeTab === 'my_task' ? '#10b981' : '#666',
            fontWeight: '600',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          My Active Delivery {activeTask ? '(1)' : ''}
        </button>
      </div>

      {/* AVAILABLE TASKS TAB */}
      {activeTab === "available" && isAvailable && (
        <div className="tab-content">
          {availableTasks.length > 0 ? (
            <div className="tasks-container">
              <table className="tasks-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Locations</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {availableTasks.map(task => (
                    <tr key={task.id} className="task-row">
                      <td className="task-item">
                        <strong>{task.donation_item}</strong>
                        <br /><small>Quantity: {task.donation_quantity}</small>
                      </td>
                      <td>{task.donation_category}</td>
                      <td>
                        <button
                          style={{
                            background: 'none',
                            border: '1px solid #10b981',
                            color: '#10b981',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '500'
                          }}
                          onClick={() => setAddressModal({
                            pickupAddress: task.pickup_address,
                            dropAddress: task.drop_address,
                            receiverName: task.receiver_name,
                            itemName: task.donation_item
                          })}
                        >
                          📍 View Details
                        </button>
                      </td>
                      <td>
                        <button
                          className="btn btn-action"
                          onClick={() => handleAcceptTask(task.id)}
                        >
                          ✋ Accept
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="empty-state">No tasks available right now. Thank you for checking! 🌟</p>
          )}
        </div>
      )}

      {/* MY ACTIVE TASK TAB */}
      {activeTab === "my_task" && (
        <div className="tab-content">
          {activeTask ? (
            <div className="active-task-card" style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Current Delivery</h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    onClick={() => setRouteModalOpen(true)}
                    style={{
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    🚀 Optimize My Route
                  </button>
                  {renderStatusBadge(activeTask.status)}
                </div>
              </div>

              <div className="task-details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="detail-group">
                  <h4>📦 Item Details</h4>
                  <p><strong>Item:</strong> {activeTask.donation_item}</p>
                  <p><strong>Category:</strong> {activeTask.donation_category}</p>
                  <p><strong>Quantity:</strong> {activeTask.donation_quantity}</p>
                </div>

                <div className="detail-group">
                  <h4>📍 Pickup (Donor)</h4>
                  <button
                    style={{
                      background: '#f0f9ff',
                      padding: '10px 15px',
                      borderRadius: '6px',
                      border: '1px solid #0284c7',
                      color: '#0284c7',
                      cursor: 'pointer',
                      fontWeight: '500',
                      width: '100%',
                      textAlign: 'left'
                    }}
                    onClick={() => setAddressModal({
                      pickupAddress: activeTask.pickup_address,
                      dropAddress: activeTask.drop_address,
                      receiverName: activeTask.receiver_name,
                      itemName: activeTask.donation_item,
                      type: 'full'
                    })}
                  >
                    {activeTask.pickup_address || "Address hidden until accepted"} 📍
                  </button>
                </div>

                <div className="detail-group">
                  <h4>🏠 Dropoff (Receiver: {activeTask.receiver_name})</h4>
                  <button
                    style={{
                      background: '#f0fdf4',
                      padding: '10px 15px',
                      borderRadius: '6px',
                      border: '1px solid #16a34a',
                      color: '#16a34a',
                      cursor: 'pointer',
                      fontWeight: '500',
                      width: '100%',
                      textAlign: 'left'
                    }}
                    onClick={() => setAddressModal({
                      pickupAddress: activeTask.pickup_address,
                      dropAddress: activeTask.drop_address,
                      receiverName: activeTask.receiver_name,
                      itemName: activeTask.donation_item,
                      type: 'full'
                    })}
                  >
                    {activeTask.drop_address || "Address hidden until picked up"} 🏠
                  </button>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="task-actions" style={{ borderTop: '1px solid #eee', paddingTop: '20px', display: 'flex', gap: '15px' }}>
                {activeTask.status === 'assigned' && (
                  <button
                    className="btn btn-action"
                    onClick={() => handleStatusUpdate(activeTask.id, 'picked_up')}
                  >
                    📦 Mark as Picked Up
                  </button>
                )}

                {activeTask.status === 'picked_up' && (
                  <button
                    className="btn btn-success"
                    onClick={() => handleStatusUpdate(activeTask.id, 'delivered')}
                  >
                    ✅ Mark as Delivered
                  </button>
                )}

                {activeTask.status === 'delivered' && (
                  <p className="text-success">✅ This delivery is completed. Great job!</p>
                )}
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>You don't have any active deliveries.</p>
            </div>
          )}
        </div>
      )}

      {/* ADDRESS MODAL */}
      {addressModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#2c3e50' }}>📍 Address Details</h2>

            <div style={{ background: '#f0f9ff', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
              <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '0.9rem' }}>
                <strong>Item:</strong> {addressModal.itemName}
              </p>
            </div>

            <div style={{ background: '#f0f9ff', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '2px solid #0284c7' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#0284c7' }}>📦 Pickup Location (Donor)</h4>
              <p style={{ margin: 0, fontSize: '1rem', color: '#2c3e50', lineHeight: '1.6' }}>
                {addressModal.pickupAddress || "No pickup address provided"}
              </p>
            </div>

            {addressModal.dropAddress && (
              <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '8px', marginBottom: '15px', border: '2px solid #16a34a' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#16a34a' }}>🏠 Dropoff Location (Receiver)</h4>
                <p style={{ margin: 0, fontSize: '1rem', color: '#2c3e50', lineHeight: '1.6' }}>
                  {addressModal.dropAddress}
                </p>
                <p style={{ margin: '10px 0 0 0', fontSize: '0.9rem', color: '#666' }}>
                  <strong>Receiver:</strong> {addressModal.receiverName}
                </p>
              </div>
            )}

            <button
              onClick={() => setAddressModal(null)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
      <OptimizedRouteModal
        isOpen={routeModalOpen}
        onClose={() => setRouteModalOpen(false)}
      />
    </div>
  );
}

export default VolunteerTasks;
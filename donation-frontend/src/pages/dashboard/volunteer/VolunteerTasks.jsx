import React, { useState, useEffect } from "react";
import api from "../../../api/api";
import "./VolunteerTasks.css";

function VolunteerTasks() {
  const [allDeliveries, setAllDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [sortBy, setSortBy] = useState('scheduled');
  const [sortedDeliveries, setSortedDeliveries] = useState([]);

  useEffect(() => {
    fetchAllTasks();
  }, []);

  useEffect(() => {
    applySort();
  }, [sortBy, allDeliveries]);

  const fetchAllTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get("delivery/volunteer/deliveries/");
      setAllDeliveries(res.data || []);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const applySort = () => {
    let sorted = [...allDeliveries];
    
    if (sortBy === 'scheduled') {
      sorted.sort((a, b) => new Date(a.scheduled_pickup) - new Date(b.scheduled_pickup));
    } else if (sortBy === 'status') {
      const statusOrder = { 'assigned': 0, 'en_route': 1, 'picked': 2, 'delivered': 3, 'failed': 4 };
      sorted.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
    } else if (sortBy === 'recent') {
      sorted.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
    }
    
    setSortedDeliveries(sorted);
  };

  const handleStatusUpdate = async (deliveryId, newStatus) => {
    try {
      await api.patch(`delivery/deliveries/${deliveryId}/status/`, {
        status: newStatus
      });
      fetchAllTasks();
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Error: " + (error.response?.data?.error || "Could not update status"));
    }
  };

  const getStatusActions = (status) => {
    const actions = {
      'assigned': [{ label: '🚗 Mark En Route', status: 'en_route', className: 'btn-info' }],
      'en_route': [
        { label: '📦 Picked Up', status: 'picked', className: 'btn-success' },
        { label: '❌ Failed', status: 'failed', className: 'btn-danger' }
      ],
      'picked': [
        { label: '✅ Delivered', status: 'delivered', className: 'btn-success' },
        { label: '❌ Failed', status: 'failed', className: 'btn-danger' }
      ],
      'delivered': [{ label: '✅ Completed', status: 'delivered', className: 'btn-disabled', disabled: true }],
      'failed': [{ label: '❌ Failed', status: 'failed', className: 'btn-disabled', disabled: true }]
    };
    return actions[status] || [];
  };

  if (loading) {
    return <div className="volunteer-tasks"><p>Loading tasks...</p></div>;
  }

  return (
    <div className="volunteer-tasks">
      <h1>All Assigned Tasks</h1>

      {/* Sort Controls */}
      <div className="controls">
        <div className="sort-controls">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="scheduled">Scheduled Time</option>
            <option value="status">Status</option>
            <option value="recent">Recently Updated</option>
          </select>
        </div>
        <p className="total-tasks">Total Tasks: {sortedDeliveries.length}</p>
      </div>

      {/* Tasks Table */}
      {sortedDeliveries.length > 0 ? (
        <div className="tasks-container">
          <div className="tasks-table-wrapper">
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Item</th>
                  <th>Status</th>
                  <th>Scheduled Pickup</th>
                  <th>From → To</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedDeliveries.map(delivery => (
                  <React.Fragment key={delivery.id}>
                    <tr 
                      className={`task-row status-${delivery.status}`}
                      onClick={() => setExpandedId(expandedId === delivery.id ? null : delivery.id)}
                    >
                      <td className="task-id">#{delivery.id}</td>
                      <td className="task-item">{delivery.donation?.item_name || 'N/A'}</td>
                      <td>
                        <span className={`status-badge status-${delivery.status}`}>
                          {delivery.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="task-time">
                        {new Date(delivery.scheduled_pickup).toLocaleString()}
                      </td>
                      <td className="task-route">
                        <span className="route-short">{delivery.pickup_address.substring(0, 15)}... → {delivery.drop_address.substring(0, 15)}...</span>
                      </td>
                      <td>
                        <div className="action-cell">
                          {getStatusActions(delivery.status).length > 0 && (
                            <button className="expand-btn">
                              {expandedId === delivery.id ? '▼' : '▶'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {expandedId === delivery.id && (
                      <tr className="expanded-row">
                        <td colSpan="6">
                          <div className="expanded-content">
                            <div className="expanded-grid">
                              <div className="expanded-section">
                                <h4>📍 Pickup Location</h4>
                                <p>{delivery.pickup_address}</p>
                                {delivery.actual_pickup && (
                                  <p className="timestamp">Picked at: {new Date(delivery.actual_pickup).toLocaleString()}</p>
                                )}
                              </div>

                              <div className="expanded-section">
                                <h4>🏠 Drop Location</h4>
                                <p>{delivery.drop_address}</p>
                                {delivery.actual_delivery && (
                                  <p className="timestamp">Delivered at: {new Date(delivery.actual_delivery).toLocaleString()}</p>
                                )}
                              </div>

                              <div className="expanded-section">
                                <h4>📦 Item Details</h4>
                                <p><strong>Category:</strong> {delivery.donation?.category || 'N/A'}</p>
                                <p><strong>Quantity:</strong> {delivery.donation?.quantity || 'N/A'}</p>
                                <p><strong>Condition:</strong> {delivery.donation?.condition || 'N/A'}</p>
                              </div>

                              {delivery.failure_reason && (
                                <div className="expanded-section failure">
                                  <h4>⚠️ Failure Reason</h4>
                                  <p>{delivery.failure_reason}</p>
                                </div>
                              )}
                            </div>

                            <div className="expanded-actions">
                              {getStatusActions(delivery.status).map(action => (
                                <button
                                  key={action.status}
                                  className={`btn btn-action ${action.className}`}
                                  onClick={() => handleStatusUpdate(delivery.id, action.status)}
                                  disabled={action.disabled || false}
                                >
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <p className="empty-state">No tasks assigned yet. Check back soon! 🚀</p>
      )}

      {/* Stats Summary */}
      <div className="stats-summary">
        <h3>Task Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="count">{allDeliveries.filter(d => d.status === 'assigned').length}</span>
            <span className="label">Assigned</span>
          </div>
          <div className="summary-item">
            <span className="count">{allDeliveries.filter(d => d.status === 'en_route').length}</span>
            <span className="label">En Route</span>
          </div>
          <div className="summary-item">
            <span className="count">{allDeliveries.filter(d => d.status === 'picked').length}</span>
            <span className="label">Picked</span>
          </div>
          <div className="summary-item">
            <span className="count">{allDeliveries.filter(d => d.status === 'delivered').length}</span>
            <span className="label">Delivered</span>
          </div>
          <div className="summary-item">
            <span className="count">{allDeliveries.filter(d => d.status === 'failed').length}</span>
            <span className="label">Failed</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VolunteerTasks;
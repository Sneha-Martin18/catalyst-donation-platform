import { useState, useEffect } from "react";
import api from "../../../api/api";
import BackButton from "../../../components/BackButton";
import Pagination from "../../../components/Pagination";
import "./VolunteerHistory.css";

function VolunteerHistory() {
  const [deliveries, setDeliveries] = useState([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchDeliveryHistory(page);
  }, [page]);

  useEffect(() => {
    applyFilter();
  }, [filter, deliveries]);

  const fetchDeliveryHistory = async (currentPage = 1) => {
    try {
      setLoading(true);
      const res = await api.get(`receiver/volunteer/history/?page=${currentPage}`);
      if (res.data.results) {
        setDeliveries(res.data.results);
        setTotalCount(res.data.count);
      } else {
        setDeliveries(res.data || []);
        setTotalCount(res.data.length || 0);
      }
    } catch (error) {
      console.error("Failed to fetch delivery history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const applyFilter = () => {
    if (filter === 'all') {
      setFilteredDeliveries(deliveries);
    } else if (filter === 'completed') {
      setFilteredDeliveries(deliveries.filter(d => d.status === 'delivered'));
    } else if (filter === 'failed') {
      setFilteredDeliveries(deliveries.filter(d => d.status === 'canceled'));
    }
  };

  const getDeliveryTimeline = (delivery) => {
    const timeline = [];

    if (delivery.status) timeline.push({ status: delivery.status, time: delivery.updated_at });
    if (delivery.actual_pickup) timeline.push({ status: 'picked', time: delivery.actual_pickup });
    if (delivery.actual_delivery) timeline.push({ status: 'delivered', time: delivery.actual_delivery });

    return timeline.sort((a, b) => new Date(a.time) - new Date(b.time));
  };

  if (loading) {
    return <div className="volunteer-history"><p>Loading history...</p></div>;
  }

  return (
    <div className="volunteer-history">
      <div className="header">
        <BackButton />
        <h1>Delivery History</h1>
      </div>

      {/* Filter Buttons */}
      <div className="filter-buttons">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({deliveries.length})
        </button>
        <button
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed ({deliveries.filter(d => d.status === 'delivered').length})
        </button>
        <button
          className={`filter-btn ${filter === 'failed' ? 'active' : ''}`}
          onClick={() => setFilter('failed')}
        >
          Failed ({deliveries.filter(d => d.status === 'failed').length})
        </button>
      </div>

      {/* Deliveries List */}
      {filteredDeliveries.length > 0 ? (
        <div className="deliveries-grid">
          {filteredDeliveries.map(delivery => (
            <div
              key={delivery.id}
              className="delivery-card"
              onClick={() => setSelectedDelivery(selectedDelivery?.id === delivery.id ? null : delivery)}
            >
              <div className="card-header">
                <h3>Delivery #{delivery.id}</h3>
                <span className={`status-badge status-${delivery.status}`}>
                  {delivery.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className="card-body">
                <p><strong>Item:</strong> {delivery.donation?.item_name || 'N/A'}</p>
                <p><strong>Date:</strong> {new Date(delivery.updated_at).toLocaleDateString()}</p>
                <p><strong>Receiver:</strong> {delivery.receiver_name || 'N/A'}</p>
              </div>

              {selectedDelivery?.id === delivery.id && (
                <div className="card-expanded">
                  <h4>Full Details</h4>

                  <div className="detail-section">
                    <h5>Pickup Location</h5>
                    <p>{delivery.donation?.pickup_address || 'N/A'}</p>
                  </div>

                  <div className="detail-section">
                    <h5>Delivery Location</h5>
                    <p>{delivery.drop_address || delivery.receiver_name + "'s Address"}</p>
                  </div>

                  {delivery.failure_reason && (
                    <div className="detail-section failure">
                      <h5>Failure Reason</h5>
                      <p>{delivery.failure_reason}</p>
                    </div>
                  )}

                  <div className="detail-section">
                    <h5>Item Details</h5>
                    <p><strong>Quantity:</strong> {delivery.donation?.quantity || 'N/A'}</p>
                    <p><strong>Condition:</strong> {delivery.donation?.condition || 'N/A'}</p>
                    {delivery.donation?.used_duration_months && (
                      <p><strong>Used for:</strong> {delivery.donation.used_duration_months} months</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-state">No deliveries found for this filter.</p>
      )}

      {deliveries.length > 0 && (
        <Pagination
          currentPage={page}
          totalPages={Math.ceil(totalCount / 10)}
          onPageChange={handlePageChange}
        />
      )}

      {/* Legend */}
      <div className="legend">
        <h4>Status Reference</h4>
        <div className="legend-items">
          <div><span className="badge assigned">Assigned</span> - Delivery assigned to you</div>
          <div><span className="badge picked">Picked Up</span> - Item picked up</div>
          <div><span className="badge delivered">Delivered</span> - Successfully delivered</div>
          <div><span className="badge failed">Canceled</span> - Order canceled</div>
        </div>
      </div>
    </div>
  );
}

export default VolunteerHistory;
import { useState } from "react";

function ItemCard({ item, type = "donation" }) {
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = (status) => {
    const colors = {
      pending: "#ffc107",
      approved: "#28a745",
      verified: "#28a745",
      completed: "#17a2b8",
      delivered: "#007bff",
      rejected: "#dc3545",
    };
    return colors[status] || "#6c757d";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="item-card" style={{ borderLeftColor: getStatusColor(item.status) }}>
      <div className="item-card-header">
        <div className="item-card-title">
          {/* Image Preview */}
          {item.images && item.images.length > 0 && (
            <div className="item-image-preview">
              <img
                src={item.images[0].image_url || item.images[0]}
                alt={item.item_name}
                className="preview-image"
              />
            </div>
          )}
          <div className="item-info">
            <h4>{item.item_name}</h4>
            <span
              className={`status-badge ${item.status}`}
              style={{ backgroundColor: getStatusColor(item.status) }}
            >
              {item.status}
            </span>
          </div>
        </div>
        <button
          className="expand-btn"
          onClick={() => setExpanded(!expanded)}
          title={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? "▼" : "▶"}
        </button>
      </div>

      <div className="item-card-summary">
        <div className="summary-item">
          <span className="summary-icon">📁</span>
          <span className="summary-label">Category:</span>
          <span className="summary-value">{item.category}</span>
        </div>
        <div className="summary-item">
          <span className="summary-icon">📦</span>
          <span className="summary-label">Qty:</span>
          <span className="summary-value">{item.quantity}</span>
        </div>
        <div className="summary-item">
          <span className="summary-icon">🏷️</span>
          <span className="summary-label">Condition:</span>
          <span className="summary-value">{item.condition || "N/A"}</span>
        </div>
        <div className="summary-item">
          <span className="summary-icon">📅</span>
          <span className="summary-label">Date:</span>
          <span className="summary-value">{formatDate(item.created_at)}</span>
        </div>
      </div>

      {expanded && (
        <div className="item-card-details">
          {item.description && (
            <div className="detail-row">
              <strong>Description:</strong>
              <p>{item.description}</p>
            </div>
          )}
          {item.images && item.images.length > 0 && (
            <div className="detail-row">
              <strong>Images:</strong>
              <div className="images-gallery">
                {item.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img.image_url || img}
                    alt={`Item ${idx + 1}`}
                    className="gallery-image"
                  />
                ))}
              </div>
            </div>
          )}
          {item.address && (
            <div className="detail-row">
              <strong>Location:</strong>
              <p>{item.address}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ItemCard;

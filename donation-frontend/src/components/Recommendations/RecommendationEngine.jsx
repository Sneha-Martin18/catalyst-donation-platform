import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import "./RecommendationEngine.css";

function RecommendationEngine() {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("recommendations");
  const [selectedDonation, setSelectedDonation] = useState(null);

  useEffect(() => {
    fetchRecommendations();
    fetchInsights();
  }, []);

  const fetchRecommendations = async () => {
    try {
      const res = await api.get("analytics/recommendations/?limit=12");
      setRecommendations(res.data.recommendations);
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
      setError("Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  };

  const fetchInsights = async () => {
    try {
      const res = await api.get("analytics/receiver-insights/");
      setInsights(res.data);
    } catch (err) {
      console.error("Failed to fetch insights:", err);
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
    return labels[condition] || condition?.replace(/_/g, " ");
  };

  if (loading) {
    return <div className="rec-loading">⏳ Analyzing your preferences...</div>;
  }

  return (
    <div className="recommendation-engine">
      <div className="rec-header">
        <h2>🤖 AI-Powered Recommendations</h2>
        <p>Based on your request history</p>
      </div>

      {/* Tabs */}
      <div className="rec-tabs">
        <button
          className={`tab ${activeTab === "recommendations" ? "active" : ""} `}
          onClick={() => setActiveTab("recommendations")}
        >
          💡 For You
        </button>
        <button
          className={`tab ${activeTab === "insights" ? "active" : ""} `}
          onClick={() => setActiveTab("insights")}
        >
          📊 Your Profile
        </button>
      </div>

      {/* Recommendations Tab */}
      {activeTab === "recommendations" && (
        <div className="rec-content">
          {error ? (
            <div className="rec-error">{error}</div>
          ) : recommendations.length > 0 ? (
            <div className="rec-grid">
              {recommendations.map((donation) => (
                <div key={donation.id} className="rec-card">
                  {/* Image */}
                  <div className="rec-image">
                    {donation.images && donation.images.length > 0 ? (
                      <img
                        src={donation.images[0].image_url}
                        alt={donation.item_name}
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/240x180?text=No+Image";
                        }}
                      />
                    ) : (
                      <div className="rec-no-image">📷</div>
                    )}
                    <div className="rec-badge">AI ✨</div>
                  </div>

                  {/* Content */}
                  <div className="rec-body">
                    <h3>{donation.item_name}</h3>
                    <p className="rec-category">📦 {donation.category}</p>
                    <p className="rec-condition">
                      Condition: {getConditionLabel(donation.condition)}
                    </p>
                    <p className="rec-quantity">Qty: {donation.quantity}</p>
                    <p className="rec-description">
                      {donation.description?.substring(0, 80)}...
                    </p>
                  </div>

                  {/* Action */}
                  <button className="rec-btn-request" onClick={() => setSelectedDonation(donation)}>
                    View More
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rec-empty">
              <p>📭 No recommendations yet. Make some requests to get personalized suggestions!</p>
            </div>
          )}
        </div>
      )}

      {/* Insights Tab */}
      {activeTab === "insights" && insights && (
        <div className="rec-insights">
          {/* ... Insights Grid (Unchanged) ... */}
          <div className="insights-section">
            <h3>📋 Your Preferences</h3>
            {insights.profile ? (
              <div className="insights-grid">
                <div className="insight-card">
                  <span className="insight-label">Favorite Categories</span>
                  <div className="insight-values">
                    {insights.profile.preferred_categories.map((cat, idx) => (
                      <span key={idx} className="insight-tag">
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="insight-card">
                  <span className="insight-label">Preferred Conditions</span>
                  <div className="insight-values">
                    {insights.profile.preferred_conditions.map((cond, idx) => (
                      <span key={idx} className="insight-tag">
                        {getConditionLabel(cond)}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="insight-card">
                  <span className="insight-label">Total Requests</span>
                  <div className="insight-value">{insights.profile.request_count}</div>
                </div>

                <div className="insight-card">
                  <span className="insight-label">Avg Quantity</span>
                  <div className="insight-value">{Math.round(insights.profile.avg_quantity)}</div>
                </div>
              </div>
            ) : (
              <p>Make some requests to see your preference profile</p>
            )}
          </div>

          <div className="insights-section">
            <h3>🔥 Trending Now</h3>
            <div className="trending-list">
              {insights.trending_categories.map((item, idx) => (
                <div key={idx} className="trending-item">
                  <span className="trending-rank">#{idx + 1}</span>
                  <span className="trending-category">{item.category}</span>
                  <span className="trending-count">{item.available_count} available</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedDonation && (
        <div className="modal-overlay" onClick={() => setSelectedDonation(null)}>
          <div className="order-details-modal rec-detail-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header-rec" style={{ position: 'relative', marginBottom: '20px' }}>
              <button
                className="close-btn"
                onClick={() => setSelectedDonation(null)}
                style={{ position: 'absolute', right: '-10px', top: '-10px', background: '#f1f5f9', borderRadius: '50%', width: '30px', height: '30px', border: 'none', cursor: 'pointer' }}
              >✕</button>
              <h2 style={{ color: '#333', fontSize: '1.5rem', fontWeight: '700' }}>Item Details</h2>
            </div>

            <div className="rec-modal-content">
              <div className="rec-modal-img" style={{ height: '200px', width: '100%', background: '#f8fafc', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {selectedDonation.images?.length > 0 ? (
                  <img src={selectedDonation.images[0].image_url} alt={selectedDonation.item_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ fontSize: '3rem' }}>📦</div>
                )}
              </div>

              <div className="rec-modal-info">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div>
                    <span style={{ color: '#059669', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>{selectedDonation.category}</span>
                    <h3 style={{ fontSize: '1.4rem', color: '#1e293b', marginTop: '4px' }}>{selectedDonation.item_name}</h3>
                  </div>
                  <div style={{ background: '#f0fdf4', color: '#16a34a', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' }}>
                    Qty: {selectedDonation.quantity}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '8px', fontSize: '0.85rem', color: '#64748b' }}>
                    <strong>Condition:</strong> {getConditionLabel(selectedDonation.condition)}
                  </div>
                </div>

                <div className="rec-modal-desc" style={{ padding: '15px', background: '#f8fafc', borderRadius: '10px', marginBottom: '25px' }}>
                  <h4 style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '8px' }}>About this item</h4>
                  <p style={{ fontSize: '0.95rem', color: '#64748b', lineHeight: '1.6' }}>{selectedDonation.description || "No description provided."}</p>
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                  <button
                    className="btn-view-details"
                    onClick={() => setSelectedDonation(null)}
                    style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Close
                  </button>
                  <button
                    className="btn-mark-received-large"
                    onClick={() => {
                      navigate(`/dashboard/user/browse?search=${encodeURIComponent(selectedDonation.item_name)}`);
                    }}
                    style={{ flex: 2, padding: '12px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: 'white', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)' }}
                  >
                    Go Request Item
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecommendationEngine;

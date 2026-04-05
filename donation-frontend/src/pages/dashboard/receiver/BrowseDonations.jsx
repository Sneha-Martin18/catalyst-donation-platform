import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../../api/api";
import BackButton from "../../../components/BackButton";
import Pagination from "../../../components/Pagination";
import "./BrowseDonations.css";

function BrowseDonations() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get("category") || "all";
  const initialSearch = searchParams.get("search") || "";

  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [filterCategory, setFilterCategory] = useState(initialCategory);
  const [categories, setCategories] = useState([]);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [deliveryType, setDeliveryType] = useState("volunteer");
  const [dropAddress, setDropAddress] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [successMessage, setSuccessMessage] = useState(null);
  const [successOrder, setSuccessOrder] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  /* =========================
     SYNC PARAMS WITH STATE
  ========================= */
  useEffect(() => {
    setSearchTerm(searchParams.get("search") || "");
    setFilterCategory(searchParams.get("category") || "all");
    setPage(1); // Reset page on param change
  }, [searchParams]);

  /* =========================
     FETCH DONATIONS
  ========================= */
  const fetchDonations = async (currentPage = 1) => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`donation/available/?page=${currentPage}&search=${searchTerm}&category=${filterCategory}`);

      if (response.data.results) {
        setDonations(response.data.results);
        setTotalCount(response.data.count);
      } else {
        setDonations(response.data);
        setTotalCount(response.data.length);
      }

    } catch (err) {
      console.error("Failed to fetch donations:", err);
      setError("Failed to load donations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations(page);
  }, [page, searchTerm, filterCategory]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* =========================
     ORDER HANDLING
  ========================= */
  const handleCreateOrder = (donation) => {
    setSelectedDonation(donation);
    setDeliveryType("volunteer");
    setDropAddress("");
  };

  const confirmCreateOrder = async () => {
    if (!selectedDonation) return;

    try {
      const response = await api.post("receiver/orders/", {
        donation: selectedDonation.id,
        delivery_type: deliveryType,
        drop_address: deliveryType === "volunteer" ? dropAddress : "",
      });

      // Show success card and store order details
      setSuccessMessage(true);
      setSuccessOrder(response.data);

      // Auto-close success card after 5 seconds and refresh
      setTimeout(() => {
        setSuccessMessage(false);
        setSelectedDonation(null);
        setDropAddress("");
        fetchDonations();
      }, 5000);
    } catch (err) {
      alert(
        err.response?.data?.error ||
        "Failed to create order. Please try again."
      );
    }
  };

  /* =========================
     HELPERS
  ========================= */
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

  /* =========================
     RENDER
  ========================= */
  if (loading) {
    return (
      <div className="browse-donations">
        <h1>Browse Available Donations</h1>
        <p className="loading">Loading donations...</p>
      </div>
    );
  }

  return (
    <div className="browse-donations">
      <BackButton />
      <div className="page-header">
        <h1>Browse Available Donations</h1>
        <p className="subtitle">
          Find items being donated by generous donors
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* SEARCH & FILTER */}
      <div className="search-filter-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by item name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-section">
          <div className="custom-dropdown-wrapper">
            <button
              className="filter-icon-btn"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              title="Filter by Category"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="filter-icon-svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="custom-dropdown-menu">
                <div
                  className={`dropdown-item ${filterCategory === 'all' ? 'active' : ''}`}
                  onClick={() => { setFilterCategory("all"); setPage(1); setIsDropdownOpen(false); }}
                >
                  All Categories ({totalCount})
                </div>
                {["Accessories", "Books", "Clothing", "Electronics", "Food", "Furniture", "Medical", "Stationary", "Toys"].sort().map((cat) => (
                  <div
                    key={cat}
                    className={`dropdown-item ${filterCategory === cat ? 'active' : ''}`}
                    onClick={() => { setFilterCategory(cat); setPage(1); setIsDropdownOpen(false); }}
                  >
                    {cat}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DONATIONS GRID */}
      {donations.length > 0 ? (
        <>
          <div className="donations-grid">
            {donations.map((donation) => (
              <div key={donation.id} className="donation-card-modern">
                <div className="card-image-container">
                  {donation.images?.length > 0 ? (
                    <img
                      src={donation.images[0].image_url}
                      alt={donation.item_name}
                    />
                  ) : (
                    <div className="no-image-placeholder">📦</div>
                  )}

                  <div className="card-overlay">
                    <button
                      className="btn-overlay btn-details"
                      onClick={() => setSelectedDonation(donation)} // Use single state for detail modal
                    >
                      LEARN MORE
                    </button>
                    <button
                      className="btn-overlay btn-request"
                      onClick={() => handleCreateOrder(donation)}
                    >
                      REQUEST ITEM
                    </button>
                  </div>
                </div>

                <div className="card-info">
                  <div className="card-category">{donation.category}</div>
                  <h3 className="card-title">{donation.item_name}</h3>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={Math.ceil(totalCount / 10)}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h2>No donations found</h2>
          <p>
            {searchTerm || filterCategory !== "all"
              ? "No donations match your search. Try different filters."
              : "No donations are currently available."}
          </p>
        </div>
      )}

      {/* DETAIL MODAL (Reusing modal structure, switching content based on context) */}
      {selectedDonation && (
        <div className="modal-overlay" onClick={() => setSelectedDonation(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Item Details</h2>
              <button
                className="close-btn"
                onClick={() => setSelectedDonation(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body product-modal-body">
              <div className="product-modal-image-container">
                {selectedDonation.images?.length > 0 ? (
                  <img src={selectedDonation.images[0].image_url} alt={selectedDonation.item_name} className="product-modal-image" />
                ) : (
                  <div className="no-image-placeholder">📦</div>
                )}
              </div>

              <div className="product-modal-info">
                <div className="product-modal-header-group">
                  <h3 className="product-modal-title">{selectedDonation.item_name}</h3>
                  <p className="product-modal-category">{selectedDonation.category}</p>
                </div>

                <div className="product-specs-grid">
                  <div className="spec-item">
                    <span className="spec-label">Condition</span>
                    <span className="spec-value">{getConditionLabel(selectedDonation.condition)}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Quantity</span>
                    <span className="spec-value">{selectedDonation.quantity} unit(s)</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Posted</span>
                    <span className="spec-value">{new Date(selectedDonation.created_at).toLocaleDateString()}</span>
                  </div>
                  {selectedDonation.used_duration_months && (
                    <div className="spec-item">
                      <span className="spec-label">Used For</span>
                      <span className="spec-value">{selectedDonation.used_duration_months} months</span>
                    </div>
                  )}
                </div>

                <div className="product-modal-description">
                  <h4>About this item</h4>
                  <p>{selectedDonation.description || "No description provided by the donor."}</p>
                </div>

                <div className="delivery-selection-section" style={{ marginTop: "25px", borderTop: "1px solid #efefef", paddingTop: "20px" }}>
                  <h4 style={{ margin: "0 0 15px 0", fontSize: "1.1rem" }}>How would you like to receive this?</h4>
                  <div style={{ display: "flex", gap: "15px", marginBottom: "20px" }}>
                    <div
                      onClick={() => setDeliveryType("self_pickup")}
                      style={{
                        flex: 1, padding: "12px", borderRadius: "10px", border: "2px solid", cursor: "pointer",
                        transition: "all 0.2s ease", textAlign: "center",
                        borderColor: deliveryType === "self_pickup" ? "#b0c924" : "#eee",
                        backgroundColor: deliveryType === "self_pickup" ? "#fafff0" : "white"
                      }}
                    >
                      <span style={{ fontSize: "20px", display: "block" }}>🏠</span>
                      <strong style={{ fontSize: "0.85rem", display: "block", marginTop: "4px" }}>Self Pickup</strong>
                    </div>
                    <div
                      onClick={() => setDeliveryType("volunteer")}
                      style={{
                        flex: 1, padding: "12px", borderRadius: "10px", border: "2px solid", cursor: "pointer",
                        transition: "all 0.2s ease", textAlign: "center",
                        borderColor: deliveryType === "volunteer" ? "#b0c924" : "#eee",
                        backgroundColor: deliveryType === "volunteer" ? "#fafff0" : "white"
                      }}
                    >
                      <span style={{ fontSize: "20px", display: "block" }}>🚲</span>
                      <strong style={{ fontSize: "0.85rem", display: "block", marginTop: "4px" }}>Volunteer</strong>
                    </div>
                  </div>

                  {deliveryType === "volunteer" && (
                    <div className="form-group" style={{ marginBottom: "15px" }}>
                      <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#666", display: "block", marginBottom: "5px" }}>Delivery Address</label>
                      <textarea
                        rows="2"
                        className="form-control"
                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem" }}
                        placeholder="Leave blank to use profile address"
                        value={dropAddress}
                        onChange={(e) => setDropAddress(e.target.value)}
                      />
                    </div>
                  )}

                  {deliveryType === "self_pickup" && (
                    <div style={{ padding: "15px", backgroundColor: "#fffbeb", borderRadius: "8px", border: "2px solid #f59e0b", marginTop: "10px" }}>
                      <p style={{ margin: "0 0 10px 0", fontSize: "0.85rem", fontWeight: "600", color: "#d97706", textTransform: "uppercase" }}>
                        📍 Pickup Location (Donor)
                      </p>
                      <div style={{
                        padding: "12px",
                        background: "white",
                        borderRadius: "6px",
                        border: "1px solid #fcd34d",
                        fontSize: "0.95rem",
                        color: "#2c3e50",
                        lineHeight: "1.6",
                        fontWeight: "500"
                      }}>
                        {selectedDonation.donor_address || "Address not provided"}
                      </div>
                      <p style={{ margin: "10px 0 0 0", fontSize: "0.85rem", color: "#92400e" }}>
                        Please coordinate with the donor for pickup timing
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-cancel"
                onClick={() => setSelectedDonation(null)}
              >
                Close
              </button>
              <button
                className="btn btn-confirm"
                onClick={confirmCreateOrder}
              >
                Request This Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS CARD */}
      {successMessage && (
        <div className="modal-overlay">
          <div className="success-card">
            <div className="success-card-icon">✅</div>
            <h2 className="success-card-title">Order Created Successfully!</h2>
            <p className="success-card-subtitle">
              Your order for <strong>{selectedDonation?.item_name}</strong> has been created.
            </p>

            <div className="success-card-details">
              <div className="detail-row">
                <span className="detail-label">Order ID:</span>
                <span className="detail-value">#{successOrder?.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Item:</span>
                <span className="detail-value">{selectedDonation?.item_name}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className="detail-value" style={{ color: "#16a34a" }}>Pending Approval</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Delivery Method:</span>
                <span className="detail-value">
                  {deliveryType === "volunteer" ? "🚴 Volunteer Pickup" : "🏠 Self Pickup"}
                </span>
              </div>
            </div>

            <p className="success-card-message">
              📧 A confirmation email has been sent to your registered email address.
            </p>

            <button
              onClick={() => {
                setSuccessMessage(false);
                setSelectedDonation(null);
                setDropAddress("");
                fetchDonations();
              }}
              className="btn btn-confirm"
              style={{ width: "100%" }}
            >
              Continue Browsing
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BrowseDonations;

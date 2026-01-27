import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../../api/api";
import "./BrowseDonations.css";

function BrowseDonations() {
  const [donations, setDonations] = useState([]);
  const [filteredDonations, setFilteredDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);

  useEffect(() => {
    fetchDonations();
  }, []);

  useEffect(() => {
    filterDonations();
  }, [donations, searchTerm, filterCategory]);

  const fetchDonations = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch available donations (approved ones)
      const response = await api.get("donation/", {
        params: { status: "approved" },
      });

      const availableDonations = response.data.filter(
        (d) => d.status === "approved"
      );
      setDonations(availableDonations);

      // Extract unique categories
      const uniqueCategories = [
        ...new Set(availableDonations.map((d) => d.category)),
      ].sort();
      setCategories(uniqueCategories);
    } catch (err) {
      console.error("Failed to fetch donations:", err);
      setError("Failed to load donations");
    } finally {
      setLoading(false);
    }
  };

  const filterDonations = () => {
    let filtered = donations;

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (d) =>
          d.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (filterCategory !== "all") {
      filtered = filtered.filter((d) => d.category === filterCategory);
    }

    setFilteredDonations(filtered);
  };

  const handleCreateOrder = (donation) => {
    setSelectedDonation(donation);
    setShowCreateModal(true);
  };

  const confirmCreateOrder = async () => {
    if (!selectedDonation) return;

    try {
      await api.post("receiver/orders/", {
        donation: selectedDonation.id,
      });

      alert("Order created successfully!");
      setShowCreateModal(false);
      setSelectedDonation(null);

      // Refresh donations to update availability
      fetchDonations();
    } catch (err) {
      alert(
        err.response?.data?.error || "Failed to create order. Please try again."
      );
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
      <div className="browse-donations">
        <h1>Browse Available Donations</h1>
        <p className="loading">Loading donations...</p>
      </div>
    );
  }

  return (
    <div className="browse-donations">
      <div className="page-header">
        <h1>Browse Available Donations</h1>
        <p className="subtitle">
          Find items being donated by generous donors
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* SEARCH AND FILTER */}
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
          <h3>Filter by Category</h3>
          <div className="category-buttons">
            <button
              className={`category-btn ${filterCategory === "all" ? "active" : ""}`}
              onClick={() => setFilterCategory("all")}
            >
              All Categories ({donations.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`category-btn ${filterCategory === cat ? "active" : ""}`}
                onClick={() => setFilterCategory(cat)}
              >
                {cat} (
                {donations.filter((d) => d.category === cat).length})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* DONATIONS GRID */}
      {filteredDonations.length > 0 ? (
        <div className="donations-grid">
          {filteredDonations.map((donation) => (
            <div key={donation.id} className="donation-card">
              <div className="card-image">
                {donation.images && donation.images.length > 0 ? (
                  <img
                    src={donation.images[0].image_url}
                    alt={donation.item_name}
                  />
                ) : (
                  <div className="no-image">📦</div>
                )}
              </div>

              <div className="card-content">
                <h3>{donation.item_name}</h3>

                <div className="donation-meta">
                  <span className="badge">{donation.category}</span>
                  <span className={`condition ${donation.condition}`}>
                    {getConditionLabel(donation.condition)}
                  </span>
                </div>

                <div className="donation-details">
                  <div className="detail">
                    <span className="label">Quantity:</span>
                    <span className="value">{donation.quantity}</span>
                  </div>

                  {donation.used_duration_months && (
                    <div className="detail">
                      <span className="label">Used for:</span>
                      <span className="value">
                        {donation.used_duration_months} months
                      </span>
                    </div>
                  )}

                  <div className="detail">
                    <span className="label">Posted:</span>
                    <span className="value">
                      {new Date(donation.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {donation.description && (
                  <p className="description">{donation.description}</p>
                )}

                {donation.images && donation.images.length > 0 && (
                  <div className="images-indicator">
                    📸 {donation.images.length} photo{
                      donation.images.length !== 1 ? "s" : ""
                    }
                  </div>
                )}
              </div>

              <div className="card-footer">
                <button
                  className="btn btn-create-order"
                  onClick={() => handleCreateOrder(donation)}
                >
                  Create Order
                </button>
              </div>
            </div>
          ))}
        </div>
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

      {/* CREATE ORDER MODAL */}
      {showCreateModal && selectedDonation && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Order</h2>
              <button
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p>Are you sure you want to request this item?</p>
              <div className="order-summary">
                <div className="summary-item">
                  <strong>Item:</strong> {selectedDonation.item_name}
                </div>
                <div className="summary-item">
                  <strong>Category:</strong> {selectedDonation.category}
                </div>
                <div className="summary-item">
                  <strong>Quantity:</strong> {selectedDonation.quantity}
                </div>
                <div className="summary-item">
                  <strong>Condition:</strong>{" "}
                  {getConditionLabel(selectedDonation.condition)}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-cancel"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-confirm"
                onClick={confirmCreateOrder}
              >
                Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BrowseDonations;

import { useState } from "react";
import api from "../../../api/api";
import "./CreateRequest.css";

function CreateRequest() {
  const [formData, setFormData] = useState({
    item_name: "",
    category: "",
    condition: "gently_used",
    used_duration_months: "",
    quantity: 1,
    description: "",
    images_required: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const CONDITIONS = [
    { value: "new_unused", label: "New (Unused)" },
    { value: "like_new", label: "Like New" },
    { value: "gently_used", label: "Gently Used" },
    { value: "used_functional", label: "Used but Functional" },
    { value: "refurbished", label: "Refurbished" },
  ];

  const CATEGORIES = [
    "Books",
    "Clothing",
    "Furniture",
    "Electronics",
    "Kitchen Items",
    "Toys",
    "Sports Equipment",
    "Other",
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validation
      if (!formData.item_name.trim()) {
        setError("Item name is required");
        setLoading(false);
        return;
      }

      if (!formData.category) {
        setError("Category is required");
        setLoading(false);
        return;
      }

      if (formData.quantity < 1) {
        setError("Quantity must be at least 1");
        setLoading(false);
        return;
      }

      // For non-new items, require used_duration_months
      if (
        formData.condition !== "new_unused" &&
        !formData.used_duration_months
      ) {
        setError("Please specify the duration of use for used items");
        setLoading(false);
        return;
      }

      // API call
      await api.post("receiver/requests/", formData);

      setSuccess("Request created successfully! You will be notified when it's approved.");

      // Reset form
      setFormData({
        item_name: "",
        category: "",
        condition: "gently_used",
        used_duration_months: "",
        quantity: 1,
        description: "",
        images_required: false,
      });

      // Scroll to top
      window.scrollTo(0, 0);
    } catch (err) {
      if (err.response?.status === 403) {
        setError("Please complete Aadhaar verification first.");
      } else if (err.response?.data) {
        const errorMsg = Object.values(err.response.data).flat().join(" ");
        setError(errorMsg || "Failed to create request");
      } else {
        setError("Failed to create request. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-request">
      <div className="request-container">
        <h1>Create Item Request</h1>
        <p className="subtitle">Tell us what items you're looking for</p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="request-form">
          {/* ITEM NAME */}
          <div className="form-group">
            <label htmlFor="item_name">Item Name *</label>
            <input
              type="text"
              id="item_name"
              name="item_name"
              value={formData.item_name}
              onChange={handleChange}
              placeholder="e.g., School Bag, Winter Jacket"
              required
            />
          </div>

          {/* CATEGORY */}
          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            >
              <option value="">Select a category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* QUANTITY */}
          <div className="form-group">
            <label htmlFor="quantity">Quantity *</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              min="1"
              value={formData.quantity}
              onChange={handleChange}
              required
            />
          </div>

          {/* CONDITION */}
          <div className="form-group">
            <label htmlFor="condition">Condition *</label>
            <select
              id="condition"
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              required
            >
              {CONDITIONS.map((cond) => (
                <option key={cond.value} value={cond.value}>
                  {cond.label}
                </option>
              ))}
            </select>
          </div>

          {/* USED DURATION (conditional) */}
          {formData.condition !== "new_unused" && (
            <div className="form-group">
              <label htmlFor="used_duration_months">
                Duration of Use (months) *
              </label>
              <input
                type="number"
                id="used_duration_months"
                name="used_duration_months"
                min="1"
                value={formData.used_duration_months}
                onChange={handleChange}
                placeholder="e.g., 6"
                required
              />
              <small>How long has this item been used?</small>
            </div>
          )}

          {/* DESCRIPTION */}
          <div className="form-group">
            <label htmlFor="description">Description (Optional)</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add any additional details about what you're looking for..."
              rows="4"
            ></textarea>
          </div>

          {/* IMAGES REQUIRED */}
          <div className="form-group checkbox-group">
            <label htmlFor="images_required" className="checkbox-label">
              <input
                type="checkbox"
                id="images_required"
                name="images_required"
                checked={formData.images_required}
                onChange={handleChange}
              />
              <span>Require photos/images from donor</span>
            </label>
            <small>Check this if you want to see photos before accepting</small>
          </div>

          {/* SUBMIT */}
          <div className="form-actions">
            <button
              type="submit"
              disabled={loading}
              className="btn-submit"
            >
              {loading ? "Creating..." : "Create Request"}
            </button>
          </div>
        </form>

        {/* INFO BOX */}
        <div className="info-box">
          <h3>💡 How it works</h3>
          <ol>
            <li>Submit your item request with details</li>
            <li>Our team reviews and approves your request</li>
            <li>Browse matching donations from donors</li>
            <li>Create an order for items you're interested in</li>
            <li>Track your orders through delivery</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default CreateRequest;

import { useState } from "react";
import api from "../../../api/api";
import "./Donate.css";

function Donate() {
  const [formData, setFormData] = useState({
    item_name: "",
    category: "",
    condition: "new_unused",
    used_duration_months: "",
    quantity: 1,
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [images, setImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 5) {
      setError("Maximum 5 images allowed");
      return;
    }
    setImages(files);
    
    // Create previews
    const previews = files.map(file => URL.createObjectURL(file));
    setImagePreview(previews);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!formData.item_name || !formData.category) {
        setError("Please fill in all required fields");
        setLoading(false);
        return;
      }

      const data = new FormData();
      data.append("item_name", formData.item_name);
      data.append("category", formData.category);
      data.append("condition", formData.condition);
      data.append("quantity", formData.quantity);
      data.append("description", formData.description);

      if (formData.condition !== "new_unused") {
        data.append("used_duration_months", formData.used_duration_months);
      }

      for (let i = 0; i < images.length; i++) {
        data.append("images", images[i]);
      }

      await api.post("donation/", data);
      setSuccess("Donation created successfully! ✅");

      // Reset form
      setFormData({
        item_name: "",
        category: "",
        condition: "new_unused",
        used_duration_months: "",
        quantity: 1,
        description: "",
      });
      setImages([]);
      setImagePreview([]);
    } catch (err) {
      if (err.response?.status === 403) {
        setError("❌ Please complete Aadhaar verification first.");
      } else {
        setError("❌ Failed to create donation. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="donate-page">
      <h1>Create New Donation</h1>
      <p className="subtitle">Share items that can help others</p>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="donate-form">
        <div className="form-section">
          <h2>Item Details</h2>
          
          <div className="form-group">
            <label htmlFor="item_name">Item Name *</label>
            <input
              type="text"
              id="item_name"
              name="item_name"
              placeholder="e.g., Books, Clothes, Furniture"
              value={formData.item_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <input
              type="text"
              id="category"
              name="category"
              placeholder="e.g., Education, Clothing, Household"
              value={formData.category}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="condition">Condition *</label>
              <select
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                required
              >
                <option value="new_unused">New (Unused)</option>
                <option value="like_new">Like New</option>
                <option value="gently_used">Gently Used</option>
                <option value="used_functional">Used but Functional</option>
                <option value="refurbished">Refurbished</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="quantity">Quantity *</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                min="1"
                max="100"
                value={formData.quantity}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {formData.condition !== "new_unused" && (
            <div className="form-group">
              <label htmlFor="used_duration_months">Used Duration (months) *</label>
              <input
                type="number"
                id="used_duration_months"
                name="used_duration_months"
                min="1"
                placeholder="How many months used?"
                value={formData.used_duration_months}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              placeholder="Add any additional details about the item..."
              rows="4"
              value={formData.description}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Item Images</h2>
          <div className="image-upload">
            <label htmlFor="images" className="upload-label">
              📸 Upload Images (Max 5)
            </label>
            <input
              type="file"
              id="images"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="file-input"
            />
            <p className="upload-hint">Drag and drop images here or click to select</p>
          </div>

          {imagePreview.length > 0 && (
            <div className="image-preview">
              <p className="preview-title">Image Preview ({imagePreview.length})</p>
              <div className="preview-grid">
                {imagePreview.map((preview, index) => (
                  <div key={index} className="preview-item">
                    <img src={preview} alt={`Preview ${index + 1}`} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            disabled={loading}
            className="btn-submit"
          >
            {loading ? "⏳ Creating Donation..." : "✅ Create Donation"}
          </button>
          <button 
            type="reset"
            className="btn-reset"
          >
            🔄 Clear Form
          </button>
        </div>
      </form>
    </div>
  );
}

export default Donate;

import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import api from "../../../api/api";
import RewardService from "../../../api/mockRewardService"; // Import Service
import BackButton from "../../../components/BackButton";
import "./Donate.css";

function Donate() {
  const [donationType, setDonationType] = useState("item"); // 'item' or 'fundraiser'
  const location = useLocation();

  const [formData, setFormData] = useState({
    item_name: "",
    category: "",
    condition: "new_unused",
    used_duration_months: "",
    quantity: 1,
    description: "",
    pickup_address: "",
    // Fundraiser specific fields
    fundraiser_title: "",
    organization_name: "",
    fundraiser_category: "",
    goal_amount: "",
    target_date: "",
  });

  const [images, setImages] = useState([]); // Store as array of files
  const [previews, setPreviews] = useState([]); // Store object URLs for cleanup
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeReward, setActiveReward] = useState(null); // Local state for applied reward
  const [requestRequirements, setRequestRequirements] = useState(null); // Store request requirements
  const [requestId, setRequestId] = useState(null); // Store request ID if responding
  const [validationWarnings, setValidationWarnings] = useState([]);

  const itemCategories = [
    "Accessories",
    "Books",
    "Clothing",
    "Electronics",
    "Food",
    "Furniture",
    "Medical",
    "Stationary",
    "Toys"
  ];

  // Check for rewards on mount
  useEffect(() => {
    const reward = RewardService.getUnusedReward();
    if (reward) {
      setActiveReward(reward);
    }

    // Check for pre-filled data from RequestedItems
    const prefill = location.state?.prefill;
    const requirements = location.state?.requestRequirements;

    if (prefill) {
      setFormData(prev => ({
        ...prev,
        item_name: prefill.item_name || "",
        category: (prefill.category || ""),
        quantity: prefill.quantity || 1,
        condition: prefill.condition || "new_unused",
        description: prefill.description || "",
      }));
      setDonationType("item");
      if (prefill.requestId) {
        setRequestId(prefill.requestId);
      }
    }

    if (requirements) {
      setRequestRequirements(requirements);
      // Robust fallback: if prefill was missing or incomplete, use requirements to fill disabled fields
      setFormData(prev => ({
        ...prev,
        item_name: prev.item_name || requirements.itemName || "",
        category: prev.category || requirements.category || "",
        quantity: prev.quantity > 1 ? prev.quantity : (requirements.minQuantity || 1),
        condition: prev.condition !== "new_unused" ? prev.condition : (requirements.requiredCondition || "new_unused"),
      }));
    }
  }, [location.state]);

  const fundraiserCategories = [
    "Organization",
    "Medical & Health",
    "Disaster & Emergency Relief",
    "Hunger & Basic Needs",
    "Children & Women Welfare",
    "Environment & Sustainability"
  ];

  // Validate against request requirements
  useEffect(() => {
    if (!requestRequirements || donationType !== "item") {
      setValidationWarnings([]);
      return;
    }

    const warnings = [];
    const conditionHierarchy = {
      "new_unused": 5,
      "like_new": 4,
      "gently_used": 3,
      "used_functional": 2,
      "refurbished": 1
    };

    // Check quantity
    if (formData.quantity < requestRequirements.minQuantity) {
      warnings.push(`⚠️ Requested quantity is ${requestRequirements.minQuantity}, but you're donating ${formData.quantity}`);
    }

    // Check condition
    const donatedConditionLevel = conditionHierarchy[formData.condition] || 0;
    const requiredConditionLevel = conditionHierarchy[requestRequirements.requiredCondition] || 0;

    if (donatedConditionLevel < requiredConditionLevel) {
      warnings.push(`⚠️ Requested condition is "${requestRequirements.requiredCondition.replace(/_/g, ' ')}", but you selected "${formData.condition.replace(/_/g, ' ')}"`);
    }

    setValidationWarnings(warnings);
  }, [formData.quantity, formData.condition, requestRequirements, donationType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    if (images.length + selectedFiles.length > 5) {
      setError("❌ Maximum 5 images allowed");
      return;
    }

    const newImages = [...images, ...selectedFiles];
    setImages(newImages);

    // Create previews
    const newPreviews = selectedFiles.map(file => {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
      }
      return null;
    });
    setPreviews(prev => [...prev, ...newPreviews]);
    setError("");
  };

  const removeImage = (index) => {
    // Revoke URL before removing
    if (previews[index]) {
      URL.revokeObjectURL(previews[index]);
    }
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = new FormData();
      data.append("donation_type", donationType);

      if (donationType === "item") {
        if (!formData.item_name || !formData.category) {
          setError("Please fill in all required fields");
          setLoading(false);
          return;
        }
        data.append("item_name", formData.item_name);
        data.append("category", formData.category.toLowerCase());
        data.append("condition", formData.condition);
        data.append("quantity", formData.quantity);
        data.append("description", formData.description);
        if (formData.pickup_address) {
          data.append("pickup_address", formData.pickup_address);
        }
        if (formData.condition !== "new_unused") {
          data.append("used_duration_months", formData.used_duration_months);
        }
        if (requestId) {
          data.append("fulfilled_request", requestId);
        }
      } else {
        // Fundraiser validation
        if (!formData.fundraiser_title || !formData.fundraiser_category || !formData.goal_amount) {
          setError("Please fill in all required fundraiser fields");
          setLoading(false);
          return;
        }
        data.append("item_name", formData.fundraiser_title);
        data.append("organization_name", formData.organization_name);
        data.append("category", formData.fundraiser_category);
        data.append("goal_amount", formData.goal_amount);
        data.append("description", formData.description);
        if (formData.target_date) {
          data.append("target_date", formData.target_date);
        }
      }

      if (images.length > 0) {
        images.forEach((file) => {
          data.append("images", file);
        });
      }

      // We'll use the same endpoint but backend should handle types
      await api.post("donation/", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Mark reward as used if applicable
      if (activeReward) {
        RewardService.useReward(activeReward.id, "don_" + Date.now()); // Mock donation ID
        setActiveReward(null); // Clear locally
      }

      setSuccess(`✅ ${donationType === 'item' ? 'Donation' : 'Fundraiser'} created successfully! ${activeReward ? `(Reward "${activeReward.rewardLabel}" applied)` : ''}`);

      // Reset form and CLEAR request context
      setFormData({
        item_name: "",
        category: "",
        condition: "new_unused",
        used_duration_months: "",
        quantity: 1,
        description: "",
        pickup_address: "",
        fundraiser_title: "",
        organization_name: "",
        fundraiser_category: "",
        goal_amount: "",
        target_date: "",
      });
      previews.forEach(url => url && URL.revokeObjectURL(url));
      setImages([]);
      setPreviews([]);
      setRequestRequirements(null); // Clear context
      setRequestId(null); // Clear context

    } catch (err) {
      if (err.response?.status === 403) {
        setError(err.response.data?.detail || "Email verification is required.");
      } else if (err.response?.status === 400) {
        const errors = err.response.data;
        let errorMessage = "❌ Error: ";
        if (typeof errors === 'object') {
          errorMessage += Object.entries(errors)
            .map(([k, v]) => `${k}: ${v}`)
            .join(" | ");
        } else {
          errorMessage += errors;
        }
        setError(errorMessage);
      } else {
        setError("❌ Failed to create. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      previews.forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [previews]);

  return (
    <div className="donate-page">
      <BackButton />
      <h1>Donate to Catalyst</h1>
      <p className="subtitle">Choose how you want to make an impact</p>

      {/* Auto-Applied Reward Banner */}
      {activeReward && (
        <div className="reward-banner animate-fade-in-up" style={{
          background: 'linear-gradient(to right, #ecfdf5, #dbeafe)',
          border: '1px solid #10b981',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ fontSize: '24px' }}>🎁</div>
          <div>
            <h4 style={{ margin: 0, color: '#047857', fontSize: '16px' }}>Reward Applied Automatically!</h4>
            <p style={{ margin: '4px 0 0', color: '#065f46', fontSize: '14px' }}>
              <strong>{activeReward.rewardLabel}</strong>: {activeReward.rewardDescription}
            </p>
          </div>
        </div>
      )}



      {/* Validation Warnings */}
      {validationWarnings.length > 0 && (
        <div className="validation-warnings" style={{
          background: '#fef2f2',
          border: '2px solid #ef4444',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '20px'
        }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#991b1b', fontSize: '15px' }}>
            ⚠️ Your donation may not meet the request requirements:
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#7f1d1d' }}>
            {validationWarnings.map((warning, idx) => (
              <li key={idx} style={{ marginBottom: '4px', fontSize: '14px' }}>{warning}</li>
            ))}
          </ul>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#991b1b', fontStyle: 'italic' }}>
            You can still proceed, but the receiver may not accept this donation.
          </p>
        </div>
      )}

      {/* Donation Type Selector */}
      <div className="donation-type-selector">
        <button
          className={`type-btn ${donationType === 'item' ? 'active' : ''}`}
          onClick={() => !requestRequirements && setDonationType('item')}
          disabled={!!requestRequirements}
          style={requestRequirements ? { opacity: 1, cursor: 'default' } : {}}
        >
          🎁 Physical Item
        </button>
        <button
          className={`type-btn ${donationType === 'fundraiser' ? 'active' : ''}`}
          onClick={() => !requestRequirements && setDonationType('fundraiser')}
          disabled={!!requestRequirements}
          style={requestRequirements ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        >
          💰 Start Fundraiser
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="donate-form">
        {donationType === 'item' ? (
          <div className="form-section">
            <h2>Item Details</h2>
            <div className="form-group">
              <label>Item Name *</label>
              <input
                type="text"
                name="item_name"
                value={formData.item_name}
                onChange={handleChange}
                placeholder="What are you donating?"
                required
                disabled={!!requestRequirements}
              />
            </div>

            <div className="form-group">
              <label>Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                disabled={!!requestRequirements}
              >
                <option value="">Select Category</option>
                {itemCategories.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
                {/* Fallback for prefilled category if not in list */}
                {formData.category && !itemCategories.includes(formData.category) && (
                  <option value={formData.category}>
                    {formData.category.charAt(0).toUpperCase() + formData.category.slice(1)}
                  </option>
                )}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Condition *</label>
                <select
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
                <label>Quantity *</label>
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  disabled={!!requestRequirements}
                />
              </div>
            </div>

            {formData.condition !== "new_unused" && (
              <div className="form-group">
                <label>Used Duration (months)</label>
                <input
                  type="number"
                  name="used_duration_months"
                  min="1"
                  value={formData.used_duration_months}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label>Pickup Address (Optional)</label>
              <textarea
                name="pickup_address"
                rows="2"
                placeholder="Leave empty to use your profile address"
                value={formData.pickup_address || ""}
                onChange={handleChange}
              />
            </div>
          </div>
        ) : (
          <div className="form-section">
            <h2>Fundraiser Details</h2>
            <div className="form-group">
              <label>Fundraiser Title *</label>
              <input
                type="text"
                name="fundraiser_title"
                value={formData.fundraiser_title}
                onChange={handleChange}
                placeholder="e.g., Support for Rural Health Clinic"
                required
              />
            </div>

            <div className="form-group">
              <label>Organization / Project Name</label>
              <input
                type="text"
                name="organization_name"
                value={formData.organization_name}
                onChange={handleChange}
                placeholder="Who is this for?"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Category *</label>
                <select
                  name="fundraiser_category"
                  value={formData.fundraiser_category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Category</option>
                  {fundraiserCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Goal Amount (INR) *</label>
                <input
                  type="number"
                  name="goal_amount"
                  min="1"
                  value={formData.goal_amount}
                  onChange={handleChange}
                  placeholder="Target amount"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Target Date (Optional)</label>
              <input
                type="date"
                name="target_date"
                value={formData.target_date}
                onChange={handleChange}
              />
            </div>
          </div>
        )}

        <div className="form-section">
          <h2>Additional Information</h2>
          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              rows="4"
              placeholder={donationType === 'item' ? "Tell us more about the item..." : "Tell the story of why you are raising funds..."}
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Upload Images / Documents (Max 5)</label>
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              id="file-upload"
              onChange={handleImageChange}
              style={{ display: 'none' }}
              disabled={images.length >= 5}
            />
            <label htmlFor="file-upload" className={`file-upload-label ${images.length >= 5 ? 'disabled' : ''}`}>
              {images.length >= 5 ? "🚫 Image Limit Reached" : "📸 Choose Images/Files"}
            </label>

            {images.length > 0 && (
              <div className="image-preview-grid">
                {images.map((file, idx) => (
                  <div key={idx} className="preview-item">
                    {previews[idx] ? (
                      <img src={previews[idx]} alt="preview" />
                    ) : (
                      <div className="file-icon">📄</div>
                    )}
                    <button type="button" className="remove-btn" onClick={() => removeImage(idx)}>×</button>
                    <span className="file-name">{file.name}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="help-text">Add up to 5 photos of the item or supporting documents.</p>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? "⏳ Processing..." : donationType === 'item' ? "✅ Create Donation" : "🚀 Launch Fundraiser"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Donate;

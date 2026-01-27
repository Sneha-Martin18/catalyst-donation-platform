import { useState } from "react";
import api from "../../../api/api";

function CreateDonation() {
  const [formData, setFormData] = useState({
    item_name: "",
    category: "",
    condition: "new_unused",
    used_duration: "",
    quantity: 1,
    description: "",
    images: [],
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // ---------------- Handlers ----------------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      images: Array.from(e.target.files),
    }));
  };

  // ---------------- Validation ----------------
  const validateForm = () => {
    const newErrors = {};

    // Item name: required + no numbers
    if (!formData.item_name.trim()) {
      newErrors.item_name = "Item name is required";
    } else if (!/^[A-Za-z\s]+$/.test(formData.item_name)) {
      newErrors.item_name = "Item name must contain only letters";
    }

    if (!formData.category.trim()) {
      newErrors.category = "Category is required";
    }

    if (!formData.condition) {
      newErrors.condition = "Condition is required";
    }

    if (formData.used_duration === "") {
      newErrors.used_duration = "Used duration is required";
    }

    if (!formData.quantity || Number(formData.quantity) < 1) {
      newErrors.quantity = "Quantity must be at least 1";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (formData.images.length === 0) {
      newErrors.images = "At least one image is required";
    } else if (formData.images.length > 5) {
      newErrors.images = "Maximum 5 images allowed";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------------- Submit ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "images") {
        value.forEach((img) => data.append("images", img));
      } else {
        data.append(key, value);
      }
    });

    try {
      await api.post("/donation/create/", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Donation submitted successfully");
    } catch (err) {
      alert("Failed to submit donation");
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------- UI ----------------
  return (
    <div>
      <h2>Create Donation</h2>

      <form onSubmit={handleSubmit}>
        {/* Item Name */}
        <div>
          <label>Item Name</label><br />
          <input
            type="text"
            name="item_name"
            value={formData.item_name}
            onChange={handleChange}
          />
          {errors.item_name && <p style={{ color: "red" }}>{errors.item_name}</p>}
        </div>

        {/* Category */}
        <div>
          <label>Category</label><br />
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
          />
          {errors.category && <p style={{ color: "red" }}>{errors.category}</p>}
        </div>

        {/* Condition */}
        <div>
          <label>Condition</label><br />
          <select
            name="condition"
            value={formData.condition}
            onChange={handleChange}
          >
            <option value="new_unused">New (Unused)</option>
            <option value="like_new">Like New</option>
            <option value="gently_used">Gently Used</option>
            <option value="used_functional">Used but Functional</option>
            <option value="refurbished">Refurbished</option>
          </select>
        </div>

        {/* Used Duration */}
        <div>
          <label>Used Duration (months)</label><br />
          <input
            type="number"
            name="used_duration"
            min="0"
            value={formData.used_duration}
            onChange={handleChange}
          />
          {errors.used_duration && (
            <p style={{ color: "red" }}>{errors.used_duration}</p>
          )}
        </div>

        {/* Quantity */}
        <div>
          <label>Quantity</label><br />
          <input
            type="number"
            name="quantity"
            min="1"
            value={formData.quantity}
            onChange={handleChange}
          />
          {errors.quantity && <p style={{ color: "red" }}>{errors.quantity}</p>}
        </div>

        {/* Description */}
        <div>
          <label>Description</label><br />
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
          />
          {errors.description && (
            <p style={{ color: "red" }}>{errors.description}</p>
          )}
        </div>

        {/* Images */}
        <div>
          <label>Images (max 5)</label><br />
          <input type="file" multiple onChange={handleImageChange} />
          {errors.images && <p style={{ color: "red" }}>{errors.images}</p>}
        </div>

        <button type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Donation"}
        </button>
      </form>
    </div>
  );
}

export default CreateDonation;

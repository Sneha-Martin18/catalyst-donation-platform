import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../../api/api";
import BackButton from "../../../components/BackButton";
import "./Donate.css"; // Reuse Donate styles

function DonationEdit() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
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

    const [donationType, setDonationType] = useState("item");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [existingImages, setExistingImages] = useState([]);
    const [newImages, setNewImages] = useState([]);
    const [previews, setPreviews] = useState([]);

    const fundraiserCategories = [
        "Organization",
        "Medical & Health",
        "Disaster & Emergency Relief",
        "Hunger & Basic Needs",
        "Children & Women Welfare",
        "Environment & Sustainability"
    ];

    useEffect(() => {
        const fetchDonation = async () => {
            try {
                const res = await api.get(`/donation/${id}/`);
                const data = res.data;

                setDonationType(data.donation_type);

                setFormData({
                    item_name: data.item_name || "",
                    category: data.category || "",
                    condition: data.condition || "new_unused",
                    used_duration_months: data.used_duration_months || "",
                    quantity: data.quantity || 1,
                    description: data.description || "",
                    pickup_address: data.pickup_address || "",
                    fundraiser_title: data.item_name || "",
                    organization_name: data.organization_name || "",
                    fundraiser_category: data.category || "",
                    goal_amount: data.goal_amount || "",
                    target_date: data.target_date || "",
                });

                setExistingImages(data.images || []);
            } catch (err) {
                console.error("Failed to fetch donation", err);
                setError("Could not load donation details.");
            } finally {
                setLoading(false);
            }
        };

        fetchDonation();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        const totalImages = existingImages.length + newImages.length + selectedFiles.length;

        if (totalImages > 5) {
            setError("❌ Total images cannot exceed 5");
            return;
        }

        const addedPhotos = [...newImages, ...selectedFiles];
        setNewImages(addedPhotos);

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

    const removeNewImage = (index) => {
        if (previews[index]) {
            URL.revokeObjectURL(previews[index]);
        }
        setNewImages(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = async (imageId) => {
        if (!window.confirm("Delete this image?")) return;
        try {
            await api.delete(`/donation/image/${imageId}/`);
            setExistingImages(prev => prev.filter(img => img.id !== imageId));
        } catch (err) {
            setError("Failed to delete image.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        setSuccess("");

        try {
            const data = new FormData();

            if (donationType === "item") {
                data.append("item_name", formData.item_name);
                data.append("category", formData.category);
                data.append("condition", formData.condition);
                data.append("quantity", formData.quantity);
                data.append("description", formData.description);
                if (formData.pickup_address) {
                    data.append("pickup_address", formData.pickup_address);
                }
                if (formData.condition !== "new_unused") {
                    data.append("used_duration_months", formData.used_duration_months);
                }
            } else {
                data.append("item_name", formData.fundraiser_title);
                data.append("organization_name", formData.organization_name);
                data.append("category", formData.fundraiser_category);
                data.append("goal_amount", formData.goal_amount);
                data.append("description", formData.description);
                if (formData.target_date) {
                    data.append("target_date", formData.target_date);
                }
            }

            // Append new images
            newImages.forEach(file => {
                data.append("images", file);
            });

            await api.patch(`/donation/${id}/`, data, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setSuccess("✅ Updated successfully!");
            setTimeout(() => navigate("/dashboard/user/donations"), 1500);

        } catch (err) {
            console.error("Update failed", err);
            setError("❌ Failed to update. Please try again.");
        } finally {
            setSubmitting(false);
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

    const handleDelete = async () => {
        if (!window.confirm("Are you sure you want to delete this donation?")) return;

        try {
            await api.delete(`/donation/${id}/`);
            navigate("/dashboard/user/donations");
        } catch (err) {
            setError("Failed to delete.");
        }
    };

    if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
        <div className="donate-page">
            <BackButton />
            <div className="flex justify-between items-center mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h1 style={{ margin: 0 }}>Edit {donationType === 'item' ? 'Donation' : 'Fundraiser'}</h1>
                <button
                    onClick={handleDelete}
                    style={{
                        backgroundColor: 'transparent',
                        color: '#dc2626',
                        fontWeight: 'bold',
                        padding: '8px 16px',
                        border: '1px solid #fee2e2',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Delete
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
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Category *</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Category</option>
                                <option value="books">Books</option>
                                <option value="clothes">Clothes</option>
                                <option value="electronics">Electronics</option>
                                <option value="furniture">Furniture</option>
                                <option value="stationary">Stationary</option>
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
                            <label>Pickup Address</label>
                            <textarea
                                name="pickup_address"
                                rows="2"
                                value={formData.pickup_address}
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
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Target Date</label>
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
                    <h2>Description</h2>
                    <div className="form-group">
                        <textarea
                            name="description"
                            rows="4"
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {donationType === 'item' && (
                    <div className="form-section">
                        <h2>Images (Max 5)</h2>

                        <div className="image-preview-grid">
                            {/* Existing Images */}
                            {existingImages.map((img) => (
                                <div key={img.id} className="preview-item">
                                    <img src={img.image_url} alt="existing" />
                                    <button type="button" className="remove-btn" onClick={() => removeExistingImage(img.id)}>×</button>
                                    <span className="file-name">Existing</span>
                                </div>
                            ))}

                            {/* New Images */}
                            {newImages.map((file, idx) => (
                                <div key={idx} className="preview-item">
                                    {previews[idx] ? (
                                        <img src={previews[idx]} alt="preview" />
                                    ) : (
                                        <div className="file-icon">📄</div>
                                    )}
                                    <button type="button" className="remove-btn" onClick={() => removeNewImage(idx)}>×</button>
                                    <span className="file-name">{file.name} (New)</span>
                                </div>
                            ))}
                        </div>

                        <div className="image-upload" style={{ background: 'transparent', padding: '10px 0' }}>
                            <label className={`file-upload-label ${(existingImages.length + newImages.length) >= 5 ? 'disabled' : ''}`}>
                                <span>+ Add More Images</span>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    style={{ display: 'none' }}
                                    disabled={(existingImages.length + newImages.length) >= 5}
                                />
                            </label>
                            <p className="help-text">You can upload up to {5 - (existingImages.length + newImages.length)} more images.</p>
                        </div>
                    </div>
                )}

                <div className="form-actions" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button type="button" onClick={() => navigate(-1)} className="btn-secondary" style={{ padding: '10px 24px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer' }}>
                        Cancel
                    </button>
                    <button type="submit" disabled={submitting} className="btn-submit">
                        {submitting ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default DonationEdit;

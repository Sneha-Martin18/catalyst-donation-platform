import React, { useState, useEffect, useRef } from "react";
import api from "../../../api/api";
import "./ManageCampaigns.css";

const ManageCampaigns = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [currentCampaign, setCurrentCampaign] = useState(null);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        food_type: "",
        target_quantity: 0,
        status: "upcoming",
        location: "",
        image_url: "",
        start_time: "",
        end_time: ""
    });
    const [error, setError] = useState("");

    const fetchLock = useRef(false);

    useEffect(() => {
        if (!fetchLock.current) {
            fetchCampaigns();
            fetchLock.current = true;
        }
    }, []);

    const fetchCampaigns = async () => {
        try {
            const response = await api.get("/campaigns/live/");
            setCampaigns(response.data.results || response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching campaigns:", error);
            setLoading(false);
        }
    };

    const handleCreateOrUpdate = async (e) => {
        e.preventDefault();
        setError("");

        const now = new Date();
        const start = new Date(formData.start_time);
        const end = new Date(formData.end_time);

        // Validation: Start time must be before end time
        if (start >= end) {
            setError("End time must be after start time.");
            return;
        }

        // Intelligent Validation: If status is 'Live', start time must have been reached
        if (formData.status === "live" && start > now) {
            setError("Campaign cannot be 'Live' if the start time is in the future. Please set status to 'Upcoming' instead.");
            return;
        }

        try {
            if (currentCampaign) {
                await api.put(`/campaigns/live/${currentCampaign.id}/`, formData);
            } else {
                await api.post("/campaigns/live/", formData);
            }
            setShowModal(false);
            fetchCampaigns();
            resetForm();
        } catch (error) {
            console.error("Error saving campaign:", error);
            setError("Failed to save campaign. Please check your data.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this campaign?")) {
            try {
                await api.delete(`/campaigns/live/${id}/`);
                fetchCampaigns();
            } catch (error) {
                console.error("Error deleting campaign:", error);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            food_type: "",
            target_quantity: 0,
            status: "upcoming",
            location: "",
            image_url: "",
            start_time: "",
            end_time: ""
        });
        setCurrentCampaign(null);
    };

    const openEditModal = (campaign) => {
        setError("");
        setCurrentCampaign(campaign);
        const formatForInput = (dateStr) => {
            if (!dateStr) return "";
            return new Date(dateStr).toISOString().slice(0, 16);
        };

        setFormData({
            title: campaign.title,
            description: campaign.description,
            food_type: campaign.food_type,
            target_quantity: campaign.target_quantity,
            status: campaign.status,
            location: campaign.location,
            image_url: campaign.image_url || "",
            start_time: formatForInput(campaign.start_time),
            end_time: formatForInput(campaign.end_time)
        });
        setShowModal(true);
    };

    if (loading) return <div className="loading">Loading Campaigns...</div>;

    return (
        <div className="manage-campaigns">
            <div className="header-section">
                <h2>Live Campaigns</h2>
                <button className="create-btn" onClick={() => { resetForm(); setError(""); setShowModal(true); }}>
                    + Create Campaign
                </button>
            </div>

            <div className="campaigns-grid">
                {campaigns.map(campaign => (
                    <div key={campaign.id} className="campaign-card">
                        <img
                            src={campaign.image_url || "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"}
                            alt={campaign.title}
                            className="campaign-image"
                        />
                        <div className="campaign-content">
                            <span className={`campaign-status status-${campaign.status}`}>
                                {campaign.status}
                            </span>
                            <h4>{campaign.title}</h4>
                            <div className="campaign-info">
                                <div
                                    className="info-item"
                                    style={{ cursor: 'pointer', color: '#3182ce' }}
                                    onClick={() => {
                                        const encoded = encodeURIComponent(campaign.location);
                                        window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, '_blank');
                                    }}
                                    title="View on Google Maps"
                                >
                                    📍 {campaign.location}
                                </div>
                                <div className="info-item">🍱 {campaign.food_type}</div>
                            </div>

                            <div className="progress-container">
                                <div className="progress-label">
                                    <span>Progress</span>
                                    <span>{campaign.current_quantity} / {campaign.target_quantity}</span>
                                </div>
                                <div className="progress-bar-bg">
                                    <div
                                        className="progress-bar-fill"
                                        style={{ width: `${campaign.progress_percentage}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="card-actions">
                                <button className="edit-btn" onClick={() => openEditModal(campaign)}>Edit</button>
                                <button className="delete-btn" onClick={() => handleDelete(campaign.id)}>Delete</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="campaign-modal">
                        <h3>{currentCampaign ? "Edit Campaign" : "New Campaign"}</h3>

                        {error && (
                            <div className="alert alert-error" style={{
                                background: '#fff5f5',
                                color: '#e53e3e',
                                padding: '1rem',
                                borderRadius: '12px',
                                marginBottom: '1.5rem',
                                border: '1px solid #fed7d7',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                ⚠️ {error}
                            </div>
                        )}

                        <form onSubmit={handleCreateOrUpdate} className="campaign-form-grid">
                            <div className="form-group full-width">
                                <label>Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group full-width">
                                <label>Description</label>
                                <textarea
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Food Type</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Prepared Meals"
                                    value={formData.food_type}
                                    onChange={(e) => setFormData({ ...formData, food_type: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Target Quantity</label>
                                <input
                                    type="number"
                                    value={formData.target_quantity}
                                    onChange={(e) => setFormData({ ...formData, target_quantity: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Location</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="upcoming">Upcoming</option>
                                    <option value="live">Live</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                            <div className="form-group full-width">
                                <label>Image URL</label>
                                <input
                                    type="url"
                                    placeholder="https://..."
                                    value={formData.image_url}
                                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Start Time</label>
                                <input
                                    type="datetime-local"
                                    value={formData.start_time}
                                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>End Time</label>
                                <input
                                    type="datetime-local"
                                    value={formData.end_time}
                                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="save-btn">{currentCampaign ? "Update" : "Create"}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageCampaigns;

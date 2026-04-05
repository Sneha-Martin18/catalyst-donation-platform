import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";
import "./LiveCampaigns.css";

const LiveCampaigns = () => {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchLock = useRef(false);

    useEffect(() => {
        const fetchCampaigns = async () => {
            try {
                const response = await api.get("/campaigns/live/");
                // Filter only live campaigns for regular users
                const allCampaigns = response.data.results || response.data;
                setCampaigns(allCampaigns.filter(c => c.status === "live"));
                setLoading(false);
            } catch (error) {
                console.error("Error fetching campaigns:", error);
                setLoading(false);
            }
        };

        if (!fetchLock.current) {
            fetchCampaigns();
            fetchLock.current = true;
        }

        // Set up polling for "live" updates every 30 seconds
        const interval = setInterval(fetchCampaigns, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleViewMap = (location) => {
        if (!location) return;
        const encodedLocation = encodeURIComponent(location);
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodedLocation}`, '_blank');
    };

    if (loading) return <div className="loading">Loading Live Events...</div>;

    return (
        <div className="live-campaigns-page">
            <div className="welcome-banner">
                <h1>Together, We Feed Many</h1>
                <p>Join our live campaigns and witness the immediate impact of your generosity.</p>
            </div>

            <div className="section-title">
                <h2>Active Campaigns</h2>
                <span className="live-badge">Live Now</span>
            </div>

            {campaigns.length === 0 ? (
                <div className="no-campaigns">
                    <h3>No campaigns are live at the moment.</h3>
                    <p>Check back later or follow our social media for updates!</p>
                </div>
            ) : (
                <div className="campaigns-grid-user">
                    {campaigns.map(campaign => (
                        <div key={campaign.id} className="user-campaign-card">
                            <div className="card-image-wrapper">
                                <img
                                    src={campaign.image_url || "https://images.unsplash.com/photo-1593113598332-cd288d649433?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"}
                                    alt={campaign.title}
                                />
                                <div className="food-type-tag">🍱 {campaign.food_type}</div>
                            </div>

                            <div className="card-body">
                                <h3>{campaign.title}</h3>
                                <p className="campaign-desc">{campaign.description}</p>

                                <div className="meta-info">
                                    <div className="meta-item clickable-location" onClick={() => handleViewMap(campaign.location)} title="View on Google Maps">
                                        <span className="meta-label">📍 Location (Click to view)</span>
                                        <span className="meta-value">{campaign.location}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Ends In</span>
                                        <span className="meta-value">
                                            {Math.max(0, Math.floor((new Date(campaign.end_time) - new Date()) / (1000 * 60 * 60)))} hours
                                        </span>
                                    </div>
                                </div>

                                <div className="user-progress-container">
                                    <div className="progress-header">
                                        <span>Community Progress</span>
                                        <span className="progress-pct">{campaign.progress_percentage}%</span>
                                    </div>
                                    <div className="progress-track">
                                        <div
                                            className="progress-fill-animate"
                                            style={{ width: `${campaign.progress_percentage}%` }}
                                        ></div>
                                    </div>
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#718096', textAlign: 'center' }}>
                                        {campaign.current_quantity} of {campaign.target_quantity} meals reached
                                    </div>
                                </div>

                                <button className="contribute-btn location-map-btn" onClick={() => handleViewMap(campaign.location)}>
                                    <span>📍 View on Map</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LiveCampaigns;

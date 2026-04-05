import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../../../api/api";
import BackButton from "../../../components/BackButton";
import StatusBadge from "../../../components/StatusBadge";
import DonationTimeline from "../../../components/DonationTimeline";
import "./DonationDetails.css";

function DonationDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [donation, setDonation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        const fetchDonation = async () => {
            try {
                const res = await api.get(`/donation/${id}/`);
                setDonation(res.data);
            } catch (err) {
                console.error("Failed to fetch donation details", err);
                setError("Could not load donation details.");
            } finally {
                setLoading(false);
            }
        };

        fetchDonation();
    }, [id]);

    const nextImage = () => {
        if (!donation?.images) return;
        setCurrentImageIndex((prev) => (prev + 1) % donation.images.length);
    };

    const prevImage = () => {
        if (!donation?.images) return;
        setCurrentImageIndex((prev) => (prev - 1 + donation.images.length) % donation.images.length);
    };

    if (loading) return <div className="loading-container"><div className="spinner"></div><p>Loading details...</p></div>;
    if (error) return <div className="error-container">{error}</div>;
    if (!donation) return <div className="error-container">Donation not found</div>;

    const isFundraiser = donation.donation_type === 'fundraiser';

    return (
        <div className="donation-details-page">
            <div className="details-header">
                <BackButton />
                <div className="header-actions">
                    {donation.status === 'pending' && (
                        <Link to={`/dashboard/user/edit-donation/${id}`} className="btn-edit-link">
                            ✏️ Edit Donation
                        </Link>
                    )}
                </div>
            </div>

            <div className="details-content">
                {/* Left Column: Images */}
                <div className="details-gallery">
                    {donation.images && donation.images.length > 0 ? (
                        <div className="main-image">
                            <img src={donation.images[currentImageIndex].image_url} alt={donation.item_name} />

                            {donation.images.length > 1 && (
                                <>
                                    <button className="gallery-arrow prev" onClick={prevImage}>
                                        &#10094;
                                    </button>
                                    <button className="gallery-arrow next" onClick={nextImage}>
                                        &#10095;
                                    </button>
                                    <div className="image-indicators">
                                        {donation.images.map((_, idx) => (
                                            <span
                                                key={idx}
                                                className={`indicator ${idx === currentImageIndex ? 'active' : ''}`}
                                                onClick={() => setCurrentImageIndex(idx)}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="no-image-placeholder">
                            <span>📷 No Image Available</span>
                        </div>
                    )}
                </div>

                {/* Right Column: Info */}
                <div className="details-info">
                    <div className="info-header">
                        <span className="category-tag">{donation.category}</span>
                        <StatusBadge status={donation.status} />
                    </div>

                    <h1 className="item-title">{donation.item_name}</h1>

                    {isFundraiser && (
                        <h3 className="org-name">for {donation.organization_name}</h3>
                    )}

                    <div className="timeline-wrapper">
                        <DonationTimeline status={donation.status} />
                    </div>

                    <div className="info-grid">
                        {!isFundraiser ? (
                            <>
                                <div className="info-item">
                                    <label>Condition</label>
                                    <p>{donation.condition?.replace(/_/g, " ")}</p>
                                </div>
                                <div className="info-item">
                                    <label>Quantity</label>
                                    <p>{donation.quantity} unit(s)</p>
                                </div>
                                {donation.pickup_address && (
                                    <div className="info-item full-width">
                                        <label>Pickup Address</label>
                                        <p>{donation.pickup_address}</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="info-item">
                                    <label>Goal Amount</label>
                                    <p>₹{parseFloat(donation.goal_amount).toLocaleString()}</p>
                                </div>
                                <div className="info-item">
                                    <label>Raised</label>
                                    <p>₹{donation.raised_amount?.toLocaleString() || 0}</p>
                                </div>
                                <div className="info-item">
                                    <label>Target Date</label>
                                    <p>{donation.target_date || "N/A"}</p>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="description-section">
                        <h3>Description</h3>
                        <p>{donation.description || "No description provided."}</p>
                    </div>

                    {donation.status === 'assigned' && donation.order && (
                        <div className="order-details-box">
                            <h3>📦 Order Information</h3>
                            <div className="order-row">
                                <span>Requested By:</span>
                                <strong>{donation.order.receiver_name}</strong>
                            </div>
                            <div className="order-row">
                                <span>Date:</span>
                                <strong>{new Date(donation.order.created_at).toLocaleDateString()}</strong>
                            </div>
                            <div className="order-status-msg">
                                The item has been assigned. A volunteer will contact you shortly for pickup.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DonationDetails;

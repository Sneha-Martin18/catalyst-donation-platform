import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/api";
import BackButton from "../../../components/BackButton";
import Pagination from "../../../components/Pagination";
import "./RequestedItems.css";

function RequestedItems() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");
    const navigate = useNavigate();
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const fetchApprovedRequests = async (currentPage = 1) => {
        try {
            setLoading(true);
            setError("");
            const response = await api.get(`receiver/item-requests/approved/?page=${currentPage}`);

            if (response.data.results) {
                setRequests(response.data.results);
                setTotalCount(response.data.count);
            } else {
                setRequests(response.data);
                setTotalCount(response.data.length);
            }
        } catch (err) {
            console.error("Failed to fetch requests:", err);
            setError("Failed to load requests from our community.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApprovedRequests(page);
    }, [page]);

    const handlePageChange = (newPage) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const categories = ["all", ...new Set(requests.map(r => r.category))];

    const filteredRequests =
        filterCategory === "all"
            ? requests
            : requests.filter((req) => req.category === filterCategory);

    const handleDonateToRequest = (request) => {
        navigate("../donate", {
            state: {
                prefill: {
                    item_name: request.item_name,
                    category: request.category,
                    quantity: request.quantity,
                    condition: request.condition,
                    description: `Donating this in response to a request: ${request.description || ''}`,
                    requestId: request.id
                },
                requestRequirements: {
                    minQuantity: request.quantity,
                    requiredCondition: request.condition,
                    itemName: request.item_name,
                    category: request.category
                }
            }
        });
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
            <div className="requested-items-container">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Finding items needed by others...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="requested-items-container">
            <BackButton />
            <div className="page-header">
                <div>
                    <h1>Requested Items</h1>
                    <p className="subtitle">Help fulfill needs from our community members</p>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {/* FILTERS */}
            <div className="inventory-filters">
                <div className="filter-group">
                    <label>Filter by Category:</label>
                    <div className="category-chips">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                className={`chip ${filterCategory === cat ? "active" : ""}`}
                                onClick={() => setFilterCategory(cat)}
                            >
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* REQUESTS LIST - Simplified Cards */}
            {filteredRequests.length > 0 ? (
                <div className="requests-table-grid">
                    {filteredRequests.map((request) => (
                        <div key={request.id} className="request-summary-card">
                            <div className="card-top-info">
                                <div className="category-tag-mini">{request.category}</div>
                                <h3>{request.item_name}</h3>
                            </div>

                            <div className="card-bottom-actions">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setSelectedRequest(request)}
                                >
                                    View Details
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => handleDonateToRequest(request)}
                                >
                                    Donate This
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-icon">🤝</div>
                    <h2>No open requests found</h2>
                    <p>Check back later or browse other ways to contribute.</p>
                </div>
            )}

            {requests.length > 0 && (
                <Pagination
                    currentPage={page}
                    totalPages={Math.ceil(totalCount / 10)}
                    onPageChange={handlePageChange}
                />
            )}

            {/* DETAILS MODAL - Premium Design */}
            {selectedRequest && (
                <div className="modal-overlay" onClick={() => setSelectedRequest(null)}>
                    <div className="request-details-modal" onClick={e => e.stopPropagation()}>
                        <button className="close-modal" onClick={() => setSelectedRequest(null)}>×</button>

                        <div className="modal-header-premium">
                            <h2>{selectedRequest.item_name}</h2>
                            <span className="status-badge-premium approved">
                                REQUESTED
                            </span>
                        </div>

                        <div className="modal-body-premium">
                            <div className="premium-detail-row">
                                <label>Category:</label>
                                <span>{selectedRequest.category}</span>
                            </div>
                            <div className="premium-detail-row">
                                <label>Quantity Needed:</label>
                                <span>{selectedRequest.quantity}</span>
                            </div>
                            <div className="premium-detail-row">
                                <label>Condition:</label>
                                <span>{getConditionLabel(selectedRequest.condition)}</span>
                            </div>

                            <div className="premium-description-section">
                                <label>Description:</label>
                                <p>{selectedRequest.description || "No description provided."}</p>
                            </div>

                            <div className="premium-detail-row highlight">
                                <label>Requested by:</label>
                                <span className="requester-badge">
                                    👤 {selectedRequest.receiver_name || "Community Member"}
                                </span>
                            </div>

                            <div className="modal-footer-date">
                                <small>Posted: {new Date(selectedRequest.created_at).toLocaleDateString()}</small>
                            </div>

                            <button
                                onClick={() => {
                                    handleDonateToRequest(selectedRequest);
                                    setSelectedRequest(null);
                                }}
                                className="btn-browse-large"
                            >
                                🎁 Donate This Item Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RequestedItems;

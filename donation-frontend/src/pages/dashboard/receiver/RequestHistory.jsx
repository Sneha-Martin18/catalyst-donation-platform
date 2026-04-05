import { useEffect, useState } from "react";
import StatusBadge from "../../../components/StatusBadge";
import DonationTimeline from "../../../components/DonationTimeline";
import api from "../../../api/api";
import BackButton from "../../../components/BackButton";
import Pagination from "../../../components/Pagination";
import "./RequestHistory.css";

function RequestHistory() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [sortBy, setSortBy] = useState("recent");
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    const fetchHistory = async (currentPage = 1) => {
        try {
            setLoading(true);
            // Fetching from receiver/orders/ which contains the history of items they ordered/received
            const res = await api.get(`receiver/orders/?page=${currentPage}`);
            if (res.data.results) {
                setOrders(res.data.results);
                setTotalCount(res.data.count);
            } else {
                setOrders(res.data);
                setTotalCount(res.data.length);
            }
        } catch (err) {
            setError("Failed to load request history");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory(page);
    }, [page]);

    const handlePageChange = (newPage) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Filter orders
    const filteredOrders = selectedCategory === "all"
        ? orders
        : orders.filter(o => o.donation.category === selectedCategory);

    // Sort orders
    const sortedOrders = [...filteredOrders].sort((a, b) => {
        if (sortBy === "recent") {
            return new Date(b.updated_at) - new Date(a.updated_at);
        }
        if (sortBy === "oldest") {
            return new Date(a.updated_at) - new Date(b.updated_at);
        }
        if (sortBy === "quantity") {
            return b.donation.quantity - a.donation.quantity;
        }
        return 0;
    });

    // Get unique categories
    const categories = ["all", ...new Set(orders.map(o => o.donation.category))];

    // Calculate stats
    const stats = {
        total: orders.length,
        received: orders.filter(o => o.status === "delivered" || o.status === "completed").length,
        active: orders.filter(o => ["pending", "approved", "assigned", "picked_up"].includes(o.status)).length,
    };

    if (loading) {
        return (
            <div className="request-history-page">
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>📜 Loading your request history...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="request-history-page">
                <div className="error-state">
                    <div className="error-icon">⚠️</div>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="request-history-page">
                <div className="empty-history">
                    <div className="empty-icon">📜</div>
                    <h2>No History Yet</h2>
                    <p>All items you request and receive will be tracked here once they are processed.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="request-history-page">
            <BackButton />
            <div className="history-header">
                <h1>Request History</h1>
                <p className="subtitle">Track all items you have requested and received</p>
            </div>

            {/* Impact Summary */}
            <div className="impact-summary">
                <div className="impact-card">
                    <div className="impact-icon">📦</div>
                    <div className="impact-content">
                        <div className="impact-value">{stats.total}</div>
                        <div className="impact-label">Total Orders</div>
                    </div>
                </div>
                <div className="impact-card">
                    <div className="impact-icon">🎁</div>
                    <div className="impact-content">
                        <div className="impact-value">{stats.received}</div>
                        <div className="impact-label">Items Received</div>
                    </div>
                </div>
                <div className="impact-card">
                    <div className="impact-icon">⏳</div>
                    <div className="impact-content">
                        <div className="impact-value">{stats.active}</div>
                        <div className="impact-label">Active Orders</div>
                    </div>
                </div>
            </div>

            {/* Filters and Sort */}
            <div className="history-controls">
                <div className="category-filter">
                    <label>Filter by Category:</label>
                    <div className="filter-chips">
                        {categories.map((category) => (
                            <button
                                key={category}
                                className={`chip ${selectedCategory === category ? "active" : ""}`}
                                onClick={() => setSelectedCategory(category)}
                            >
                                {category === "all" ? "All Categories" : category}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="sort-controls">
                    <label htmlFor="sort-select">Sort By:</label>
                    <select
                        id="sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="sort-select"
                    >
                        <option value="recent">Most Recent</option>
                        <option value="oldest">Oldest First</option>
                        <option value="quantity">Highest Quantity</option>
                    </select>
                </div>
            </div>

            {/* Timeline View */}
            <div className="history-timeline">
                {sortedOrders.map((order) => (
                    <div key={order.id} className="timeline-item">
                        <div className="timeline-marker"></div>
                        <div className="timeline-content">
                            <div className="donation-header">
                                <div>
                                    <h3>{order.donation.item_name}</h3>
                                    <p className="donation-meta">
                                        {order.donation.category} • Qty: {order.donation.quantity}
                                    </p>
                                </div>
                                <StatusBadge status={order.status} />
                            </div>

                            <div className="donation-info">
                                <div className="info-row">
                                    <span className="label">Delivery:</span>
                                    <span className="value">
                                        {order.delivery_type === 'self_pickup' ? '🏠 Self Pickup' : '🚲 Volunteer'}
                                    </span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Donor:</span>
                                    <span className="value">{order.donation.donor_name || 'Community Member'}</span>
                                </div>
                                <div className="info-row">
                                    <span className="label">Order Date:</span>
                                    <span className="value">
                                        {new Date(order.created_at).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </span>
                                </div>
                            </div>

                            <div className="donation-timeline-box">
                                <DonationTimeline status={order.status} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Pagination
                currentPage={page}
                totalPages={Math.ceil(totalCount / 10)}
                onPageChange={handlePageChange}
            />

            {sortedOrders.length === 0 && (
                <div className="no-matching">
                    <p>No records found in this category.</p>
                </div>
            )}
        </div>
    );
}

export default RequestHistory;

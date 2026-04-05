import { useState, useEffect } from "react";
import api from "../../../api/api";
import BackButton from "../../../components/BackButton";
import "./AssignVolunteers.css";

function AssignVolunteers() {
    const [orders, setOrders] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [assigningId, setAssigningId] = useState(null);
    const [selectedVolunteer, setSelectedVolunteer] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [ordersRes, volunteersRes] = await Promise.all([
                api.get("receiver/staff/donation-orders/?status=assigned"),
                api.get("receiver/staff/volunteers/"),
            ]);
            setOrders(ordersRes.data);
            setVolunteers(volunteersRes.data);
        } catch (err) {
            console.error("Failed to fetch data:", err);
            setError("Failed to load orders or volunteers.");
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (orderId) => {
        const volunteerId = selectedVolunteer[orderId];
        if (!volunteerId) {
            alert("Please select a volunteer first.");
            return;
        }

        try {
            setAssigningId(orderId);
            await api.patch(`receiver/staff/orders/${orderId}/assign-volunteer/`, {
                volunteer_id: volunteerId,
            });
            setSuccess("Volunteer assigned successfully!");
            // Remove the assigned order from the list
            setOrders(orders.filter((o) => o.id !== orderId));
            setTimeout(() => setSuccess(""), 3000);
        } catch (err) {
            console.error("Assignment failed:", err);
            alert(err.response?.data?.error || "Failed to assign volunteer.");
        } finally {
            setAssigningId(null);
        }
    };

    if (loading) return <div className="assign-volunteers"><h1>Assign Volunteers</h1><p>Loading...</p></div>;

    return (
        <div className="assign-volunteers">
            <BackButton />
            <div className="page-header">
                <h1>Manual Volunteer Assignment</h1>
                <p className="subtitle">Assign available volunteers to delivery tasks</p>
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {volunteers.length === 0 && (
                <div className="alert alert-info">
                    ⚠️ No available volunteers at the moment. Volunteers need to set their status to "Available" to appear here.
                </div>
            )}

            <div className="orders-grid">
                {orders.length > 0 ? (
                    orders.map((order) => (
                        <div key={order.id} className="assignment-card">
                            <div className="card-header">
                                <h3>{order.donation.item_name}</h3>
                                <span className="order-id">Order #{order.id}</span>
                            </div>

                            <div className="card-body">
                                <div className="detail-row">
                                    <label>Category:</label>
                                    <span>{order.donation.category || "N/A"}</span>
                                </div>
                                <div className="detail-row">
                                    <label>Quantity:</label>
                                    <span>{order.donation.quantity || "N/A"}</span>
                                </div>
                            </div>

                            <div className="card-footer">
                                <div className="assign-action">
                                    <select
                                        value={selectedVolunteer[order.id] || ""}
                                        onChange={(e) => setSelectedVolunteer({ ...selectedVolunteer, [order.id]: e.target.value })}
                                    >
                                        <option value="">Select Volunteer</option>
                                        {volunteers.map(v => (
                                            <option key={v.id} value={v.id}>{v.username} ({v.profile?.phone_number || 'No phone'})</option>
                                        ))}
                                    </select>
                                    <button
                                        className="btn-assign"
                                        onClick={() => handleAssign(order.id)}
                                        disabled={assigningId === order.id}
                                    >
                                        {assigningId === order.id ? "Assigning..." : "Assign"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-state">
                        <div className="empty-icon">✅</div>
                        <h2>No outstanding orders</h2>
                        <p>All items have been assigned or are waiting for orders.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AssignVolunteers;

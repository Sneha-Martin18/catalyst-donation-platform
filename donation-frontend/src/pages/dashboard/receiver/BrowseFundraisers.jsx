import { useState, useEffect } from "react";
import api from "../../../api/api";
import BackButton from "../../../components/BackButton";
import Pagination from "../../../components/Pagination";
import "./BrowseFundraisers.css";

function BrowseFundraisers() {
    const [fundraisers, setFundraisers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedFundraiser, setSelectedFundraiser] = useState(null);
    const [contributeAmount, setContributeAmount] = useState("");
    const [processing, setProcessing] = useState(false);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [recipientEmail, setRecipientEmail] = useState("");

    const [modalStep, setModalStep] = useState("amount"); // amount, payment, success
    const [selectedPayment, setSelectedPayment] = useState("upi");

    const fetchFundraisers = async (currentPage = 1) => {
        try {
            setLoading(true);
            setError("");
            const response = await api.get(`donation/fundraisers/?page=${currentPage}`);
            if (response.data.results) {
                setFundraisers(response.data.results);
                setTotalCount(response.data.count);
            } else {
                setFundraisers(response.data);
                setTotalCount(response.data.length);
            }
        } catch (err) {
            console.error("Failed to fetch fundraisers:", err);
            setError(`Failed to load fundraisers: ${err.response?.data?.detail || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFundraisers(page);
    }, [page]);

    const handlePageChange = (newPage) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleProceedToPayment = (e) => {
        e.preventDefault();
        const amount = parseFloat(contributeAmount);
        if (!amount || amount <= 0) {
            alert("Please enter a valid amount");
            return;
        }
        setModalStep("payment");
    };

    const handleContribute = async () => {
        const amount = parseFloat(contributeAmount);

        setProcessing(true);
        console.log(`🔄 Processing ${selectedPayment} payment for amount:`, amount);

        try {
            // Manual contribution flow
            console.log("📡 Calling contribute API...");
            const response = await api.post(`donation/${selectedFundraiser.id}/contribute/`, {
                amount: amount
            });

            console.log("✅ Contribution successful");
            if (response.data.recipient_email) {
                setRecipientEmail(response.data.recipient_email);
            }
            setModalStep("success");
            fetchFundraisers();
        } catch (err) {
            console.error("❌ Contribution failed:", err);
            const errorMessage = err.response?.data?.detail || err.response?.data?.error || err.message;
            alert(`Failed to process contribution: ${errorMessage}`);
            setProcessing(false);
        }
    };

    const handleCloseModal = () => {
        setSelectedFundraiser(null);
        setContributeAmount("");
        setModalStep("amount");
        setProcessing(false);
    };

    if (loading) return <div className="fundraisers-page"><p className="loading">Loading fundraisers...</p></div>;

    return (
        <div className="fundraisers-page">
            <BackButton />
            <div className="page-header">
                <h1>Community Fundraisers</h1>
                <p className="subtitle">Support meaningful causes and organizations</p>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <div className="fundraisers-grid">
                {fundraisers.length > 0 ? (
                    fundraisers.map((f) => {
                        const goal = parseFloat(f.goal_amount);
                        const raised = parseFloat(f.raised_amount);
                        const progress = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;
                        return (
                            <div key={f.id} className="fundraiser-card">
                                <div className="card-badge">{f.category}</div>
                                <div className="card-top">
                                    <h3>{f.item_name}</h3>
                                    <p className="org-name">by {f.organization_name || "Community Member"}</p>
                                </div>

                                <div className="card-content">
                                    <p className="description">{f.description}</p>

                                    <div className="progress-section">
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                                        </div>
                                        <div className="progress-stats">
                                            <span className="raised">₹{raised.toLocaleString()}</span>
                                            <span className="goal">Goal: ₹{goal.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {f.target_date && (
                                        <p className="target-date">Ends on: {new Date(f.target_date).toLocaleDateString()}</p>
                                    )}
                                </div>

                                <div className="card-actions">
                                    <button
                                        className="btn-contribute"
                                        onClick={() => setSelectedFundraiser(f)}
                                    >
                                        💖 Contribute
                                    </button>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="empty-state">No active fundraisers found.</div>
                )}
            </div>

            <Pagination
                currentPage={page}
                totalPages={Math.ceil(totalCount / 10)}
                onPageChange={handlePageChange}
            />

            {/* Contribution Modal */}
            {selectedFundraiser && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        {modalStep === "amount" ? (
                            <>
                                <h2>Support: {selectedFundraiser.item_name}</h2>
                                <p>Your contribution will directly help this cause.</p>
                                <form onSubmit={handleProceedToPayment} className="contribute-form">
                                    <div className="form-group">
                                        <label>Amount (INR)</label>
                                        <input
                                            type="number"
                                            min="1"
                                            placeholder="Enter amount to donate"
                                            value={contributeAmount}
                                            onChange={(e) => setContributeAmount(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="modal-actions">
                                        <button type="button" className="btn-cancel" onClick={handleCloseModal}>CANCEL</button>
                                        <button type="submit" className="btn-submit">Confirm Contribution</button>
                                    </div>
                                </form>
                            </>
                        ) : modalStep === "payment" ? (
                            <div className="payment-step">
                                <h2>Select payment method</h2>
                                <p className="payment-subtitle">Preferred method with secure transactions.</p>

                                <div className="payment-options">
                                    {[
                                        { id: "upi", name: "UPI", icon: "UPI" },
                                        { id: "card", name: "Credit/Debit/ATM card", icon: "CARD" },
                                        { id: "netbanking", name: "Net banking", icon: "NET" }
                                    ].map((method) => (
                                        <div
                                            key={method.id}
                                            className={`payment-option ${selectedPayment === method.id ? "selected" : ""}`}
                                            onClick={() => setSelectedPayment(method.id)}
                                        >
                                            <div className="method-info">
                                                <span className={`method-icon icon-${method.id}`}>{method.icon}</span>
                                                <span className="method-name">{method.name}</span>
                                            </div>
                                            <div className="method-checkbox">
                                                {selectedPayment === method.id && <span className="check-mark">✓</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="payment-actions">
                                    <button
                                        className="btn-continue"
                                        onClick={handleContribute}
                                        disabled={processing}
                                    >
                                        {processing ? "Processing..." : "Continue"}
                                    </button>
                                    <button
                                        className="btn-go-back"
                                        onClick={() => setModalStep("amount")}
                                        disabled={processing}
                                    >
                                        Go Back
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="success-step">
                                <div className="success-icon">
                                    <div className="check-ring">✓</div>
                                </div>
                                <h2 className="success-title">Payment Confirmed!</h2>
                                <p className="success-subtitle-text">Thank you for your payment.<br />Your payment has been processed successfully.</p>

                                <div className="receipt-card">
                                    <p className="paid-label">You have paid</p>
                                    <p className="paid-amount">₹{parseFloat(contributeAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                    <p className="txn-id">TRANSACTION ID: TXN{Math.floor(10000000 + Math.random() * 90000000)}</p>

                                    <div className="receipt-footer">
                                        <p className="receipt-date">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                        <p className="receipt-note">
                                            {recipientEmail
                                                ? `We've sent a confirmation email to ${recipientEmail} for your records.`
                                                : "We've sent a confirmation email with your receipt for your records."
                                            }
                                        </p>
                                    </div>
                                </div>

                                <button className="btn-back-home" onClick={handleCloseModal}>
                                    Back to Fundraisers →
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default BrowseFundraisers;

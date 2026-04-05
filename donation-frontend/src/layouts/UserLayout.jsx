import { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/api";
import { useUser } from "../context/UserContext"; // Import useUser
import VerificationModal from "../components/VerificationModal";
import ChatBot from "../components/ChatBot";
import LogicGame from "../components/LogicPuzzle/LogicGame";
import "./UserLayout.css";

function UserLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, setUser, isVerified, loading, refreshUser } = useUser(); // Use context
    const [isModalOpen, setIsModalOpen] = useState(false);

    // No need for local fetchVerificationStatus anymore

    const handleLogout = () => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        localStorage.removeItem("role");
        localStorage.removeItem("username");
        setUser(null); // Clear context
        navigate("/login");
    };

    const handleNavClick = (e, path) => {
        // Paths that don't require verification
        const whiteList = ["/dashboard/user", "/profile", "/dashboard/user/", "/dashboard/user/about"];

        if (!loading && !isVerified && !whiteList.includes(path)) {
            e.preventDefault();
            setIsModalOpen(true);
        }
    };

    const isActive = (path) => {
        if (path.startsWith("/")) return location.pathname === path;
        const segments = location.pathname.split("/");
        return segments.includes(path);
    };

    const isHome = location.pathname === "/dashboard/user";

    return (
        <div className="user-layout">
            {/* SIDEBAR */}
            <aside className="user-sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <span className="logo-icon">🎁</span>
                        <span className="logo-text">CATALYST</span>
                    </div>
                    <p className="sidebar-tag">Portal • Dashboard</p>
                </div>

                <nav className="sidebar-nav">
                    <Link
                        to="/dashboard/user"
                        className={`nav-link ${isHome ? "active" : ""}`}
                    >
                        <span className="icon">📊</span>
                        <span>Dashboard Home</span>
                    </Link>

                    <div className="nav-section">
                        <p className="nav-section-title">🎁 Donor</p>
                        <Link
                            to="/dashboard/user/donate"
                            className={`nav-link ${isActive("donate") ? "active" : ""}`}
                            onClick={(e) => handleNavClick(e, "/dashboard/user/donate")}
                        >
                            <span className="icon">➕</span>
                            <span>New Donation</span>
                        </Link>
                        <Link
                            to="/dashboard/user/requested-items"
                            className={`nav-link ${isActive("requested-items") ? "active" : ""}`}
                            onClick={(e) => handleNavClick(e, "/dashboard/user/requested-items")}
                        >
                            <span className="icon">📋</span>
                            <span>Requested Items</span>
                        </Link>
                        <Link
                            to="/dashboard/user/donations"
                            className={`nav-link ${isActive("donations") ? "active" : ""}`}
                            onClick={(e) => handleNavClick(e, "/dashboard/user/donations")}
                        >
                            <span className="icon">📦</span>
                            <span>My Donations</span>
                        </Link>
                        <Link
                            to="/dashboard/user/donor-history"
                            className={`nav-link ${isActive("donor-history") ? "active" : ""}`}
                            onClick={(e) => handleNavClick(e, "/dashboard/user/donor-history")}
                        >
                            <span className="icon">📜</span>
                            <span>History</span>
                        </Link>
                        <Link
                            to="/dashboard/user/live-campaigns"
                            className={`nav-link ${isActive("live-campaigns") ? "active" : ""}`}
                            onClick={(e) => handleNavClick(e, "/dashboard/user/live-campaigns")}
                        >
                            <span className="icon">🔴</span>
                            <span>Live Campaigns</span>
                        </Link>
                    </div>

                    <div className="nav-section">
                        <p className="nav-section-title">🙋 Receiver</p>
                        <Link
                            to="/dashboard/user/request"
                            className={`nav-link ${isActive("request") ? "active" : ""}`}
                            onClick={(e) => handleNavClick(e, "/dashboard/user/request")}
                        >
                            <span className="icon">📋</span>
                            <span>Request Item</span>
                        </Link>
                        <Link
                            to="/dashboard/user/my-requests"
                            className={`nav-link ${isActive("my-requests") ? "active" : ""}`}
                            onClick={(e) => handleNavClick(e, "/dashboard/user/my-requests")}
                        >
                            <span className="icon">🔍</span>
                            <span>My Requests</span>
                        </Link>
                        <Link
                            to="/dashboard/user/browse"
                            className={`nav-link ${isActive("browse") ? "active" : ""}`}
                            onClick={(e) => handleNavClick(e, "/dashboard/user/browse")}
                        >
                            <span className="icon">🌐</span>
                            <span>Browse Items</span>
                        </Link>
                        <Link
                            to="/dashboard/user/fundraisers"
                            className={`nav-link ${isActive("fundraisers") ? "active" : ""}`}
                            onClick={(e) => handleNavClick(e, "/dashboard/user/fundraisers")}
                        >
                            <span className="icon">💰</span>
                            <span>Fundraisers</span>
                        </Link>
                        <Link
                            to="/dashboard/user/recommendations"
                            className={`nav-link ${isActive("recommendations") ? "active" : ""}`}
                            onClick={(e) => handleNavClick(e, "/dashboard/user/recommendations")}
                        >
                            <span className="icon">✨</span>
                            <span>AI Suggestions</span>
                        </Link>
                        <Link
                            to="/dashboard/user/my-orders"
                            className={`nav-link ${isActive("my-orders") ? "active" : ""}`}
                            onClick={(e) => handleNavClick(e, "/dashboard/user/my-orders")}
                        >
                            <span className="icon">📦</span>
                            <span>My Orders</span>
                        </Link>
                        <Link
                            to="/dashboard/user/request-history"
                            className={`nav-link ${isActive("request-history") ? "active" : ""}`}
                            onClick={(e) => handleNavClick(e, "/dashboard/user/request-history")}
                        >
                            <span className="icon">📜</span>
                            <span>Request History</span>
                        </Link>

                    </div>

                    <div className="nav-section">
                        <p className="nav-section-title">🤝 Volunteer</p>
                        <Link
                            to="/dashboard/user/volunteer"
                            className={`nav-link ${isActive("volunteer") ? "active" : ""}`}
                            onClick={(e) => handleNavClick(e, "/dashboard/user/volunteer")}
                        >
                            <span className="icon">🤝</span>
                            <span>Volunteer Portal</span>
                        </Link>
                        <Link
                            to="/dashboard/user/volunteer-history"
                            className={`nav-link ${isActive("volunteer-history") ? "active" : ""}`}
                            onClick={(e) => handleNavClick(e, "/dashboard/user/volunteer-history")}
                        >
                            <span className="icon">🕒</span>
                            <span>History</span>
                        </Link>

                    </div>

                    <div className="nav-section">
                        <p className="nav-section-title">👤 Account</p>
                        <Link to="/profile" className={`nav-link ${isActive("/profile") ? "active" : ""}`}>
                            <span className="icon">👤</span>
                            <span>Profile</span>
                        </Link>
                        <Link
                            to="/dashboard/user/about"
                            className={`nav-link ${isActive("about") ? "active" : ""}`}
                        >
                            <span className="icon">ℹ️</span>
                            <span>About Catalyst</span>
                        </Link>
                        <button className="nav-link logout-btn" onClick={handleLogout}>
                            <span className="icon">🚪</span>
                            <span>Logout</span>
                        </button>
                    </div>
                </nav>
            </aside>

            {/* MAIN CONTENT */}
            <main className="user-main">
                <Outlet context={{ user, isVerified, loading, setIsModalOpen }} />
            </main>

            {/* CHATBOT */}
            <ChatBot />

            {/* VERIFICATION MODAL */}
            <VerificationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />

            {/* LOGIC GAME */}
            <LogicGame />
        </div>
    );
}

export default UserLayout;

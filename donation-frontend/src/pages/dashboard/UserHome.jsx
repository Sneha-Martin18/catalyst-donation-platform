import { Link, useOutletContext } from "react-router-dom";
import api from "../../api/api";
import { useUser } from "../../context/UserContext";
import RecommendationEngine from "../../components/Recommendations/RecommendationEngine";
import "./UserHome.css";
import RewardHistory from "../../components/LogicPuzzle/RewardHistory";

function UserHome() {
    const { user, isVerified } = useUser();
    const { setIsModalOpen } = useOutletContext();
    const username = user?.username || localStorage.getItem("username") || "User";

    const handleActionClick = (e) => {
        if (!isVerified) {
            e.preventDefault();
            setIsModalOpen(true);
        }
    };

    return (
        <div className="user-home">
            <header className="home-header">
                <div className="header-greeting">
                    <span className="welcome-tag">DASHBOARD</span>
                    <h1>Welcome back, <span className="user-name">{username}</span>! 👋</h1>
                    <p>Manage your impact, browse donations, or assist the community from your central hub.</p>
                </div>
            </header>

            <div className="features-grid">
                {/* DONOR CARD */}
                <div className="feature-card donor">
                    <div className="card-badge">ACTIVE</div>
                    <div className="card-icon-wrap">
                        <span className="card-icon">🎁</span>
                    </div>
                    <div className="card-body">
                        <h2>Donation Center</h2>
                        <p>Share items you no longer need with those who do. Track your giving impact.</p>
                        <div className="card-links">
                            <Link to="/dashboard/user/donate" className="btn btn-main" onClick={handleActionClick}>Start Donating</Link>
                            <Link to="/dashboard/user/donations" className="btn btn-muted" onClick={handleActionClick}>My History</Link>
                        </div>
                    </div>
                </div>

                {/* RECEIVER CARD */}
                <div className="feature-card receiver">
                    <div className="card-badge">EXPLORE</div>
                    <div className="card-icon-wrap">
                        <span className="card-icon">🙋</span>
                    </div>
                    <div className="card-body">
                        <h2>Recipient Hub</h2>
                        <p>Browse available community donations or create a request for specific essentials.</p>
                        <div className="card-links">
                            <Link to="/dashboard/user/browse" className="btn btn-main" onClick={handleActionClick}>Browse Items</Link>
                            <Link to="/dashboard/user/request" className="btn btn-muted" onClick={handleActionClick}>New Request</Link>
                        </div>
                    </div>
                </div>

                {/* VOLUNTEER CARD */}
                <div className="feature-card volunteer">
                    <div className="card-badge">SERVICE</div>
                    <div className="card-icon-wrap">
                        <span className="card-icon">🤝</span>
                    </div>
                    <div className="card-body">
                        <h2>Volunteer Portal</h2>
                        <p>Assist with deliveries and verify donations. Directly support your local community.</p>
                        <div className="card-links">
                            <Link to="/dashboard/user/volunteer" className="btn btn-main" onClick={handleActionClick}>Enter Portal</Link>
                            <Link to="/dashboard/user/volunteer-profile" className="btn btn-muted" onClick={handleActionClick}>My ID</Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI RECOMMENDATIONS SECTION */}
            <div
                className={`recommendations-container ${!isVerified ? 'unverified-blur' : ''}`}
                style={{ margin: '40px 0', position: 'relative' }}
                onClickCapture={!isVerified ? handleActionClick : undefined}
            >
                <RecommendationEngine />
                {!isVerified && (
                    <div className="verification-overlay">
                        <div className="overlay-content">
                            <span className="lock-icon">🔒</span>
                            <h3>Personalized Suggestions Locked</h3>
                            <button className="btn btn-main" onClick={handleActionClick}>Verify to Unlock</button>
                        </div>
                    </div>
                )}
            </div>

            {/* REWARD HISTORY CARD */}
            <div className="feature-card reward-history" style={{ marginTop: '20px' }}>
                <div className="card-badge">ACHIEVEMENTS</div>
                <div className="card-icon-wrap">
                    <span className="card-icon">🏆</span>
                </div>
                <div className="card-body">
                    <h2>Your Rewards</h2>
                    <RewardHistory />
                </div>
            </div>
        </div>
    );
}

export default UserHome;

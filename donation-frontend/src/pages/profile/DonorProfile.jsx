import { useEffect, useState } from "react";
import api from "../../api/api";
import ProfileCard from "./ProfileCard";
import AadhaarVerification from "./AadhaarVerification";

function DonorProfile({ profile, refreshProfile, onEditClick }) {
  const [donations, setDonations] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    verified: 0,
    delivered: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const res = await api.get("/donation/my-donations/");
        setDonations(res.data || []);

        // Calculate stats
        const statsData = {
          total: res.data?.length || 0,
          pending: res.data?.filter((d) => d.status === "pending").length || 0,
          verified: res.data?.filter((d) => d.status === "verified").length || 0,
          delivered:
            res.data?.filter((d) => d.status === "delivered").length || 0,
        };
        setStats(statsData);
      } catch (err) {
        console.error("Failed to load donations", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, []);

  return (
    <div className="role-profile donor-profile">
      {/* Profile Card */}
      <div className="profile-card-section">
        <ProfileCard profile={profile} onEditClick={onEditClick} />
      </div>

      {/* Aadhaar Verification */}
      <AadhaarVerification profile={profile} onVerified={refreshProfile} />

      <h2>Donor Dashboard</h2>

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card total">
          <span className="stat-icon">📦</span>
          <p className="stat-number">{stats.total}</p>
          <p className="stat-label">Total Donations</p>
        </div>

        <div className="stat-card pending">
          <span className="stat-icon">⏳</span>
          <p className="stat-number">{stats.pending}</p>
          <p className="stat-label">Pending</p>
        </div>

        <div className="stat-card verified">
          <span className="stat-icon">✓</span>
          <p className="stat-number">{stats.verified}</p>
          <p className="stat-label">Verified</p>
        </div>

        <div className="stat-card delivered">
          <span className="stat-icon">🚚</span>
          <p className="stat-number">{stats.delivered}</p>
          <p className="stat-label">Delivered</p>
        </div>
      </div>

      {/* Recent Donations */}
      <div className="donations-section">
        <h3>Recent Donations</h3>

        {loading ? (
          <p className="loading-text">Loading donations...</p>
        ) : donations.length === 0 ? (
          <p className="empty-text">No donations yet. Start contributing!</p>
        ) : (
          <div className="donations-list">
            {donations.slice(0, 5).map((donation) => (
              <div key={donation.id} className="donation-item">
                <div className="donation-header">
                  <h4>{donation.item_name}</h4>
                  <span className={`status-badge ${donation.status}`}>
                    {donation.status}
                  </span>
                </div>
                <p className="donation-detail">
                  <strong>Category:</strong> {donation.category}
                </p>
                <p className="donation-detail">
                  <strong>Quantity:</strong> {donation.quantity}
                </p>
                <p className="donation-detail">
                  <strong>Condition:</strong> {donation.condition}
                </p>
                <p className="donation-detail timestamp">
                  {new Date(donation.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DonorProfile;

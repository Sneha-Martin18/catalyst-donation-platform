import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";
import "./Profile.css";
import DonorProfileView from "./DonorProfileView";
import ReceiverProfileView from "./ReceiverProfileView";
import VolunteerProfileView from "./VolunteerProfileView";

function UserProfileView() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/users/profile/${userId}/`);
        setProfile(res.data);
        setError(null);
      } catch (err) {
        console.error("Failed to load user profile", err);
        setError("User not found or profile unavailable");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  // Loading State
  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !profile) {
    return (
      <div className="profile-container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div className="error-message">
          <p>{error || "Profile not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      {/* User Public Profile Card */}
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            <span className="avatar-emoji">{getRoleEmoji(profile.role)}</span>
          </div>
          <div className="profile-info">
            <h1>{profile.username}</h1>
            <p className="role-badge">{profile.role.toUpperCase()}</p>
            {profile.email && <p className="email">{profile.email}</p>}
          </div>
        </div>

        <div className="profile-details">
          {profile.profile?.address && (
            <div className="detail-row">
              <span className="label">📍 Location:</span>
              <span className="value">{profile.profile.address}</span>
            </div>
          )}

          {profile.profile?.phone_number && (
            <div className="detail-row">
              <span className="label">📱 Phone:</span>
              <span className="value">{profile.profile.phone_number}</span>
            </div>
          )}

          {profile.profile?.rating !== undefined && (
            <div className="detail-row">
              <span className="label">⭐ Rating:</span>
              <span className="value rating">
                {"⭐".repeat(Math.floor(profile.profile.rating))} (
                {profile.profile.rating.toFixed(1)})
              </span>
            </div>
          )}

          {profile.date_of_birth && (
            <div className="detail-row">
              <span className="label">📅 Joined:</span>
              <span className="value">{profile.date_of_birth}</span>
            </div>
          )}
        </div>
      </div>

      {/* Role-specific content */}
      {profile.role === "donor" && <DonorProfileView userId={userId} />}
      {profile.role === "receiver" && <ReceiverProfileView userId={userId} />}
      {profile.role === "volunteer" && <VolunteerProfileView userId={userId} />}
    </div>
  );
}

function getRoleEmoji(role) {
  const emojiMap = {
    admin: "👨‍💼",
    donor: "🎁",
    receiver: "🙏",
    volunteer: "👥",
  };
  return emojiMap[role] || "👤";
}

export default UserProfileView;

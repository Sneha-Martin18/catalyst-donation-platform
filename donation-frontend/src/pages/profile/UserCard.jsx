import { useNavigate } from "react-router-dom";
import "./Profile.css";

function UserCard({ user, onViewProfile }) {
  const navigate = useNavigate();

  const getRoleEmoji = (role) => {
    const emojiMap = {
      admin: "👨‍💼",
      donor: "🎁",
      receiver: "🙏",
      volunteer: "👥",
    };
    return emojiMap[role] || "👤";
  };

  const handleViewProfile = () => {
    if (onViewProfile) {
      onViewProfile(user.id);
    } else {
      navigate(`/user-profile/${user.id}`);
    }
  };

  return (
    <div className="user-card">
      <div className="user-card-avatar">
        <span className="user-card-emoji">{getRoleEmoji(user.role)}</span>
      </div>

      <div className="user-card-content">
        <h3 className="user-card-name">{user.username}</h3>
        <p className="user-card-role">{user.role.toUpperCase()}</p>

        {user.profile?.address && (
          <p className="user-card-address">📍 {user.profile.address}</p>
        )}

        {user.profile?.rating && (
          <p className="user-card-rating">
            ⭐ {user.profile.rating.toFixed(1)} rating
          </p>
        )}

        {user.volunteer_code && (
          <p className="user-card-code">🆔 {user.volunteer_code}</p>
        )}
      </div>

      <button className="user-card-btn" onClick={handleViewProfile}>
        View Profile →
      </button>
    </div>
  );
}

export default UserCard;

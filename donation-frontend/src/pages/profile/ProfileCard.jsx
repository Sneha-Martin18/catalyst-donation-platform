import "./Profile.css";

function ProfileCard({ profile, stats, onEditClick, children }) {
  const getRoleEmoji = (role) => {
    const emojiMap = {
      admin: "👨‍💼",
      donor: "🎁",
      receiver: "🙏",
      volunteer: "👥",
    };
    return emojiMap[role] || "👤";
  };

  // Default banner images based on role
  const getBannerImage = (role) => {
    switch (role) {
      case 'volunteer':
        return "https://images.unsplash.com/photo-1559027615-cd4628902d4a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"; // Crowd/Hands
      case 'donor':
        return "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"; // Gift/Charity
      case 'receiver':
        return "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"; // Hope/Support
      default:
        return "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"; // Gradient
    }
  };

  return (
    <div className="profile-card-container">
      {/* Banner Section */}
      <div
        className="profile-banner"
        style={{ backgroundImage: `url(${getBannerImage(profile.role)})` }}
      >
        {onEditClick && (
          <button onClick={onEditClick} className="btn-edit-round" title="Edit Profile">
            ✎
          </button>
        )}
      </div>

      {/* Profile Content */}
      <div className="profile-content">
        {/* Avatar */}
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar">
            {profile.profile_picture ? (
              <img
                src={profile.profile_picture}
                alt="Profile"
                className="avatar-image"
              />
            ) : (
              <span className="avatar-emoji">{getRoleEmoji(profile.role)}</span>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="profile-text">
          <h1 className="profile-name">
            {profile.first_name || profile.username || "User"} {profile.last_name || ""}
          </h1>
          <p className="profile-role">
            {profile.role === 'volunteer' ? 'Community Volunteer' :
              profile.role === 'donor' ? 'Generous Donor' :
                profile.role === 'receiver' ? 'Community Member' :
                  profile.role.toUpperCase()}
          </p>
          <p className="profile-bio">
            {profile.email}
            {profile.volunteer_code && <span> • {profile.volunteer_code}</span>}
          </p>

          <div className="profile-tags">
            {profile.address && (
              <span className="tag location">📍 {profile.address}</span>
            )}
            {/* Display Volunteer Rating if role is volunteer or if rating exists */}
            {(profile.role === 'volunteer' || profile.rating > 0) && (
              <span className="tag rating">⭐ {profile.rating?.toFixed(1) || "0.0"} Rating</span>
            )}
          </div>
        </div>

        {/* Stats Section */}
        {stats && stats.length > 0 && (
          <div className="profile-stats-card">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Custom Dashboard Content */}
        {children && (
          <div className="profile-dashboard-content">
            {children}
          </div>
        )}

      </div>
    </div>
  );
}

export default ProfileCard;

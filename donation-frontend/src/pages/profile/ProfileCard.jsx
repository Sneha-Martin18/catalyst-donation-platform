import "./Profile.css";

function ProfileCard({ profile, onEditClick }) {
  const getRoleEmoji = (role) => {
    const emojiMap = {
      admin: "👨‍💼",
      donor: "🎁",
      receiver: "🙏",
      volunteer: "👥",
    };
    return emojiMap[role] || "👤";
  };

  return (
    <div className="profile-card">
      <div className="profile-header">
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
        <div className="profile-info">
          <h1>
            {profile.first_name || profile.username} {profile.last_name || ""}
          </h1>
          <p className="role-badge">{profile.role.toUpperCase()}</p>
          {profile.volunteer_code && (
            <p className="volunteer-code">{profile.volunteer_code}</p>
          )}
          {profile.email && <p className="email">{profile.email}</p>}
        </div>
        {onEditClick && (
          <button onClick={onEditClick} className="btn-edit">
            ✎ Edit Profile
          </button>
        )}
      </div>

      <div className="profile-details">
        {profile.first_name && (
          <div className="detail-row">
            <span className="label">First Name:</span>
            <span className="value">{profile.first_name}</span>
          </div>
        )}

        {profile.last_name && (
          <div className="detail-row">
            <span className="label">Last Name:</span>
            <span className="value">{profile.last_name}</span>
          </div>
        )}

        <div className="detail-row">
          <span className="label">Email:</span>
          <span className="value">{profile.email || "Not provided"}</span>
        </div>

        {profile.phone_number && (
          <div className="detail-row">
            <span className="label">Phone:</span>
            <span className="value">{profile.phone_number}</span>
          </div>
        )}

        {profile.address && (
          <div className="detail-row">
            <span className="label">Address:</span>
            <span className="value">{profile.address}</span>
          </div>
        )}

        {profile.date_of_birth && (
          <div className="detail-row">
            <span className="label">Date of Birth:</span>
            <span className="value">{profile.date_of_birth}</span>
          </div>
        )}

        {profile.rating !== undefined && profile.rating > 0 && (
          <div className="detail-row">
            <span className="label">Rating:</span>
            <span className="value rating">
              {"⭐".repeat(Math.floor(profile.rating))} (
              {profile.rating.toFixed(1)})
            </span>
          </div>
        )}

        {profile.aadhaar_verified && (
          <div className="detail-row">
            <span className="label">Aadhaar Status:</span>
            <span className="value verified">✓ Verified</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileCard;

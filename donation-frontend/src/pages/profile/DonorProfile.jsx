import { useEffect, useState } from "react";
import api from "../../api/api";
import ProfileCard from "./ProfileCard";
import EmailVerification from "./EmailVerification";

function DonorProfile({ profile, refreshProfile, onEditClick }) {
  return (
    <div className="role-profile donor-profile">
      {/* Profile Card with Dashboard Content */}
      <div className="profile-card-section">
        <ProfileCard
          profile={profile}
          onEditClick={onEditClick}
        >
          {/* Email Verification */}
          <div className="dashboard-section">
            <EmailVerification profile={profile} onVerified={refreshProfile} />
          </div>

          {/* Removed redundant dashboard stats */}
        </ProfileCard>
      </div>
    </div>
  );
}

export default DonorProfile;

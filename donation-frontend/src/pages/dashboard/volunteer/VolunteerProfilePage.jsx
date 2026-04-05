import { useState, useEffect, useCallback } from "react";
import api from "../../../api/api";
import { useUser } from "../../../context/UserContext"; // Import useUser
import BackButton from "../../../components/BackButton";
import ProfileCard from "../../profile/ProfileCard";
import EmailVerification from "../../profile/EmailVerification";
import "../../profile/Profile.css"; // Reuse existing profile styles

function VolunteerProfilePage() {
    const { user, refreshUser } = useUser(); // Get from context
    const [loading, setLoading] = useState(!user);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [profilePicture, setProfilePicture] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        first_name: user?.first_name || "",
        last_name: user?.last_name || "",
        phone_number: user?.phone_number || "",
        address: user?.address || "",
        date_of_birth: user?.date_of_birth || "",
    });

    const BASE_URL = import.meta.env.VITE_API_BASE_URL;

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || "",
                last_name: user.last_name || "",
                phone_number: user.phone_number || "",
                address: user.address || "",
                date_of_birth: user.date_of_birth || "",
            });
            setLoading(false);
        } else {
            refreshUser();
        }
    }, [user, refreshUser]);

    const fetchProfile = refreshUser; // For backward compatibility if needed internally

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleProfilePictureChange = (e) => {
        const file = e.target.files[0];
        if (file) setProfilePicture(file);
    };

    const saveProfile = async () => {
        setIsSaving(true);
        try {
            const data = new FormData();
            Object.entries(formData).forEach(([key, value]) =>
                data.append(key, value)
            );
            if (profilePicture) data.append("profile_picture", profilePicture);

            await api.put("/users/profile/", data);
            refreshUser();
            setIsEditing(false);
            setProfilePicture(null);
            alert("Profile updated successfully");
        } catch (err) {
            console.error(err);
            alert("Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    const cancelEdit = () => {
        setIsEditing(false);
        setProfilePicture(null);
        setFormData({
            first_name: user.first_name || "",
            last_name: user.last_name || "",
            phone_number: user.phone_number || "",
            address: user.address || "",
            date_of_birth: user.date_of_birth || "",
        });
    };

    if (loading) {
        return <div className="profile-container"><p>Loading profile...</p></div>;
    }

    if (error || !user) {
        return <div className="profile-container"><p>{error || "Profile not found"}</p></div>;
    }

    return (
        <div className="profile-container" style={{ padding: '0 2rem' }}>
            <BackButton />
            {/* Added padding to match dashboard layout */}

            {!isEditing ? (
                <>
                    <div className="profile-card-section">
                        <ProfileCard profile={user} onEditClick={() => setIsEditing(true)} />
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        <EmailVerification profile={user} onVerified={fetchProfile} />
                    </div>
                </>
            ) : (
                <div className="profile-edit-modal" style={{ position: 'static', background: 'none', padding: 0 }}>
                    {/* Reuse CSS classes but override modal positioning for dashboard inline edit if preferred, 
              or keep it as modal. The current CSS class `profile-edit-modal` likely fixes it to screen. 
              Let's keep it consistent with the main profile page for now. 
          */}
                    <div className="profile-edit-form">
                        <h2>Edit Profile</h2>

                        {/* Profile Picture Preview */}
                        <div className="form-group">
                            <label>Profile Picture</label>
                            <div className="profile-picture-preview">
                                {profilePicture ? (
                                    <img
                                        src={URL.createObjectURL(profilePicture)}
                                        alt="Preview"
                                    />
                                ) : user.profile_picture ? (
                                    <img
                                        src={`${BASE_URL}${user.profile_picture}`}
                                        alt="Profile"
                                    />
                                ) : (
                                    <div className="placeholder">No image</div>
                                )}
                            </div>

                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleProfilePictureChange}
                            />
                        </div>

                        {["first_name", "last_name", "phone_number", "date_of_birth"].map(
                            (field) => (
                                <div className="form-group" key={field}>
                                    <label>{field.replace("_", " ").toUpperCase()}</label>
                                    <input
                                        type="text"
                                        name={field}
                                        value={formData[field]}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            )
                        )}

                        <div className="form-group">
                            <label>Address</label>
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="form-actions">
                            <button
                                onClick={saveProfile}
                                disabled={isSaving}
                                className="btn-primary"
                            >
                                {isSaving ? "Saving..." : "Save Changes"}
                            </button>
                            <button onClick={cancelEdit} className="btn-secondary">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default VolunteerProfilePage;

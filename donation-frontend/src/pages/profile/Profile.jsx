import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/api";
import "./Profile.css";
import DonorProfile from "./DonorProfile";
import ReceiverProfile from "./ReceiverProfile";
import VolunteerProfile from "./VolunteerProfile";
import AdminProfile from "./AdminProfile";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    address: "",
    date_of_birth: "",
  });

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get("/users/profile/");
      setProfile(res.data);
      setFormData({
        first_name: res.data.first_name || "",
        last_name: res.data.last_name || "",
        phone_number: res.data.phone_number || "",
        address: res.data.address || "",
        date_of_birth: res.data.date_of_birth || "",
      });
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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

      const res = await api.put("/users/profile/", data);
      setProfile(res.data);
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
      first_name: profile.first_name || "",
      last_name: profile.last_name || "",
      phone_number: profile.phone_number || "",
      address: profile.address || "",
      date_of_birth: profile.date_of_birth || "",
    });
  };

  if (loading) {
    return (
      <div className="profile-container">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="profile-container">
        <p>{error || "Profile not found"}</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-back-button">
        <button
          onClick={() => navigate(`/dashboard/${profile.role}`)}
          className="btn-back"
        >
          ← Back to Dashboard
        </button>
      </div>

      {!isEditing && profile.role === "donor" && (
        <DonorProfile profile={profile} onEditClick={() => setIsEditing(true)} />
      )}
      {!isEditing && profile.role === "receiver" && (
        <ReceiverProfile profile={profile} onEditClick={() => setIsEditing(true)} />
      )}
      {!isEditing && profile.role === "volunteer" && (
        <VolunteerProfile profile={profile} onEditClick={() => setIsEditing(true)} />
      )}
      {!isEditing && profile.role === "admin" && (
        <AdminProfile profile={profile} onEditClick={() => setIsEditing(true)} />
      )}

      {isEditing && (
        <div className="profile-edit-modal">
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
                ) : profile.profile_picture ? (
                  <img
                    src={`${BASE_URL}${profile.profile_picture}`}
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

export default Profile;

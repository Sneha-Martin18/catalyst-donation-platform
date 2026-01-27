import { useEffect, useState } from "react";
import api from "../../api/api";
import ProfileCard from "./ProfileCard";
import AadhaarVerification from "./AadhaarVerification";

function VolunteerProfile({ profile, refreshProfile, onEditClick }) {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    volunteer_code: profile.volunteer_code || "N/A",
    total_tasks: 0,
    completed: 0,
    pending: 0,
    rating: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await api.get("/delivery/my-tasks/");
        setTasks(res.data || []);

        // Calculate stats
        const completed = res.data?.filter((t) => t.status === "completed")
          .length || 0;
        const pending =
          res.data?.filter((t) => t.status === "pending").length || 0;

        setStats((prev) => ({
          ...prev,
          total_tasks: res.data?.length || 0,
          completed: completed,
          pending: pending,
        }));
      } catch (err) {
        console.error("Failed to load tasks", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  return (
    <div className="role-profile volunteer-profile">
      {/* Profile Card */}
      <div className="profile-card-section">
        <ProfileCard profile={profile} onEditClick={onEditClick} />
      </div>

      {/* Aadhaar Verification */}
      <AadhaarVerification profile={profile} onVerified={refreshProfile} />

      <h2>Volunteer Dashboard</h2>

      {/* Volunteer Code & Statistics */}
      <div className="volunteer-info">
        <div className="volunteer-code-box">
          <p className="volunteer-code-label">Volunteer Code</p>
          <p className="volunteer-code-value">{stats.volunteer_code}</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card total">
          <span className="stat-icon">📋</span>
          <p className="stat-number">{stats.total_tasks}</p>
          <p className="stat-label">Total Tasks</p>
        </div>

        <div className="stat-card completed">
          <span className="stat-icon">✓</span>
          <p className="stat-number">{stats.completed}</p>
          <p className="stat-label">Completed</p>
        </div>

        <div className="stat-card pending">
          <span className="stat-icon">⏳</span>
          <p className="stat-number">{stats.pending}</p>
          <p className="stat-label">Pending</p>
        </div>

        <div className="stat-card rating">
          <span className="stat-icon">⭐</span>
          <p className="stat-number">
            {profile.rating?.toFixed(1) || "0"}
          </p>
          <p className="stat-label">Rating</p>
        </div>
      </div>

      {/* Task History */}
      <div className="tasks-section">
        <h3>Delivery Tasks</h3>

        {loading ? (
          <p className="loading-text">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="empty-text">No tasks assigned yet.</p>
        ) : (
          <div className="tasks-list">
            {tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="task-item">
                <div className="task-header">
                  <h4>Delivery Task</h4>
                  <span className={`status-badge ${task.status}`}>
                    {task.status}
                  </span>
                </div>
                <p className="task-detail">
                  <strong>Pickup Location:</strong> {task.pickup_location}
                </p>
                <p className="task-detail">
                  <strong>Delivery Location:</strong> {task.delivery_location}
                </p>
                <p className="task-detail timestamp">
                  {new Date(task.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default VolunteerProfile;

import { useEffect, useState } from "react";
import api from "../../api/api";

function VolunteerProfileView({ userId }) {
  const [tasks, setTasks] = useState([]);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    volunteer_code: "N/A",
    total_tasks: 0,
    completed: 0,
    rating: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await api.get(`/users/profile/${userId}/`);
        setProfile(profileRes.data);

        const tasksRes = await api.get(`/delivery/volunteer/${userId}/tasks/`);
        const completed = tasksRes.data?.filter((t) => t.status === "completed")
          .length || 0;

        setTasks(tasksRes.data || []);
        setStats({
          volunteer_code: profileRes.data.volunteer_code || "N/A",
          total_tasks: tasksRes.data?.length || 0,
          completed: completed,
          rating: profileRes.data.profile?.rating || 0,
        });
      } catch (err) {
        console.error("Failed to load volunteer data", err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId]);

  return (
    <div className="role-profile volunteer-profile">
      <h2>Volunteer Information</h2>

      {/* Volunteer Code */}
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

        <div className="stat-card rating">
          <span className="stat-icon">⭐</span>
          <p className="stat-number">{stats.rating.toFixed(1)}</p>
          <p className="stat-label">Rating</p>
        </div>
      </div>

      {/* Task History */}
      <div className="tasks-section">
        <h3>Completed Deliveries</h3>

        {loading ? (
          <p className="loading-text">Loading task history...</p>
        ) : tasks.filter((t) => t.status === "completed").length === 0 ? (
          <p className="empty-text">No completed deliveries yet.</p>
        ) : (
          <div className="tasks-list">
            {tasks
              .filter((t) => t.status === "completed")
              .map((task) => (
                <div key={task.id} className="task-item">
                  <div className="task-header">
                    <h4>Delivery Task</h4>
                    <span className={`status-badge ${task.status}`}>
                      {task.status}
                    </span>
                  </div>
                  <p className="task-detail">
                    <strong>📍 Pickup:</strong> {task.pickup_location}
                  </p>
                  <p className="task-detail">
                    <strong>🚚 Delivery:</strong> {task.delivery_location}
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

export default VolunteerProfileView;

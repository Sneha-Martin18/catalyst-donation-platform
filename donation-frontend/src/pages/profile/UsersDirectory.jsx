import { useEffect, useState } from "react";
import api from "../../api/api";
import BackButton from "../../components/BackButton";
import UserCard from "./UserCard";
import "./Profile.css";

function UsersDirectory() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/users/all-users/");
        setUsers(res.data || []);
        setFilteredUsers(res.data || []);
      } catch (err) {
        console.error("Failed to load users", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = users;

    // Filter by role
    if (filter !== "all") {
      filtered = filtered.filter((user) => user.role === filter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((user) =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  }, [filter, searchTerm, users]);

  const roleStats = {
    all: users.length,
    donor: users.filter((u) => u.role === "donor").length,
    receiver: users.filter((u) => u.role === "receiver").length,
    volunteer: users.filter((u) => u.role === "volunteer").length,
    admin: users.filter((u) => u.role === "admin").length,
  };

  return (
    <div className="profile-container">
      <BackButton />
      <h1 className="directory-title">Users Directory</h1>

      {/* Filter Section */}
      <div className="directory-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="role-filters">
          <button
            className={`filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All ({roleStats.all})
          </button>
          <button
            className={`filter-btn ${filter === "donor" ? "active" : ""}`}
            onClick={() => setFilter("donor")}
          >
            🎁 Donors ({roleStats.donor})
          </button>
          <button
            className={`filter-btn ${filter === "receiver" ? "active" : ""}`}
            onClick={() => setFilter("receiver")}
          >
            🙏 Receivers ({roleStats.receiver})
          </button>
          <button
            className={`filter-btn ${filter === "volunteer" ? "active" : ""}`}
            onClick={() => setFilter("volunteer")}
          >
            👥 Volunteers ({roleStats.volunteer})
          </button>
          <button
            className={`filter-btn ${filter === "admin" ? "active" : ""}`}
            onClick={() => setFilter("admin")}
          >
            👨‍💼 Admins ({roleStats.admin})
          </button>
        </div>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="loading">
          <p>Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-text">
          <p>No users found. Try a different filter.</p>
        </div>
      ) : (
        <div className="users-grid">
          {filteredUsers.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}

export default UsersDirectory;

import { useEffect, useState } from "react";
import api from "../../../api/api";
import BackButton from "../../../components/BackButton";
import ConfirmationModal from "../../../components/ConfirmationModal";
import Pagination from "../../../components/Pagination";
import "../../../components/ConfirmationModal.css";
import "./Users.css";

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const loggedInUserId = Number(localStorage.getItem("user_id"));

  const fetchUsers = async (currentPage = 1) => {
    try {
      setLoading(true);
      const res = await api.get(`/users/admin/users/?page=${currentPage}`);
      if (res.data.results) {
        setUsers(res.data.results);
        setTotalCount(res.data.count);
      } else {
        setUsers(res.data);
        setTotalCount(res.data.length);
      }
    } catch (err) {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleUserStatus = async (userId) => {
    try {
      await api.post(`/users/admin/users/${userId}/toggle-status/`);
      fetchUsers();
    } catch (err) {
      alert("Failed to update user status");
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setIsModalOpen(true);
  };

  const deleteUser = async () => {
    if (!userToDelete) return;

    try {
      await api.delete(`/users/admin/users/${userToDelete.id}/delete/`);
      fetchUsers();
      closeModal();
    } catch (err) {
      console.error(err);
      alert("Failed to delete user");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setUserToDelete(null);
  };

  const donors = users.filter((u) => u.role === "donor");
  const receivers = users.filter((u) => u.role === "receiver");
  const volunteers = users.filter((u) => u.role === "volunteer");

  let filteredUsers = [];
  if (filter === "all") {
    filteredUsers = users;
  } else if (filter === "donors") {
    filteredUsers = donors;
  } else if (filter === "receivers") {
    filteredUsers = receivers;
  } else if (filter === "volunteers") {
    filteredUsers = volunteers;
  }

  if (loading) {
    return <div className="users-page"><p>Loading users...</p></div>;
  }

  if (error) {
    return <div className="users-page"><p className="error">{error}</p></div>;
  }

  return (
    <div className="users-page">
      <BackButton />
      <h1>User Management</h1>
      <p className="subtitle">Manage and monitor all system users</p>

      {/* STATS */}
      <div className="stats-row">
        <div className="stat-box">
          <span className="stat-number">{donors.length}</span>
          <span className="stat-label">Donors</span>
        </div>
        <div className="stat-box">
          <span className="stat-number">{receivers.length}</span>
          <span className="stat-label">Receivers</span>
        </div>
        <div className="stat-box">
          <span className="stat-number">{volunteers.length}</span>
          <span className="stat-label">Volunteers</span>
        </div>
        <div className="stat-box">
          <span className="stat-number">{users.length}</span>
          <span className="stat-label">Total Users</span>
        </div>
      </div>

      {/* FILTER BUTTONS */}
      <div className="filter-buttons">
        <button
          className={`filter-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All ({users.length})
        </button>
        <button
          className={`filter-btn ${filter === "donors" ? "active" : ""}`}
          onClick={() => setFilter("donors")}
        >
          Donors ({donors.length})
        </button>
        <button
          className={`filter-btn ${filter === "receivers" ? "active" : ""}`}
          onClick={() => setFilter("receivers")}
        >
          Receivers ({receivers.length})
        </button>
        <button
          className={`filter-btn ${filter === "volunteers" ? "active" : ""}`}
          onClick={() => setFilter("volunteers")}
        >
          Volunteers ({volunteers.length})
        </button>
      </div>

      {/* USERS TABLE */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Rating</th>
              <th>Verification Status</th>
              <th>Account Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className={`user-row ${!user.is_active ? "blocked" : ""}`}>
                <td className="username">
                  <strong>{user.username}</strong>
                </td>
                <td className="email">{user.email}</td>
                <td className="role">
                  <span className={`role-badge role-${user.role}`}>
                    {user.role.toUpperCase()}
                  </span>
                </td>
                <td className="rating">
                  {user.role === "volunteer" ? (
                    <span className="rating-badge">
                      ⭐ {user.profile?.rating || "0.0"}
                    </span>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
                <td className="verification">
                  {user.is_verified ? (
                    <span className="badge-verified">✅ Verified</span>
                  ) : (
                    <span className="badge-not-verified">❌ Not Verified</span>
                  )}
                </td>
                <td className="status">
                  {user.is_active ? (
                    <span className="badge-active">🟢 Active</span>
                  ) : (
                    <span className="badge-blocked">🔴 Blocked</span>
                  )}
                </td>
                <td className="action">
                  {user.id !== loggedInUserId && (
                    <div className="action-buttons">
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className={`btn-action ${user.is_active ? "btn-block" : "btn-unblock"}`}
                        title={user.is_active ? "Block User" : "Unblock User"}
                      >
                        {user.is_active ? "🚫" : "✅"}
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user)}
                        className="btn-action btn-delete"
                        title="Delete User"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={page}
        totalPages={Math.ceil(totalCount / 10)}
        onPageChange={handlePageChange}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onConfirm={deleteUser}
        title={`Delete User`}
        message={`Are you sure you want to permanently delete user "${userToDelete?.username}"? This action cannot be undone.`}
      />
    </div>
  );
}

export default Users;

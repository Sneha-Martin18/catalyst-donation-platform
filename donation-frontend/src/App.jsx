// React core
import React from "react";

// React Router
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Auth
import Register from "./auth/Register.jsx";
import Login from "./auth/Login.jsx";

// Layouts
import MainLayout from "./layouts/MainLayout";

// Route protection
import ProtectedRoute from "./components/ProtectedRoute";

// Profile
import Profile from "./pages/profile/Profile.jsx";
import UserProfileView from "./pages/profile/UserProfileView.jsx";
import UsersDirectory from "./pages/profile/UsersDirectory.jsx";

// ================= ADMIN DASHBOARD =================
import AdminLayout from "./pages/dashboard/admin/AdminLayout.jsx";
import AdminHome from "./pages/dashboard/admin/AdminHome.jsx";
import Users from "./pages/dashboard/admin/Users.jsx";
import Approvals from "./pages/dashboard/admin/Approvals.jsx";
import ReceiverRequests from "./pages/dashboard/admin/ReceiverRequests.jsx";
import AdminAnalytics from "./pages/dashboard/admin/AdminAnalytics.jsx";
import AdminReport from "./pages/dashboard/admin/AdminReport.jsx"; // ✅ CORRECT

// ================= DONOR DASHBOARD =================
import DonorLayout from "./pages/dashboard/donor/DonorLayout.jsx";
import DonorHome from "./pages/dashboard/donor/DonorHome.jsx";
import Donate from "./pages/dashboard/donor/Donate.jsx";
import DonorHistory from "./pages/dashboard/donor/DonorHistory.jsx";
import DonationList from "./pages/dashboard/donor/DonationList.jsx";
import DonationEdit from "./pages/dashboard/donor/DonationEdit.jsx";

// ================= RECEIVER DASHBOARD =================
import ReceiverLayout from "./pages/dashboard/receiver/ReceiverLayout.jsx";
import ReceiverHome from "./pages/dashboard/receiver/ReceiverHome.jsx";
import CreateRequest from "./pages/dashboard/receiver/CreateRequest.jsx";
import MyRequests from "./pages/dashboard/receiver/MyRequests.jsx";
import BrowseDonations from "./pages/dashboard/receiver/BrowseDonations.jsx";
import MyOrders from "./pages/dashboard/receiver/MyOrders.jsx";

// ================= VOLUNTEER DASHBOARD =================
import VolunteerLayout from "./pages/dashboard/volunteer/VolunteerLayout.jsx";
import VolunteerHome from "./pages/dashboard/volunteer/VolunteerHome.jsx";
import VolunteerTasks from "./pages/dashboard/volunteer/VolunteerTasks.jsx";
import VolunteerHistory from "./pages/dashboard/volunteer/VolunteerHistory.jsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ========= PUBLIC ROUTES ========= */}
        <Route path="/" element={<h1>Home</h1>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/user-profile/:userId"
          element={
            <ProtectedRoute>
              <UserProfileView />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users-directory"
          element={
            <ProtectedRoute>
              <UsersDirectory />
            </ProtectedRoute>
          }
        />

        {/* ========= ADMIN ROUTES ========= */}
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminHome />} />
          <Route path="users" element={<Users />} />
          <Route path="approvals" element={<Approvals />} />
          <Route path="receiver-requests" element={<ReceiverRequests />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="reports" element={<AdminReport />} /> {/* ✅ */}
        </Route>

        {/* ========= DONOR ROUTES ========= */}
        <Route
          path="/dashboard/donor"
          element={
            <ProtectedRoute allowedRole="donor">
              <DonorLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DonorHome />} />
          <Route path="donate" element={<Donate />} />
          <Route path="history" element={<DonorHistory />} />
          <Route path="donations" element={<DonationList />} />
          <Route path="edit/:id" element={<DonationEdit />} />
        </Route>

        {/* ========= RECEIVER ROUTES ========= */}
        <Route
          path="/dashboard/receiver"
          element={
            <ProtectedRoute allowedRole="receiver">
              <ReceiverLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ReceiverHome />} />
          <Route path="create" element={<CreateRequest />} />
          <Route path="requests" element={<MyRequests />} />
          <Route path="browse-donations" element={<BrowseDonations />} />
          <Route path="my-orders" element={<MyOrders />} />
        </Route>

        {/* ========= VOLUNTEER ROUTES ========= */}
        <Route
          path="/dashboard/volunteer"
          element={
            <ProtectedRoute allowedRole="volunteer">
              <VolunteerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<VolunteerHome />} />
          <Route path="tasks" element={<VolunteerTasks />} />
          <Route path="history" element={<VolunteerHistory />} />
        </Route>

        {/* ========= FALLBACK ========= */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<h1>Home</h1>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

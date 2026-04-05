import BrowseFundraisers from "./pages/dashboard/receiver/BrowseFundraisers.jsx";

// ... early in file
import React from "react";

// React Router
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Auth
import Register from "./auth/Register.jsx";
import Login from "./auth/Login.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import About from "./pages/About.jsx";

// Layouts
import MainLayout from "./layouts/MainLayout";
import UserLayout from "./layouts/UserLayout";

// Route protection
import ProtectedRoute from "./components/ProtectedRoute";

// Profile
import Profile from "./pages/profile/Profile.jsx";
import UserProfileView from "./pages/profile/UserProfileView.jsx";
import UsersDirectory from "./pages/profile/UsersDirectory.jsx";

// ================= DASHBOARD COMPONENTS =================
import UserHome from "./pages/dashboard/UserHome.jsx";
import AdminLayout from "./pages/dashboard/admin/AdminLayout.jsx";
import AdminHome from "./pages/dashboard/admin/AdminHome.jsx";
import Users from "./pages/dashboard/admin/Users.jsx";
import Approvals from "./pages/dashboard/admin/Approvals.jsx";
import ReceiverRequests from "./pages/dashboard/admin/ReceiverRequests.jsx";
import AdminAnalytics from "./pages/dashboard/admin/AdminAnalytics.jsx";
import AdminReport from "./pages/dashboard/admin/AdminReport.jsx";
import AssignVolunteers from "./pages/dashboard/admin/AssignVolunteers.jsx";
import ManageCampaigns from "./pages/dashboard/admin/ManageCampaigns.jsx";

// ================= DONOR COMPONENTS =================
import DonorLayout from "./pages/dashboard/donor/DonorLayout.jsx";
import DonorHome from "./pages/dashboard/donor/DonorHome.jsx";
import Donate from "./pages/dashboard/donor/Donate.jsx";
import DonorHistory from "./pages/dashboard/donor/DonorHistory.jsx";
import DonationList from "./pages/dashboard/donor/DonationList.jsx";
import DonationEdit from "./pages/dashboard/donor/DonationEdit.jsx";
import DonationDetails from "./pages/dashboard/donor/DonationDetails.jsx";
import RequestedItems from "./pages/dashboard/donor/RequestedItems.jsx";
import LiveCampaigns from "./pages/dashboard/donor/LiveCampaigns.jsx";

// ================= RECEIVER COMPONENTS =================
import ReceiverLayout from "./pages/dashboard/receiver/ReceiverLayout.jsx";
import ReceiverHome from "./pages/dashboard/receiver/ReceiverHome.jsx";
import CreateRequest from "./pages/dashboard/receiver/CreateRequest.jsx";
import MyRequests from "./pages/dashboard/receiver/MyRequests.jsx";
import BrowseDonations from "./pages/dashboard/receiver/BrowseDonations.jsx";
import MyOrders from "./pages/dashboard/receiver/MyOrders.jsx";
import RecommendationPage from "./pages/dashboard/receiver/RecommendationPage.jsx";
import RequestHistory from "./pages/dashboard/receiver/RequestHistory.jsx";

// ================= VOLUNTEER COMPONENTS =================
import VolunteerLayout from "./pages/dashboard/volunteer/VolunteerLayout.jsx";
import VolunteerHome from "./pages/dashboard/volunteer/VolunteerHome.jsx";
import VolunteerTasks from "./pages/dashboard/volunteer/VolunteerTasks.jsx";
import VolunteerHistory from "./pages/dashboard/volunteer/VolunteerHistory.jsx";
import VolunteerProfilePage from "./pages/dashboard/volunteer/VolunteerProfilePage.jsx";

// Logic Puzzle Game
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ========= PUBLIC ROUTES ========= */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<About />} />
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

        {/* ========= UNIFIED USER ROUTES ========= */}
        <Route
          path="/dashboard/user"
          element={
            <ProtectedRoute allowedRole="user">
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<UserHome />} />

          {/* Donor Sub-Routes */}
          <Route path="donate" element={<Donate />} />
          <Route path="requested-items" element={<RequestedItems />} />
          <Route path="donations" element={<DonationList />} />
          <Route path="donor-history" element={<DonorHistory />} />
          <Route path="edit-donation/:id" element={<DonationEdit />} />
          <Route path="details-donation/:id" element={<DonationDetails />} />
          <Route path="live-campaigns" element={<LiveCampaigns />} />

          {/* Receiver Sub-Routes */}
          <Route path="request" element={<CreateRequest />} />
          <Route path="my-requests" element={<MyRequests />} />
          <Route path="browse" element={<BrowseDonations />} />
          <Route path="fundraisers" element={<BrowseFundraisers />} />
          <Route path="recommendations" element={<RecommendationPage />} />
          <Route path="my-orders" element={<MyOrders />} />
          <Route path="request-history" element={<RequestHistory />} />

          {/* Volunteer Sub-Routes */}
          <Route path="volunteer" element={<VolunteerHome />} />
          <Route path="tasks" element={<VolunteerTasks />} />
          <Route path="volunteer-history" element={<VolunteerHistory />} />
          <Route path="volunteer-profile" element={<VolunteerProfilePage />} />
          <Route path="about" element={<About />} />
        </Route>

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
          <Route path="reports" element={<AdminReport />} />
          <Route path="assign-volunteers" element={<AssignVolunteers />} />
          <Route path="campaigns" element={<ManageCampaigns />} />
          <Route path="about" element={<About />} />
        </Route>

        {/* Redirect old specific dashboard paths for unified users */}
        {/* Specific sub-path redirects */}
        <Route path="/dashboard/donor/donate" element={<Navigate to="/dashboard/user/donate" replace />} />
        <Route path="/dashboard/donor/donations" element={<Navigate to="/dashboard/user/donations" replace />} />
        <Route path="/dashboard/donor/requested-items" element={<Navigate to="/dashboard/user/requested-items" replace />} />
        <Route path="/dashboard/donor/history" element={<Navigate to="/dashboard/user/donor-history" replace />} />

        <Route path="/dashboard/receiver/request" element={<Navigate to="/dashboard/user/request" replace />} />
        <Route path="/dashboard/receiver/my-requests" element={<Navigate to="/dashboard/user/my-requests" replace />} />
        <Route path="/dashboard/receiver/browse" element={<Navigate to="/dashboard/user/browse" replace />} />

        <Route path="/dashboard/volunteer/tasks" element={<Navigate to="/dashboard/user/tasks" replace />} />

        {/* Wildcard catch-all for anything else in old dashboards */}
        <Route path="/dashboard/donor/*" element={<Navigate to="/dashboard/user" replace />} />
        <Route path="/dashboard/receiver/*" element={<Navigate to="/dashboard/user" replace />} />
        <Route path="/dashboard/volunteer/*" element={<Navigate to="/dashboard/user" replace />} />


        {/* ========= FALLBACK ========= */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<h1>Home</h1>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

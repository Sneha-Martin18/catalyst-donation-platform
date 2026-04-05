// Example: How to integrate RecommendationEngine into your existing pages

import { useState, useEffect } from "react";
import RecommendationEngine from "../components/Recommendations/RecommendationEngine";
import "./BrowseDonations.css";

/**
 * Example: Receiver Browse Donations Page with AI Recommendations
 * 
 * The RecommendationEngine component can be added to ANY page where
 * a receiver needs to see available donations.
 */

function BrowseDonations() {
  const [filters, setFilters] = useState({
    category: "",
    condition: "",
    search: "",
  });
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Your existing browse logic...
  const fetchDonations = async () => {
    setLoading(true);
    try {
      // Fetch available donations with filters
      // const res = await api.get("/api/donation/available/", {params: filters});
      // setDonations(res.data);
    } catch (error) {
      console.error("Failed to fetch donations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, [filters]);

  return (
    <div className="browse-donations-page">
      {/* ===== AI RECOMMENDATIONS SECTION ===== */}
      {/* Just add this component at the top */}
      <RecommendationEngine />

      {/* ===== EXISTING BROWSE FUNCTIONALITY ===== */}
      <section className="browse-section">
        <h2>Browse All Donations</h2>

        {/* Filters */}
        <div className="filters">
          <input
            type="text"
            placeholder="Search..."
            value={filters.search}
            onChange={(e) =>
              setFilters({ ...filters, search: e.target.value })
            }
          />
          <select
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
          >
            <option value="">All Categories</option>
            <option value="Clothing">Clothing</option>
            <option value="Electronics">Electronics</option>
            <option value="Books">Books</option>
            {/* ... more options */}
          </select>
        </div>

        {/* Donations Grid */}
        {loading ? (
          <div className="loading">Loading donations...</div>
        ) : donations.length > 0 ? (
          <div className="donations-grid">
            {donations.map((donation) => (
              <div key={donation.id} className="donation-card">
                <h3>{donation.item_name}</h3>
                <p>{donation.category}</p>
                {/* ... rest of card */}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">No donations found</div>
        )}
      </section>
    </div>
  );
}

export default BrowseDonations;

/**
 * ====================================
 * Alternative Usage Examples
 * ====================================
 */

// Example 2: In a Dashboard
function ReceiverDashboard() {
  return (
    <div className="dashboard">
      <h1>Welcome, Receiver!</h1>

      {/* Add recommendations to dashboard */}
      <RecommendationEngine />

      {/* Other dashboard sections */}
      <section className="my-requests">
        {/* ... */}
      </section>
    </div>
  );
}

// Example 3: Standalone Recommendations Page
function RecommendationsPage() {
  return (
    <div className="recommendations-page">
      <header>
        <h1>Your Personalized Matches</h1>
        <p>Items we think you'll love based on your request history</p>
      </header>

      <RecommendationEngine />

      {/* Additional info */}
      <footer>
        <p>Recommendations updated daily based on your preferences</p>
      </footer>
    </div>
  );
}

// Example 4: With Custom Styling
function CustomBrowse() {
  return (
    <div className="custom-container">
      {/* Can wrap and customize the component with your own styles */}
      <div className="recommendations-wrapper">
        <RecommendationEngine />
      </div>

      <style jsx>{`
        .recommendations-wrapper {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }
      `}</style>
    </div>
  );
}

/**
 * ====================================
 * Integration Tips
 * ====================================
 * 
 * 1. The component handles its own API calls
 *    - No need to pass data as props
 *    - Automatically fetches recommendations for logged-in user
 * 
 * 2. It uses the global API instance from your project
 *    - Ensure api.js is configured correctly
 *    - JWT token should be in localStorage
 * 
 * 3. Component is self-contained
 *    - Includes its own state management
 *    - Includes its own styling
 *    - Can be placed anywhere on your site
 * 
 * 4. No styling conflicts
 *    - All CSS is scoped to .recommendation-engine
 *    - Won't interfere with existing styles
 * 
 * 5. Responsive design
 *    - Works on mobile, tablet, desktop
 *    - Grid auto-adjusts based on screen size
 * 
 * 6. Performance optimized
 *    - Fetches once on mount
 *    - Uses React hooks efficiently
 *    - No unnecessary re-renders
 */

/**
 * ====================================
 * API Contract (What the component needs)
 * ====================================
 * 
 * The component expects these endpoints to exist:
 * 
 * 1. GET /api/analytics/recommendations/?limit=12
 *    Response: {
 *      recommendations: [
 *        {id, item_name, category, condition, quantity, description, images}
 *      ],
 *      count: number,
 *      message: string
 *    }
 * 
 * 2. GET /api/analytics/receiver-insights/
 *    Response: {
 *      profile: {
 *        preferred_categories: [],
 *        preferred_conditions: [],
 *        request_count: number,
 *        avg_quantity: number
 *      },
 *      trending_categories: [
 *        {category: string, available_count: number}
 *      ]
 *    }
 * 
 * Both endpoints are already implemented! ✅
 */

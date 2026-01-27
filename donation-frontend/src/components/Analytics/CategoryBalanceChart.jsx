import { useState, useEffect } from "react";
import Chart from "react-apexcharts";

const CategoryBalanceChart = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🔗 Fetch analytics data when both dates are selected
  useEffect(() => {
    if (!startDate || !endDate) return;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = localStorage.getItem("access");

        const response = await fetch(
          `http://127.0.0.1:8000/api/analytics/admin/analytics/category-balance/?start_date=${startDate}&end_date=${endDate}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text);
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [startDate, endDate]);

  // 📊 Map backend data → chart format
  const categories = data ? data.categories.map(c => c.category) : [];
  const donatedData = data ? data.categories.map(c => c.donated) : [];
  const requestedData = data ? data.categories.map(c => c.requested) : [];

  const chartOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "45%",
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories,
    },
    legend: {
      position: "top",
    },
  };

  const chartSeries = [
    { name: "Donated", data: donatedData },
    { name: "Requested", data: requestedData },
  ];

  // 🧠 Admin Insight Logic (runs after graph data is ready)
  let insight = null;

  if (data) {
    const unmet = data.categories.filter(
      item => item.requested > item.donated
    );

    const surplus = data.categories.filter(
      item => item.donated > item.requested
    );

    if (unmet.length > 0) {
      insight = {
        type: "warning",
        message: `High unmet demand detected in ${unmet
          .map(c => c.category)
          .join(", ")}. Consider prioritizing donor outreach or reallocating surplus.`,
      };
    } else if (surplus.length === data.categories.length) {
      insight = {
        type: "info",
        message:
          "Supply exceeds demand across all categories. Monitor storage and encourage redistribution.",
      };
    } else {
      insight = {
        type: "success",
        message:
          "Demand and supply are broadly balanced. No immediate intervention required.",
      };
    }
  }

  return (
    <div style={{ padding: "24px" }}>
      <h2>Category Utilization Balance</h2>

      {/* Date controls */}
      <div style={{ marginBottom: "16px", display: "flex", gap: "12px" }}>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      {loading && <p>Loading analytics…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* 🧭 Admin Insight */}
      {insight && (
        <div
          style={{
            marginBottom: "12px",
            padding: "10px 14px",
            borderRadius: "6px",
            fontWeight: "500",
            backgroundColor:
              insight.type === "warning"
                ? "#fff3cd"
                : insight.type === "success"
                ? "#d4edda"
                : "#d1ecf1",
            color:
              insight.type === "warning"
                ? "#856404"
                : insight.type === "success"
                ? "#155724"
                : "#0c5460",
            border:
              insight.type === "warning"
                ? "1px solid #ffeeba"
                : insight.type === "success"
                ? "1px solid #c3e6cb"
                : "1px solid #bee5eb",
          }}
        >
          {insight.message}
        </div>
      )}

      <Chart
        options={chartOptions}
        series={chartSeries}
        type="bar"
        height={350}
      />
    </div>
  );
};

export default CategoryBalanceChart;

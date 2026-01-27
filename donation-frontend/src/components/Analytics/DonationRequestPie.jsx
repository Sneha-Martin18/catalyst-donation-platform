import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { useEffect, useState } from "react";
import api from "../../api/api";

const COLORS = ["#88e8ab", "#0e408f"];

export default function DonationRequestPie() {
  const [data, setData] = useState([]);

  useEffect(() => {
    api
      .get("analytics/donation-request-ratio/")
      .then((res) => {
        setData([
          { name: "Donations", value: res.data.donations },
          { name: "Requests", value: res.data.requests },
        ]);
      })
      .catch((err) => {
        console.error("Failed to load donation/request ratio", err);
      });
  }, []);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
      <div
      style={{
      width: 340,
      padding: "16px",
      borderRadius: "12px",
      background: "#fff",
      boxShadow: "0 8px 20px rgba(0,0,0,0.05)",
    }}
  >
      <h3>Donation vs Request Ratio</h3>

      <PieChart width={300} height={250}>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={80}
          dataKey="value"
          label={({ name, value }) =>
            total ? `${Math.round((value / total) * 100)}%` : ""
        }

        >
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </div>
  );
}

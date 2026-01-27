import CategoryBalanceChart from "../../../components/Analytics/CategoryBalanceChart";
import DonationRequestPie from "../../../components/Analytics/DonationRequestPie";

const AdminAnalytics = () => {
  return (
    <div>
      <CategoryBalanceChart />
      <DonationRequestPie />
      <div
  style={{
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
    marginBottom: "40px",
  }}
></div>

    </div>
  );
};

export default AdminAnalytics;

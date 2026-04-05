import CategoryBalanceChart from "../../../components/Analytics/CategoryBalanceChart";
import DonationRequestPie from "../../../components/Analytics/DonationRequestPie";
import DemandPredictionChart from "../../../components/Analytics/DemandPredictionChart";
import BackButton from "../../../components/BackButton";

const AdminAnalytics = () => {
  return (
    <div style={{ padding: '20px' }}>
      <BackButton />
      <DemandPredictionChart />
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

function DonationTimeline({ status }) {
  const steps = ["created", "verified", "assigned", "delivered"];

  const statusOrder = {
    pending: 0,      // created
    verified: 1,     // verified
    assigned: 2,     // assigned
    delivered: 3,    // delivered
  };

  const currentStepIndex = statusOrder[status];

  return (
    <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
      {steps.map((step, index) => {
        const isActive = index <= currentStepIndex;

        return (
          <span
            key={step}
            style={{
              padding: "6px 12px",
              borderRadius: "20px",
              backgroundColor: isActive ? "#22c55e" : "#e5e7eb",
              color: isActive ? "white" : "#6b7280",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            {step.charAt(0).toUpperCase() + step.slice(1)}
          </span>
        );
      })}
    </div>
  );
}

export default DonationTimeline;

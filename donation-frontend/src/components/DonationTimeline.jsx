function DonationTimeline({ status, compact = false }) {
  const steps = ["Pending", "Verified", "Assigned", "Delivered"];

  const statusMap = {
    pending: 0,
    verified: 1,
    assigned: 2,
    delivered: 3,
  };

  const currentIndex = statusMap[status] !== undefined ? statusMap[status] : -1;

  if (compact) {
    return (
      <div className="timeline-compact" style={{ display: 'flex', gap: '4px', marginTop: '12px', marginBottom: '12px' }}>
        {steps.map((step, index) => {
          const isActive = index <= currentIndex;
          return (
            <div
              key={step}
              title={step}
              style={{
                height: '6px',
                flex: 1,
                borderRadius: '4px',
                backgroundColor: isActive ? '#10b981' : '#e5e7eb',
                transition: 'background-color 0.3s'
              }}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", gap: "8px", marginTop: "10px", flexWrap: 'wrap' }}>
      {steps.map((step, index) => {
        const isActive = index <= currentIndex;
        return (
          <span
            key={step}
            style={{
              padding: "4px 10px",
              borderRadius: "20px",
              backgroundColor: isActive ? "#22c55e" : "#f3f4f6",
              color: isActive ? "white" : "#9ca3af",
              fontSize: "12px",
              fontWeight: "600",
              border: isActive ? "none" : "1px solid #e5e7eb",
              transition: 'all 0.2s'
            }}
          >
            {step}
          </span>
        );
      })}
    </div>
  );
}

export default DonationTimeline;

function StatusBadge({ status }) {
  const styles = {
    pending: {
      backgroundColor: "#fff3cd",
      color: "#856404",
      border: "1px solid #ffeeba",
    },
    verified: {
      backgroundColor: "#cce5ff",
      color: "#004085",
      border: "1px solid #b8daff",
    },
    assigned: {
      backgroundColor: "#e2e3e5",
      color: "#383d41",
      border: "1px solid #d6d8db",
    },
    delivered: {
      backgroundColor: "#d4edda",
      color: "#155724",
      border: "1px solid #c3e6cb",
    },
  };

  const style = styles[status] || styles.pending;

  return (
    <span
      style={{
        padding: "4px 8px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: "bold",
        marginLeft: "8px",
        ...style,
      }}
    >
      {status.toUpperCase()}
    </span>
  );
}

export default StatusBadge;

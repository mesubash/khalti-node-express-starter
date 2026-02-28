const PAYMENT_STATUS = {
  INITIATED: "initiated",
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
  EXPIRED: "expired"
};

function normalizeKhaltiStatus(status) {
  if (!status) {
    return PAYMENT_STATUS.FAILED;
  }

  switch (status.toLowerCase()) {
    case "completed":
      return PAYMENT_STATUS.COMPLETED;
    case "pending":
    case "initiated":
      return PAYMENT_STATUS.PENDING;
    case "user canceled":
      return PAYMENT_STATUS.CANCELLED;
    case "expired":
      return PAYMENT_STATUS.EXPIRED;
    default:
      return PAYMENT_STATUS.FAILED;
  }
}

module.exports = {
  PAYMENT_STATUS,
  normalizeKhaltiStatus
};

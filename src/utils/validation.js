const { AppError } = require("./errors");

function validateInitiatePaymentInput(body) {
  const amount = Number(body.amount);

  if (!Number.isFinite(amount) || amount < 1) {
    throw new AppError(400, "amount must be a number and at least 1 NPR");
  }

  if (!body.purchaseOrderId || typeof body.purchaseOrderId !== "string") {
    throw new AppError(400, "purchaseOrderId is required");
  }

  if (!body.purchaseOrderName || typeof body.purchaseOrderName !== "string") {
    throw new AppError(400, "purchaseOrderName is required");
  }

  return {
    amountNpr: Number(amount.toFixed(2)),
    purchaseOrderId: body.purchaseOrderId.trim(),
    purchaseOrderName: body.purchaseOrderName.trim(),
    customerInfo: body.customerInfo && typeof body.customerInfo === "object"
      ? body.customerInfo
      : {},
    metadata: body.metadata && typeof body.metadata === "object"
      ? body.metadata
      : {}
  };
}

module.exports = { validateInitiatePaymentInput };

const { Router } = require("express");

const { asyncHandler } = require("../middleware/asyncHandler");

function createPaymentRoutes(paymentController) {
  const router = Router();

  router.get("/health", asyncHandler(paymentController.health));
  router.post("/payments/initiate", asyncHandler(paymentController.initiatePayment));
  router.get("/payments", asyncHandler(paymentController.listTransactions));
  router.get("/payments/events", asyncHandler(paymentController.getPaymentEvents));
  router.get("/payments/:transactionId", asyncHandler(paymentController.getTransaction));
  router.get("/payments/callback/khalti", asyncHandler(paymentController.handleKhaltiCallback));
  router.get("/payments/mock/checkout/:pidx", asyncHandler(paymentController.renderMockCheckout));
  router.post("/payments/mock/checkout/:pidx/complete", asyncHandler(paymentController.completeMockCheckout));

  return router;
}

module.exports = { createPaymentRoutes };

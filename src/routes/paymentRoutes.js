const { Router } = require("express");

const { asyncHandler } = require("../middleware/asyncHandler");

function createPaymentRoutes(paymentController) {
  const router = Router();

  router.get("/health", asyncHandler(paymentController.health));
  router.post("/payments/initiate", asyncHandler(paymentController.initiatePayment));
  router.get("/payments", asyncHandler(paymentController.listTransactions));
  router.get("/payments/events", asyncHandler(paymentController.getPaymentEvents));
  router.get("/payments/:transactionId", asyncHandler(paymentController.getTransaction));
  router.post("/payments/:transactionId/lookup", asyncHandler(paymentController.lookupTransaction));
  router.get("/payments/callback/khalti", asyncHandler(paymentController.handleKhaltiCallback));

  return router;
}

module.exports = { createPaymentRoutes };

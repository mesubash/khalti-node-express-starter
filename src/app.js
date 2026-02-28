const express = require("express");
const helmet = require("helmet");

const { env } = require("./config/env");
const { FileStore } = require("./lib/fileStore");
const { TransactionRepository } = require("./repositories/transactionRepository");
const { PaymentEventRepository } = require("./repositories/paymentEventRepository");
const { KhaltiClient } = require("./services/khalti/khaltiClient");
const { PaymentService } = require("./services/paymentService");
const { PaymentController } = require("./controllers/paymentController");
const { createPaymentRoutes } = require("./routes/paymentRoutes");
const { errorHandler } = require("./middleware/errorHandler");

function createApp() {
  const app = express();

  const store = new FileStore(env.dataFile);
  const transactionRepository = new TransactionRepository(store);
  const paymentEventRepository = new PaymentEventRepository(store);
  const khaltiClient = new KhaltiClient({ env });
  const paymentService = new PaymentService({
    env,
    transactionRepository,
    paymentEventRepository,
    khaltiClient
  });
  const paymentController = new PaymentController({
    env,
    paymentService
  });

  app.use(helmet({
    contentSecurityPolicy: false
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.get("/", (_req, res) => {
    res.json({
      name: "khalti-node-express-starter",
      provider: "khalti",
      mode: env.khaltiMode,
      callbackUrl: env.callbackUrl,
      docs: "/api/v1/health"
    });
  });

  app.use("/api/v1", createPaymentRoutes(paymentController));
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };

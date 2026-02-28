const { buildCallbackSignaturePayload, isValidSignature } = require("../utils/signature");
const { renderCallbackHtml } = require("../utils/html");
const { validateInitiatePaymentInput } = require("../utils/validation");
const { AppError } = require("../utils/errors");

class PaymentController {
  constructor({ env, paymentService }) {
    this.env = env;
    this.paymentService = paymentService;

    this.initiatePayment = this.initiatePayment.bind(this);
    this.listTransactions = this.listTransactions.bind(this);
    this.getTransaction = this.getTransaction.bind(this);
    this.getPaymentEvents = this.getPaymentEvents.bind(this);
    this.handleKhaltiCallback = this.handleKhaltiCallback.bind(this);
    this.renderMockCheckout = this.renderMockCheckout.bind(this);
    this.completeMockCheckout = this.completeMockCheckout.bind(this);
    this.health = this.health.bind(this);
  }

  async health(_req, res) {
    return res.json({
      ok: true,
      provider: "khalti",
      mode: this.env.khaltiMode,
      callbackUrl: this.env.callbackUrl
    });
  }

  async initiatePayment(req, res) {
    const input = validateInitiatePaymentInput(req.body);
    const transaction = await this.paymentService.initiatePayment(input);

    return res.status(201).json({
      message: "Payment initiated",
      data: transaction
    });
  }

  async listTransactions(_req, res) {
    const transactions = await this.paymentService.listTransactions();
    return res.json({ data: transactions });
  }

  async getTransaction(req, res) {
    const result = await this.paymentService.getTransaction(req.params.transactionId);
    return res.json({ data: result });
  }

  async getPaymentEvents(_req, res) {
    const events = await this.paymentService.listPaymentEvents();
    return res.json({ data: events });
  }

  async handleKhaltiCallback(req, res) {
    const signature = req.get("X-Khalti-Signature");
    const payload = buildCallbackSignaturePayload(req.query);

    if (this.env.strictCallbackSignature) {
      if (!signature || !isValidSignature(payload, signature, this.env.khaltiSecretKey)) {
        throw new AppError(403, "invalid callback signature");
      }
    }

    const transaction = await this.paymentService.handleCallback(req.query);

    if (req.accepts("html")) {
      return res.type("html").send(renderCallbackHtml(transaction));
    }

    return res.json({
      message: "Callback processed",
      data: transaction
    });
  }

  async renderMockCheckout(req, res) {
    if (!this.env.isMockMode) {
      throw new AppError(404, "mock checkout route is unavailable in live mode");
    }

    const { transaction } = await this.paymentService.getTransactionByPidx(req.params.pidx);
    const amount = (transaction.amountPaisa / 100).toFixed(2);

    return res.type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Mock Khalti Checkout</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; background: #f8fafc; color: #0f172a; }
      main { max-width: 680px; margin: 40px auto; padding: 32px; background: #fff; border-radius: 16px; box-shadow: 0 16px 32px rgba(15, 23, 42, 0.12); }
      button { padding: 12px 18px; border: 0; border-radius: 10px; cursor: pointer; font-weight: 700; }
      .primary { background: #5c2d91; color: white; }
      .secondary { background: #e2e8f0; color: #0f172a; margin-left: 8px; }
      code { background: #f1f5f9; padding: 2px 6px; border-radius: 6px; }
    </style>
  </head>
  <body>
    <main>
      <h1>Mock Khalti Checkout</h1>
      <p>This local screen simulates Khalti so new developers can test the full flow without external credentials.</p>
      <p><strong>Order:</strong> <code>${transaction.purchaseOrderId}</code></p>
      <p><strong>PIDX:</strong> <code>${transaction.pidx}</code></p>
      <p><strong>Amount:</strong> NPR ${amount}</p>
      <form method="post" action="/api/v1/payments/mock/checkout/${transaction.pidx}/complete?status=Completed">
        <button class="primary" type="submit">Simulate Successful Payment</button>
      </form>
      <form method="post" action="/api/v1/payments/mock/checkout/${transaction.pidx}/complete?status=User%20canceled" style="margin-top: 12px;">
        <button class="secondary" type="submit">Simulate User Cancellation</button>
      </form>
    </main>
  </body>
</html>`);
  }

  async completeMockCheckout(req, res) {
    const callbackQuery = await this.paymentService.buildMockCallbackQuery(
      req.params.pidx,
      req.query.status
    );

    const query = new URLSearchParams(callbackQuery);
    return res.redirect(`${this.env.callbackPath}?${query.toString()}`);
  }
}

module.exports = { PaymentController };

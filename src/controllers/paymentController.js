const { renderCallbackHtml } = require("../utils/html");
const { validateInitiatePaymentInput } = require("../utils/validation");

class PaymentController {
  constructor({ env, paymentService }) {
    this.env = env;
    this.paymentService = paymentService;

    this.initiatePayment = this.initiatePayment.bind(this);
    this.listTransactions = this.listTransactions.bind(this);
    this.getTransaction = this.getTransaction.bind(this);
    this.getPaymentEvents = this.getPaymentEvents.bind(this);
    this.lookupTransaction = this.lookupTransaction.bind(this);
    this.handleKhaltiCallback = this.handleKhaltiCallback.bind(this);
    this.health = this.health.bind(this);
  }

  async health(_req, res) {
    return res.json({
      ok: true,
      provider: "khalti",
      environment: this.env.khaltiEnvironment,
      khaltiBaseUrl: this.env.khaltiBaseUrl,
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

  async lookupTransaction(req, res) {
    const transaction = await this.paymentService.lookupAndSyncTransactionById(
      req.params.transactionId
    );

    return res.json({
      message: "Transaction status refreshed from Khalti lookup",
      data: transaction
    });
  }

  async handleKhaltiCallback(req, res) {
    const transaction = await this.paymentService.handleCallback(req.query);

    if (req.accepts("html")) {
      return res.type("html").send(renderCallbackHtml(transaction));
    }

    return res.json({
      message: "Callback processed",
      data: transaction
    });
  }
}

module.exports = { PaymentController };

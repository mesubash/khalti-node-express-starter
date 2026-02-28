const crypto = require("node:crypto");

const { AppError } = require("../utils/errors");
const { PAYMENT_STATUS, normalizeKhaltiStatus } = require("../utils/paymentStatus");

class PaymentService {
  constructor({ env, transactionRepository, paymentEventRepository, khaltiClient }) {
    this.env = env;
    this.transactionRepository = transactionRepository;
    this.paymentEventRepository = paymentEventRepository;
    this.khaltiClient = khaltiClient;
  }

  async initiatePayment(input) {
    const existing = await this.transactionRepository.findByPurchaseOrderId(input.purchaseOrderId);
    if (existing) {
      throw new AppError(409, "purchaseOrderId already exists");
    }

    const amountPaisa = Math.round(input.amountNpr * 100);
    const now = new Date().toISOString();
    const transactionId = crypto.randomUUID();

    const initiatePayload = {
      return_url: this.env.callbackUrl,
      website_url: this.env.websiteUrl,
      amount: amountPaisa,
      purchase_order_id: input.purchaseOrderId,
      purchase_order_name: input.purchaseOrderName
    };

    if (Object.keys(input.customerInfo).length > 0) {
      initiatePayload.customer_info = input.customerInfo;
    }

    let providerResponse;

    if (this.env.isMockMode) {
      const pidx = `mock-${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
      providerResponse = {
        pidx,
        payment_url: `${this.env.publicBaseUrl}/api/v1/payments/mock/checkout/${pidx}`,
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        expires_in: 1800
      };
    } else {
      providerResponse = await this.khaltiClient.initiatePayment(initiatePayload);
    }

    const transaction = {
      id: transactionId,
      provider: "khalti",
      mode: this.env.khaltiMode,
      purchaseOrderId: input.purchaseOrderId,
      purchaseOrderName: input.purchaseOrderName,
      amountNpr: input.amountNpr,
      amountPaisa,
      status: PAYMENT_STATUS.INITIATED,
      pidx: providerResponse.pidx,
      paymentUrl: providerResponse.payment_url,
      returnUrl: this.env.callbackUrl,
      websiteUrl: this.env.websiteUrl,
      expiresAt: providerResponse.expires_at || null,
      expiresIn: providerResponse.expires_in || null,
      customerInfo: input.customerInfo,
      metadata: input.metadata,
      gateway: {
        initiatedAt: now,
        transactionId: null,
        mobile: null,
        rawInitiateResponse: providerResponse,
        rawLookupResponse: null,
        rawCallbackQuery: null
      },
      createdAt: now,
      updatedAt: now,
      confirmedAt: null
    };

    await this.transactionRepository.create(transaction);
    await this.recordEvent(transaction.id, "payment.initiated", "api", {
      request: initiatePayload,
      response: providerResponse
    });

    return transaction;
  }

  async handleCallback(query) {
    const transaction = await this.transactionRepository.findByPidx(query.pidx);
    if (!transaction) {
      throw new AppError(404, "transaction not found for pidx");
    }

    await this.recordEvent(transaction.id, "payment.callback.received", "khalti", query);

    const updated = await this.applySettlement(transaction, {
      status: normalizeKhaltiStatus(query.status),
      transactionId: query.transaction_id || query.tidx || null,
      mobile: query.mobile || null,
      rawCallbackQuery: query,
      rawLookupResponse: null
    });

    if (this.env.isLiveMode && query.pidx) {
      try {
        const lookup = await this.khaltiClient.lookupPayment(query.pidx);
        await this.recordEvent(updated.id, "payment.lookup.completed", "khalti", lookup);
        return this.applySettlement(updated, {
          status: normalizeKhaltiStatus(lookup.status),
          transactionId: lookup.transaction_id || updated.gateway.transactionId,
          mobile: updated.gateway.mobile,
          rawCallbackQuery: updated.gateway.rawCallbackQuery,
          rawLookupResponse: lookup
        });
      } catch (error) {
        await this.recordEvent(updated.id, "payment.lookup.failed", "system", {
          message: error.message,
          details: error.details || null
        });
      }
    }

    return updated;
  }

  async buildMockCallbackQuery(pidx, status) {
    if (!this.env.isMockMode) {
      throw new AppError(400, "mock checkout is only available in mock mode");
    }

    const transaction = await this.transactionRepository.findByPidx(pidx);
    if (!transaction) {
      throw new AppError(404, "transaction not found for pidx");
    }

    const nextStatus = normalizeKhaltiStatus(status || "Completed");
    return {
      pidx: transaction.pidx,
      status: nextStatus === PAYMENT_STATUS.CANCELLED ? "User canceled" : "Completed",
      amount: transaction.amountPaisa,
      purchase_order_id: transaction.purchaseOrderId,
      purchase_order_name: transaction.purchaseOrderName,
      transaction_id: nextStatus === PAYMENT_STATUS.COMPLETED ? `mock-txn-${Date.now()}` : "",
      tidx: nextStatus === PAYMENT_STATUS.COMPLETED ? `mock-txn-${Date.now()}` : "",
      mobile: nextStatus === PAYMENT_STATUS.COMPLETED ? "9800000000" : ""
    };
  }

  async getTransaction(transactionId) {
    const transaction = await this.transactionRepository.findById(transactionId);
    if (!transaction) {
      throw new AppError(404, "transaction not found");
    }

    const events = await this.paymentEventRepository.listByTransactionId(transactionId);
    return {
      transaction,
      events
    };
  }

  async getTransactionByPidx(pidx) {
    const transaction = await this.transactionRepository.findByPidx(pidx);
    if (!transaction) {
      throw new AppError(404, "transaction not found");
    }

    const events = await this.paymentEventRepository.listByTransactionId(transaction.id);
    return {
      transaction,
      events
    };
  }

  async listTransactions() {
    return this.transactionRepository.list();
  }

  async listPaymentEvents() {
    return this.paymentEventRepository.list();
  }

  async applySettlement(transaction, settlement) {
    const isTerminal = [
      PAYMENT_STATUS.COMPLETED,
      PAYMENT_STATUS.CANCELLED,
      PAYMENT_STATUS.FAILED,
      PAYMENT_STATUS.EXPIRED
    ].includes(settlement.status);

    const shouldKeepCompletedStatus = transaction.status === PAYMENT_STATUS.COMPLETED;

    const updated = await this.transactionRepository.update(transaction.id, (current) => ({
      status: shouldKeepCompletedStatus ? current.status : settlement.status,
      confirmedAt: isTerminal && !current.confirmedAt ? new Date().toISOString() : current.confirmedAt,
      gateway: {
        ...current.gateway,
        transactionId: settlement.transactionId || current.gateway.transactionId,
        mobile: settlement.mobile || current.gateway.mobile,
        rawCallbackQuery: settlement.rawCallbackQuery || current.gateway.rawCallbackQuery,
        rawLookupResponse: settlement.rawLookupResponse || current.gateway.rawLookupResponse
      }
    }));

    if (updated.status !== transaction.status || settlement.rawLookupResponse) {
      await this.recordEvent(updated.id, "payment.status.updated", "system", {
        status: updated.status,
        transactionId: updated.gateway.transactionId
      });
    }

    return updated;
  }

  async recordEvent(transactionId, type, source, payload) {
    return this.paymentEventRepository.create({
      id: crypto.randomUUID(),
      transactionId,
      type,
      source,
      payload,
      createdAt: new Date().toISOString()
    });
  }
}

module.exports = { PaymentService };

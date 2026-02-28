const { AppError } = require("../../utils/errors");

class KhaltiClient {
  constructor({ env }) {
    this.env = env;
  }

  async initiatePayment(payload) {
    const response = await fetch(`${this.env.khaltiBaseUrl}/epayment/initiate/`, {
      method: "POST",
      headers: {
        Authorization: `Key ${this.env.khaltiSecretKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new AppError(502, "Khalti initiate request failed", data);
    }

    return data;
  }

  async lookupPayment(pidx) {
    const response = await fetch(`${this.env.khaltiBaseUrl}/epayment/lookup/`, {
      method: "POST",
      headers: {
        Authorization: `Key ${this.env.khaltiSecretKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ pidx })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new AppError(502, "Khalti lookup request failed", data);
    }

    return data;
  }
}

module.exports = { KhaltiClient };

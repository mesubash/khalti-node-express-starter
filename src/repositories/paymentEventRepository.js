class PaymentEventRepository {
  constructor(store) {
    this.store = store;
  }

  async create(event) {
    const state = await this.store.read();
    state.paymentEvents.push(event);
    await this.store.write(state);
    return event;
  }

  async list() {
    const state = await this.store.read();
    return [...state.paymentEvents].sort((left, right) => {
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
  }

  async listByTransactionId(transactionId) {
    const state = await this.store.read();
    return state.paymentEvents
      .filter((item) => item.transactionId === transactionId)
      .sort((left, right) => {
        return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      });
  }
}

module.exports = { PaymentEventRepository };

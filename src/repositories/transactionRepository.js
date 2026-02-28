class TransactionRepository {
  constructor(store) {
    this.store = store;
  }

  async create(transaction) {
    const state = await this.store.read();
    state.transactions.push(transaction);
    await this.store.write(state);
    return transaction;
  }

  async update(transactionId, updater) {
    const state = await this.store.read();
    const index = state.transactions.findIndex((item) => item.id === transactionId);

    if (index === -1) {
      return null;
    }

    const current = state.transactions[index];
    const updated = {
      ...current,
      ...updater(current),
      updatedAt: new Date().toISOString()
    };

    state.transactions[index] = updated;
    await this.store.write(state);
    return updated;
  }

  async findById(transactionId) {
    const state = await this.store.read();
    return state.transactions.find((item) => item.id === transactionId) || null;
  }

  async findByPidx(pidx) {
    const state = await this.store.read();
    return state.transactions.find((item) => item.pidx === pidx) || null;
  }

  async findByPurchaseOrderId(purchaseOrderId) {
    const state = await this.store.read();
    return state.transactions.find((item) => item.purchaseOrderId === purchaseOrderId) || null;
  }

  async list() {
    const state = await this.store.read();
    return [...state.transactions].sort((left, right) => {
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
  }
}

module.exports = { TransactionRepository };

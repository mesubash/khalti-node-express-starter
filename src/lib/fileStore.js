const { mkdir, readFile, writeFile } = require("node:fs/promises");
const path = require("node:path");

const DEFAULT_STATE = {
  meta: {
    version: 1,
    seededAt: null
  },
  transactions: [],
  paymentEvents: []
};

class FileStore {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async ensure() {
    await mkdir(path.dirname(this.filePath), { recursive: true });

    try {
      await readFile(this.filePath, "utf8");
    } catch (error) {
      if (error.code !== "ENOENT") {
        throw error;
      }

      const state = {
        ...DEFAULT_STATE,
        meta: {
          ...DEFAULT_STATE.meta,
          seededAt: new Date().toISOString()
        }
      };

      await writeFile(this.filePath, JSON.stringify(state, null, 2));
    }
  }

  async read() {
    await this.ensure();
    const raw = await readFile(this.filePath, "utf8");
    return JSON.parse(raw);
  }

  async write(nextState) {
    await this.ensure();
    await writeFile(this.filePath, JSON.stringify(nextState, null, 2));
    return nextState;
  }
}

module.exports = { FileStore };

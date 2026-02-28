const { mkdir, writeFile } = require("node:fs/promises");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const dataFile = path.resolve(projectRoot, "data", "runtime.json");
const seededAt = "2026-02-28T00:00:00.000Z";

const initialState = {
  meta: {
    version: 1,
    seededAt
  },
  transactions: [],
  paymentEvents: []
};

async function main() {
  await mkdir(path.dirname(dataFile), { recursive: true });
  await writeFile(dataFile, JSON.stringify(initialState, null, 2));
  console.log(`Reset data file at ${dataFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

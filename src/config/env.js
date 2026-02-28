const path = require("node:path");
const dotenv = require("dotenv");

dotenv.config();

const projectRoot = path.resolve(__dirname, "../..");

function getRequired(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function toBoolean(value, fallback = false) {
  if (value === undefined) {
    return fallback;
  }

  return value === "true";
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3000),
  khaltiMode: process.env.KHALTI_MODE || "mock",
  khaltiBaseUrl: process.env.KHALTI_BASE_URL || "https://dev.khalti.com/api/v2",
  khaltiSecretKey: process.env.KHALTI_SECRET_KEY || "",
  publicBaseUrl: process.env.PUBLIC_BASE_URL || "http://localhost:3000",
  websiteUrl: process.env.WEBSITE_URL || "http://localhost:5173",
  callbackPath: process.env.CALLBACK_PATH || "/api/v1/payments/callback/khalti",
  strictCallbackSignature: toBoolean(process.env.STRICT_CALLBACK_SIGNATURE, false),
  dataFile: path.resolve(projectRoot, process.env.DATA_FILE || "./data/runtime.json")
};

env.callbackUrl = new URL(env.callbackPath, env.publicBaseUrl).toString();
env.isMockMode = env.khaltiMode === "mock";
env.isLiveMode = env.khaltiMode === "live";

if (!env.isMockMode && !env.isLiveMode) {
  throw new Error("KHALTI_MODE must be either `mock` or `live`.");
}

if (env.isLiveMode) {
  getRequired("KHALTI_SECRET_KEY");
}

module.exports = { env };

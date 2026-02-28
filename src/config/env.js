const path = require("node:path");
const dotenv = require("dotenv");

const projectRoot = path.resolve(__dirname, "../..");
dotenv.config({ path: path.resolve(projectRoot, ".env") });

function getRequired(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const khaltiEnvironment = process.env.KHALTI_ENV || "sandbox";
const defaultKhaltiBaseUrls = {
  sandbox: "https://dev.khalti.com/api/v2",
  production: "https://khalti.com/api/v2"
};

if (!defaultKhaltiBaseUrls[khaltiEnvironment]) {
  throw new Error("KHALTI_ENV must be either `sandbox` or `production`.");
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3000),
  khaltiEnvironment,
  khaltiBaseUrl: process.env.KHALTI_BASE_URL || defaultKhaltiBaseUrls[khaltiEnvironment],
  khaltiSecretKey: getRequired("KHALTI_SECRET_KEY"),
  publicBaseUrl: process.env.PUBLIC_BASE_URL || process.env.NGROK_URL || "http://localhost:3000",
  websiteUrl: process.env.WEBSITE_URL || "http://localhost:5173",
  callbackPath: process.env.CALLBACK_PATH || "/api/v1/payments/callback/khalti",
  dataFile: path.resolve(projectRoot, process.env.DATA_FILE || "./data/runtime.json")
};

env.callbackUrl = new URL(env.callbackPath, env.publicBaseUrl).toString();
env.isSandbox = env.khaltiEnvironment === "sandbox";
env.isProduction = env.khaltiEnvironment === "production";

module.exports = { env };

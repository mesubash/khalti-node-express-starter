const { createApp } = require("./app");
const { env } = require("./config/env");

const app = createApp();

app.listen(env.port, () => {
  console.log(`Khalti starter listening on http://localhost:${env.port}`);
  console.log(`Mode: ${env.khaltiMode}`);
  console.log(`Callback URL: ${env.callbackUrl}`);
});

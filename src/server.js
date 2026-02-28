const { createApp } = require("./app");
const { env } = require("./config/env");

const app = createApp();

app.listen(env.port, () => {
  console.log(`Khalti starter listening on http://localhost:${env.port}`);
  console.log(`Environment: ${env.khaltiEnvironment}`);
  console.log(`Callback URL: ${env.callbackUrl}`);
});

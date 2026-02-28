function renderCallbackHtml(transaction) {
  const safeStatus = transaction.status.toUpperCase();
  const amount = (transaction.amountPaisa / 100).toFixed(2);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Khalti Payment Result</title>
    <style>
      body {
        margin: 0;
        font-family: Arial, sans-serif;
        background: linear-gradient(135deg, #f8fafc, #e2e8f0);
        color: #0f172a;
      }
      main {
        max-width: 720px;
        margin: 48px auto;
        background: white;
        border-radius: 16px;
        padding: 32px;
        box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12);
      }
      h1 {
        margin-top: 0;
      }
      dl {
        display: grid;
        grid-template-columns: 180px 1fr;
        gap: 12px 16px;
      }
      dt {
        font-weight: 700;
      }
      code {
        background: #f1f5f9;
        padding: 2px 6px;
        border-radius: 6px;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Payment callback received</h1>
      <p>This page exists so developers can confirm that Khalti redirected back into the starter application.</p>
      <dl>
        <dt>Status</dt>
        <dd>${safeStatus}</dd>
        <dt>Purchase Order</dt>
        <dd><code>${transaction.purchaseOrderId}</code></dd>
        <dt>PIDX</dt>
        <dd><code>${transaction.pidx}</code></dd>
        <dt>Amount</dt>
        <dd>NPR ${amount}</dd>
        <dt>Transaction ID</dt>
        <dd><code>${transaction.gateway.transactionId || "not available"}</code></dd>
      </dl>
    </main>
  </body>
</html>`;
}

module.exports = { renderCallbackHtml };

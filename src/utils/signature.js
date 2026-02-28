const crypto = require("node:crypto");

function createHmacSignature(payload, secretKey) {
  return crypto.createHmac("sha256", secretKey).update(payload).digest("base64");
}

function buildCallbackSignaturePayload({
  pidx,
  status,
  amount,
  purchase_order_id
}) {
  return `pidx=${pidx}&status=${status}&amount=${amount}&purchase_order_id=${purchase_order_id}`;
}

function isValidSignature(payload, receivedSignature, secretKey) {
  if (!receivedSignature || !secretKey) {
    return false;
  }

  const expected = createHmacSignature(payload, secretKey);
  if (expected.length !== receivedSignature.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(receivedSignature));
}

module.exports = {
  buildCallbackSignaturePayload,
  createHmacSignature,
  isValidSignature
};

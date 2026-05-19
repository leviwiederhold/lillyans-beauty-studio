import crypto from "node:crypto";

const squareVersion = "2026-01-22";

function squareBaseUrl() {
  return process.env.SQUARE_ENVIRONMENT === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}

export function squareConfigured() {
  return Boolean(process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_LOCATION_ID);
}

export async function createSquareDepositLink({
  bookingId,
  serviceName,
  amount,
  clientEmail
}: {
  bookingId: string;
  serviceName: string;
  amount: number;
  clientEmail: string;
}) {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!token || !locationId) throw new Error("Square is not configured.");

  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const response = await fetch(`${squareBaseUrl()}/v2/online-checkout/payment-links`, {
    method: "POST",
    headers: {
      "Square-Version": squareVersion,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      idempotency_key: `booking-${bookingId}`,
      description: `Deposit for booking ${bookingId}`,
      quick_pay: {
        name: `20% Deposit - ${serviceName}`,
        price_money: { amount, currency: "USD" },
        location_id: locationId
      },
      checkout_options: {
        redirect_url: `${origin}/account?deposit=success`
      },
      pre_populated_data: {
        buyer_email: clientEmail
      },
      payment_note: `booking_id:${bookingId}`
    })
  });

  const body = await response.json();
  if (!response.ok) throw new Error(body.errors?.[0]?.detail || "Square payment link creation failed.");
  return {
    url: body.payment_link?.url || body.payment_link?.long_url,
    orderId: body.payment_link?.order_id
  };
}

export async function createSquarePaymentLink({
  idempotencyKey,
  name,
  amountCents,
  clientEmail,
  redirectPath,
  paymentNote,
}: {
  idempotencyKey: string;
  name: string;
  amountCents: number;
  clientEmail: string;
  redirectPath: string;
  paymentNote: string;
}) {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!token || !locationId) throw new Error("Square is not configured.");

  const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const response = await fetch(`${squareBaseUrl()}/v2/online-checkout/payment-links`, {
    method: "POST",
    headers: {
      "Square-Version": squareVersion,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      idempotency_key: idempotencyKey,
      quick_pay: {
        name,
        price_money: { amount: amountCents, currency: "USD" },
        location_id: locationId,
      },
      checkout_options: { redirect_url: `${origin}${redirectPath}` },
      pre_populated_data: { buyer_email: clientEmail },
      payment_note: paymentNote,
    }),
  });

  const body = await response.json();
  if (!response.ok) throw new Error(body.errors?.[0]?.detail || "Square payment link creation failed.");
  return {
    url: body.payment_link?.url || body.payment_link?.long_url,
    orderId: body.payment_link?.order_id,
  };
}

export function verifySquareWebhookSignature(rawBody: string, signature: string | null, notificationUrl: string) {
  const key = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (!key || !signature) return false;
  const hmac = crypto.createHmac("sha256", key);
  hmac.update(notificationUrl + rawBody);
  const digest = hmac.digest("base64");
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

import crypto from "crypto";
import Razorpay from "razorpay";

const toSubunits = (amount) => Math.round(Number(amount || 0) * 100);

const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

const getStripe = async () => {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  try {
    const stripeModule = await import("stripe");
    return stripeModule.default(process.env.STRIPE_SECRET_KEY);
  } catch {
    return null;
  }
};

export const createCheckout = async ({ provider, amount, currency, receipt, description }) => {
  const normalizedCurrency = (currency || "INR").toUpperCase();
  const amountSubunits = toSubunits(amount);

  if (provider === "razorpay") {
    const razorpay = getRazorpay();
    if (!razorpay) {
      throw new Error("Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
    }
    const order = await razorpay.orders.create({
      amount: amountSubunits,
      currency: normalizedCurrency,
      receipt,
      notes: { description },
    });
    return {
      orderId: order.id,
      amountSubunits: order.amount,
      currency: order.currency,
      publicKey: process.env.RAZORPAY_KEY_ID,
    };
  }

  if (provider === "stripe") {
    const stripe = await getStripe();
    if (!stripe) {
      throw new Error("Stripe is not configured. Add the stripe package and STRIPE_SECRET_KEY.");
    }
    const intent = await stripe.paymentIntents.create({
      amount: amountSubunits,
      currency: normalizedCurrency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      description,
      metadata: { receipt },
    });
    return {
      paymentIntentId: intent.id,
      clientSecret: intent.client_secret,
      amountSubunits,
      currency: normalizedCurrency,
      publicKey: process.env.STRIPE_PUBLISHABLE_KEY,
    };
  }

  return {
    orderId: `manual_${receipt}`,
    amountSubunits,
    currency: normalizedCurrency,
  };
};

export const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
  if (!process.env.RAZORPAY_KEY_SECRET) return false;
  const digest = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return digest === signature;
};

export const verifyStripePayment = async ({ paymentIntentId, expectedAmount, expectedCurrency }) => {
  const stripe = await getStripe();
  if (!stripe || !paymentIntentId) return false;
  const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return (
    intent.status === "succeeded" &&
    intent.amount === toSubunits(expectedAmount) &&
    intent.currency === String(expectedCurrency || "INR").toLowerCase()
  );
};

export const createRefund = async ({ provider, paymentId, amount, currency }) => {
  if (provider === "razorpay") {
    const razorpay = getRazorpay();
    if (!razorpay || !paymentId) return null;
    const refund = await razorpay.payments.refund(paymentId, {
      amount: toSubunits(amount),
      speed: "normal",
    });
    return refund.id;
  }

  if (provider === "stripe") {
    const stripe = await getStripe();
    if (!stripe || !paymentId) return null;
    const refund = await stripe.refunds.create({
      payment_intent: paymentId,
      amount: toSubunits(amount),
      metadata: { currency },
    });
    return refund.id;
  }

  return `manual_refund_${Date.now()}`;
};

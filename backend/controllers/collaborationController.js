import {
  DisputeModel,
  GigModel,
  MessageModel,
  NotificationModel,
  PaymentModel,
} from "../models/MarketplaceModels.js";
import { ROLES } from "../constants/roles.js";
import { createNotification } from "../utils/notify.js";
import { createCheckout, createRefund, verifyRazorpaySignature, verifyStripePayment } from "../utils/paymentGateway.js";

const makeRoom = (a, b, gig) => [String(gig || "general"), String(a), String(b)].sort().join(":");

export const listNotifications = async (req, res) => {
  try {
    const notifications = await NotificationModel.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
    return res.json({ success: true, notifications });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch notifications", error: error.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    await NotificationModel.updateMany({ user: req.user._id, _id: { $in: req.body.ids || [] } }, { read: true });
    return res.json({ success: true, message: "Notifications updated" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update notifications", error: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { receiver, gig, text, files } = req.body || {};
    if (!receiver || (!text && !files?.length)) {
      return res.status(400).json({ success: false, message: "Receiver and message content are required" });
    }

    const message = await MessageModel.create({
      room: makeRoom(req.user._id, receiver, gig),
      gig,
      sender: req.user._id,
      receiver,
      text,
      files,
    });

    const populatedMessage = await MessageModel.findById(message._id)
      .populate("sender receiver", "name email avatar role");

    await createNotification({
      user: receiver,
      title: "New message",
      message: `${req.user.name}: ${text || "sent a file"}`,
      type: "message",
      link: `/messages?receiver=${req.user._id}${gig ? `&gig=${gig}` : ""}`,
    });

    const io = req.app.get("io");
    if (io) {
      // Send to the room
      io.to(populatedMessage.room).emit("new_message", populatedMessage);
      // Send to the receiver's personal channel for immediate alert
      io.to(String(receiver)).emit("message_notification", populatedMessage);
    }

    return res.status(201).json({ success: true, message: populatedMessage });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to send message", error: error.message });
  }
};

export const listMessages = async (req, res) => {
  try {
    const { withUser, gig } = req.query;
    const filter = withUser
      ? { room: makeRoom(req.user._id, withUser, gig) }
      : { $or: [{ sender: req.user._id }, { receiver: req.user._id }] };

    const messages = await MessageModel.find(filter)
      .populate("sender receiver", "name email avatar role")
      .sort({ createdAt: 1 })
      .limit(100);

    return res.json({ success: true, messages });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch messages", error: error.message });
  }
};

const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT || 10);

const addPaymentHistory = (payment, { action, from, to, note, actor }) => {
  payment.history.push({ action, from, to, note, actor });
};

const getPaymentAccessFilter = (user) =>
  user.role === ROLES.ADMIN ? {} : { $or: [{ client: user._id }, { freelancer: user._id }] };

const syncMilestoneStatus = async (gig, milestoneId, status) => {
  if (!milestoneId) return;
  const milestone = gig.milestones.id(milestoneId);
  if (!milestone) return;
  milestone.status = status;
  await gig.save();
};

export const createPayment = async (req, res) => {
  try {
    const gig = await GigModel.findById(req.body.gig);
    if (!gig) return res.status(404).json({ success: false, message: "Gig not found" });
    if (String(gig.client) !== String(req.user._id) && req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({ success: false, message: "Only the client can fund payments" });
    }
    if (!gig.assignedFreelancer) {
      return res.status(400).json({ success: false, message: "Accept a freelancer before creating payment" });
    }

    const provider = req.body.provider || "manual";
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Payment amount must be greater than zero" });
    }

    const milestone = req.body.milestoneId ? gig.milestones.id(req.body.milestoneId) : null;
    const milestoneTitle = req.body.milestoneTitle || milestone?.title || "Project escrow";
    const currency = (req.body.currency || "INR").toUpperCase();
    const platformFee = Number(((amount * PLATFORM_FEE_PERCENT) / 100).toFixed(2));
    const freelancerReceives = Number((amount - platformFee).toFixed(2));

    const payment = await PaymentModel.create({
      gig: gig._id,
      proposal: req.body.proposal,
      milestoneId: milestone?._id,
      client: gig.client,
      freelancer: gig.assignedFreelancer,
      milestoneTitle,
      amount,
      currency,
      platformFee,
      freelancerReceives,
      provider,
      status: provider === "manual" ? "escrowed" : "pending_provider",
    });

    let checkout;
    try {
      checkout = await createCheckout({
        provider,
        amount,
        currency,
        receipt: String(payment._id),
        description: `${gig.title} - ${milestoneTitle}`,
      });
    } catch (error) {
      await payment.deleteOne();
      throw error;
    }

    payment.checkout = checkout;
    payment.providerOrderId = checkout.orderId || checkout.paymentIntentId;
    addPaymentHistory(payment, {
      action: provider === "manual" ? "escrow_funded" : "checkout_created",
      from: "created",
      to: payment.status,
      note: provider === "manual" ? "Manual escrow recorded" : `${provider} checkout created`,
      actor: req.user._id,
    });
    await payment.save();
    await syncMilestoneStatus(gig, milestone?._id, provider === "manual" ? "funded" : "pending");

    await createNotification({
      user: gig.assignedFreelancer,
      title: provider === "manual" ? "Payment escrowed" : "Payment checkout created",
      message: `${milestoneTitle} for ${gig.title} is ${payment.status}`,
      type: "payment",
      link: "/payments",
    });

    return res.status(201).json({ success: true, payment });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to create payment", error: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const payment = await PaymentModel.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });
    if (String(payment.client) !== String(req.user._id) && req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({ success: false, message: "Only the client can verify this payment" });
    }

    if (payment.provider === "razorpay") {
      const orderId = req.body.razorpay_order_id || payment.providerOrderId;
      const paymentId = req.body.razorpay_payment_id;
      const signature = req.body.razorpay_signature;
      if (!verifyRazorpaySignature({ orderId, paymentId, signature })) {
        payment.status = "failed";
        addPaymentHistory(payment, {
          action: "verification_failed",
          from: "pending_provider",
          to: "failed",
          note: "Razorpay signature mismatch",
          actor: req.user._id,
        });
        await payment.save();
        return res.status(400).json({ success: false, message: "Payment verification failed" });
      }
      payment.providerPaymentId = paymentId;
      payment.providerSignature = signature;
    } else if (payment.provider === "stripe") {
      const paymentIntentId = req.body.paymentIntentId || payment.checkout?.paymentIntentId;
      const verified = await verifyStripePayment({
        paymentIntentId,
        expectedAmount: payment.amount,
        expectedCurrency: payment.currency,
      });
      if (!verified) {
        payment.status = "failed";
        addPaymentHistory(payment, {
          action: "verification_failed",
          from: "pending_provider",
          to: "failed",
          note: "Stripe payment intent was not confirmed",
          actor: req.user._id,
        });
        await payment.save();
        return res.status(400).json({ success: false, message: "Stripe payment verification failed" });
      }
      payment.providerPaymentId = paymentIntentId;
    }

    const previousStatus = payment.status;
    payment.status = "escrowed";
    addPaymentHistory(payment, {
      action: "escrow_funded",
      from: previousStatus,
      to: "escrowed",
      note: `${payment.provider} payment verified and escrowed`,
      actor: req.user._id,
    });
    await payment.save();

    const gig = await GigModel.findById(payment.gig);
    if (gig) await syncMilestoneStatus(gig, payment.milestoneId, "funded");

    await createNotification({
      user: payment.freelancer,
      title: "Payment escrowed",
      message: `${payment.milestoneTitle} is funded and held in escrow`,
      type: "payment",
      link: "/payments",
    });

    return res.json({ success: true, payment });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update payment", error: error.message });
  }
};

export const releasePayment = async (req, res) => {
  try {
    const payment = await PaymentModel.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });
    if (String(payment.client) !== String(req.user._id) && req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({ success: false, message: "Only the client can release escrow" });
    }
    if (!["escrowed", "approved"].includes(payment.status)) {
      return res.status(400).json({ success: false, message: "Only escrowed payments can be released" });
    }

    const previousStatus = payment.status;
    payment.status = "released";
    payment.payout = {
      status: "paid",
      reference: req.body.payoutReference || `auto_payout_${Date.now()}`,
      releasedAt: new Date(),
    };
    addPaymentHistory(payment, {
      action: "payout_released",
      from: previousStatus,
      to: "released",
      note: `Automatic freelancer payout of ${payment.currency} ${payment.freelancerReceives}`,
      actor: req.user._id,
    });
    await payment.save();

    const gig = await GigModel.findById(payment.gig);
    if (gig) await syncMilestoneStatus(gig, payment.milestoneId, "paid");

    await createNotification({
      user: payment.freelancer,
      title: "Payout released",
      message: `${payment.currency} ${payment.freelancerReceives} released for ${payment.milestoneTitle}`,
      type: "payment",
      link: "/payments",
    });

    return res.json({ success: true, payment });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to release payment", error: error.message });
  }
};

export const refundPayment = async (req, res) => {
  try {
    const payment = await PaymentModel.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });
    if (String(payment.client) !== String(req.user._id) && req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({ success: false, message: "Only the client can refund escrow" });
    }
    if (!["escrowed", "pending_provider", "failed"].includes(payment.status)) {
      return res.status(400).json({ success: false, message: "Released payments cannot be refunded here" });
    }

    const refundAmount = Number(req.body.amount || payment.amount);
    if (refundAmount <= 0 || refundAmount > payment.amount) {
      return res.status(400).json({ success: false, message: "Refund amount is invalid" });
    }

    const previousStatus = payment.status;
    payment.status = "refund_pending";
    payment.refund = {
      amount: refundAmount,
      reason: req.body.reason || "Client requested refund",
      status: "requested",
    };
    addPaymentHistory(payment, {
      action: "refund_requested",
      from: previousStatus,
      to: "refund_pending",
      note: payment.refund.reason,
      actor: req.user._id,
    });

    const reference = await createRefund({
      provider: payment.provider,
      paymentId: payment.providerPaymentId,
      amount: refundAmount,
      currency: payment.currency,
    });

    payment.status = "refunded";
    payment.refund.status = "processed";
    payment.refund.reference = reference;
    payment.refund.processedAt = new Date();
    addPaymentHistory(payment, {
      action: "refund_processed",
      from: "refund_pending",
      to: "refunded",
      note: `${payment.currency} ${refundAmount} refunded`,
      actor: req.user._id,
    });
    await payment.save();

    const gig = await GigModel.findById(payment.gig);
    if (gig) await syncMilestoneStatus(gig, payment.milestoneId, "pending");

    await createNotification({
      user: payment.freelancer,
      title: "Payment refunded",
      message: `${payment.milestoneTitle} was refunded`,
      type: "payment",
      link: "/payments",
    });

    return res.json({ success: true, payment });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to refund payment", error: error.message });
  }
};

export const listPayments = async (req, res) => {
  try {
    const filter = getPaymentAccessFilter(req.user);
    const payments = await PaymentModel.find(filter)
      .populate("gig", "title")
      .populate("client freelancer", "name email")
      .sort({ createdAt: -1 });
    return res.json({ success: true, payments });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch payments", error: error.message });
  }
};

export const createDispute = async (req, res) => {
  try {
    const gig = await GigModel.findById(req.body.gig);
    if (!gig) return res.status(404).json({ success: false, message: "Gig not found" });

    const against = String(gig.client) === String(req.user._id) ? gig.assignedFreelancer : gig.client;
    const dispute = await DisputeModel.create({
      gig: gig._id,
      payment: req.body.payment || undefined,
      raisedBy: req.user._id,
      against,
      reason: req.body.reason,
      evidence: req.body.evidence || [],
    });

    return res.status(201).json({ success: true, dispute });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to create dispute", error: error.message });
  }
};

export const updateDispute = async (req, res) => {
  try {
    if (req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({ success: false, message: "Only admins can resolve disputes" });
    }
    const dispute = await DisputeModel.findByIdAndUpdate(
      req.params.id,
      {
        status: req.body.status,
        resolution: req.body.resolution,
        adminNote: req.body.adminNote,
      },
      { new: true },
    );
    if (!dispute) return res.status(404).json({ success: false, message: "Dispute not found" });
    return res.json({ success: true, dispute });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update dispute", error: error.message });
  }
};

export const listDisputes = async (req, res) => {
  try {
    const filter =
      req.user.role === ROLES.ADMIN
        ? {}
        : { $or: [{ raisedBy: req.user._id }, { against: req.user._id }] };
    const disputes = await DisputeModel.find(filter)
      .populate("gig", "title")
      .populate("raisedBy against", "name email")
      .sort({ createdAt: -1 });
    return res.json({ success: true, disputes });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch disputes", error: error.message });
  }
};

import {
  DisputeModel,
  GigModel,
  MessageModel,
  NotificationModel,
  PaymentModel,
} from "../models/MarketplaceModels.js";
import { ROLES } from "../constants/roles.js";
import { createNotification } from "../utils/notify.js";

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

    const payment = await PaymentModel.create({
      gig: gig._id,
      proposal: req.body.proposal,
      client: gig.client,
      freelancer: gig.assignedFreelancer,
      milestoneTitle: req.body.milestoneTitle,
      amount: req.body.amount,
      provider: req.body.provider || "manual",
      providerOrderId: req.body.providerOrderId,
      status: "escrowed",
    });

    await createNotification({
      user: gig.assignedFreelancer,
      title: "Payment escrowed",
      message: `Payment funded for ${gig.title}`,
      type: "payment",
      link: "/payments",
    });

    return res.status(201).json({ success: true, payment });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to create payment", error: error.message });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const payment = await PaymentModel.findById(req.params.id);
    if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });
    const canUpdate =
      req.user.role === ROLES.ADMIN ||
      String(payment.client) === String(req.user._id);
    if (!canUpdate) {
      return res.status(403).json({ success: false, message: "You cannot update this payment" });
    }

    payment.status = req.body.status || payment.status;
    await payment.save();

    await createNotification({
      user: payment.freelancer,
      title: "Payment updated",
      message: `Payment is now ${payment.status}`,
      type: "payment",
      link: "/payments",
    });

    return res.json({ success: true, payment });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update payment", error: error.message });
  }
};

export const listPayments = async (req, res) => {
  try {
    const filter =
      req.user.role === ROLES.ADMIN
        ? {}
        : { $or: [{ client: req.user._id }, { freelancer: req.user._id }] };
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

import mongoose from "mongoose";

const { Schema } = mongoose;

const milestoneSchema = new Schema(
  {
    title: { type: String, required: true },
    amount: { type: Number, default: 0 },
    dueDate: Date,
    status: {
      type: String,
      enum: ["pending", "funded", "submitted", "approved", "paid"],
      default: "pending",
    },
  },
  { _id: true },
);

const gigSchema = new Schema(
  {
    client: { type: Schema.Types.ObjectId, ref: "user", required: true },
    assignedFreelancer: { type: Schema.Types.ObjectId, ref: "user" },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, default: "General" },
    skills: [{ type: String }],
    location: { type: String, default: "" },
    budgetMin: { type: Number, default: 0 },
    budgetMax: { type: Number, default: 0 },
    documents: [{ type: String }],
    milestones: [milestoneSchema],
    status: {
      type: String,
      enum: ["draft", "open", "in-progress", "completed", "cancelled"],
      default: "open",
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    progressLogs: [
      {
        note: String,
        files: [{ type: String }],
        createdBy: { type: Schema.Types.ObjectId, ref: "user" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    deadline: Date,
  },
  { timestamps: true, versionKey: false },
);

gigSchema.index({ title: "text", description: "text", skills: "text", location: "text" });

const proposalSchema = new Schema(
  {
    gig: { type: Schema.Types.ObjectId, ref: "gig", required: true },
    freelancer: { type: Schema.Types.ObjectId, ref: "user", required: true },
    description: { type: String, required: true },
    bidAmount: { type: Number, required: true },
    estimatedDays: { type: Number, default: 1 },
    negotiatedAmount: Number,
    status: {
      type: String,
      enum: ["pending", "negotiating", "accepted", "rejected", "withdrawn"],
      default: "pending",
    },
    clientNote: String,
  },
  { timestamps: true, versionKey: false },
);

proposalSchema.index({ gig: 1, freelancer: 1 }, { unique: true });

const reviewSchema = new Schema(
  {
    gig: { type: Schema.Types.ObjectId, ref: "gig", required: true },
    reviewer: { type: Schema.Types.ObjectId, ref: "user", required: true },
    reviewee: { type: Schema.Types.ObjectId, ref: "user", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
    verifiedWork: { type: Boolean, default: true },
    fraudFlag: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false },
);

const messageSchema = new Schema(
  {
    room: { type: String, required: true, index: true },
    gig: { type: Schema.Types.ObjectId, ref: "gig" },
    sender: { type: Schema.Types.ObjectId, ref: "user", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "user", required: true },
    text: { type: String, default: "" },
    files: [{ type: String }],
    readAt: Date,
  },
  { timestamps: true, versionKey: false },
);

const paymentSchema = new Schema(
  {
    gig: { type: Schema.Types.ObjectId, ref: "gig", required: true },
    proposal: { type: Schema.Types.ObjectId, ref: "proposal" },
    milestoneId: { type: Schema.Types.ObjectId },
    client: { type: Schema.Types.ObjectId, ref: "user", required: true },
    freelancer: { type: Schema.Types.ObjectId, ref: "user", required: true },
    milestoneTitle: { type: String, default: "Project escrow" },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    platformFee: { type: Number, default: 0 },
    freelancerReceives: { type: Number, default: 0 },
    provider: { type: String, enum: ["razorpay", "stripe", "manual"], default: "manual" },
    providerOrderId: String,
    providerPaymentId: String,
    providerSignature: String,
    checkout: {
      orderId: String,
      paymentIntentId: String,
      clientSecret: String,
      amountSubunits: Number,
      currency: String,
      publicKey: String,
    },
    payout: {
      status: {
        type: String,
        enum: ["not_started", "scheduled", "paid", "failed"],
        default: "not_started",
      },
      reference: String,
      releasedAt: Date,
    },
    refund: {
      amount: { type: Number, default: 0 },
      reason: String,
      status: {
        type: String,
        enum: ["none", "requested", "processed", "failed"],
        default: "none",
      },
      reference: String,
      processedAt: Date,
    },
    history: [
      {
        action: String,
        from: String,
        to: String,
        note: String,
        actor: { type: Schema.Types.ObjectId, ref: "user" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: [
        "created",
        "pending_provider",
        "escrowed",
        "submitted",
        "approved",
        "payout_pending",
        "released",
        "refund_pending",
        "refunded",
        "failed",
      ],
      default: "created",
    },
  },
  { timestamps: true, versionKey: false },
);

paymentSchema.index({ gig: 1, milestoneId: 1 });
paymentSchema.index({ client: 1, freelancer: 1, createdAt: -1 });

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "user", required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, default: "" },
    type: {
      type: String,
      enum: ["gig", "proposal", "payment", "review", "message", "dispute", "system"],
      default: "system",
    },
    read: { type: Boolean, default: false },
    link: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false },
);

const disputeSchema = new Schema(
  {
    gig: { type: Schema.Types.ObjectId, ref: "gig", required: true },
    payment: { type: Schema.Types.ObjectId, ref: "payment" },
    raisedBy: { type: Schema.Types.ObjectId, ref: "user", required: true },
    against: { type: Schema.Types.ObjectId, ref: "user" },
    reason: { type: String, required: true },
    evidence: [{ type: String }],
    adminNote: String,
    status: {
      type: String,
      enum: ["open", "under-review", "resolved", "rejected"],
      default: "open",
    },
    resolution: { type: String, default: "" },
  },
  { timestamps: true, versionKey: false },
);

export const GigModel = mongoose.model("gig", gigSchema);
export const ProposalModel = mongoose.model("proposal", proposalSchema);
export const ReviewModel = mongoose.model("review", reviewSchema);
export const MessageModel = mongoose.model("message", messageSchema);
export const PaymentModel = mongoose.model("payment", paymentSchema);
export const NotificationModel = mongoose.model("notification", notificationSchema);
export const DisputeModel = mongoose.model("dispute", disputeSchema);

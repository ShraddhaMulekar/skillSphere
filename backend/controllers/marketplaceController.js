import { UserModel } from "../models/UserModel.js";
import {
  DisputeModel,
  GigModel,
  MessageModel,
  NotificationModel,
  PaymentModel,
  ProposalModel,
  ReviewModel,
} from "../models/MarketplaceModels.js";
import { ROLES } from "../constants/roles.js";
import { createNotification } from "../utils/notify.js";
import { getMatchScore, normalizeSkills } from "../utils/matching.js";

const populateGig = [
  { path: "client", select: "name email role location avatar" },
  { path: "assignedFreelancer", select: "name email role location avatar verificationBadge" },
];

const canAccessGig = (user, gig) =>
  user.role === ROLES.ADMIN ||
  String(gig.client?._id || gig.client) === String(user._id) ||
  String(gig.assignedFreelancer?._id || gig.assignedFreelancer || "") === String(user._id);

export const createGig = async (req, res) => {
  try {
    if (req.user.role !== ROLES.CLIENT && req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({ success: false, message: "Only clients can create gigs" });
    }

    const { title, description, category, skills, location, budgetMin, budgetMax, documents, milestones, deadline } =
      req.body || {};

    if (!title || !description) {
      return res.status(400).json({ success: false, message: "Title and description are required" });
    }

    const gig = await GigModel.create({
      client: req.user._id,
      title,
      description,
      category,
      skills: normalizeSkills(skills || []),
      location,
      budgetMin,
      budgetMax,
      documents,
      milestones,
      deadline,
    });

    return res.status(201).json({ success: true, gig });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to create gig", error: error.message });
  }
};

export const listGigs = async (req, res) => {
  try {
    const { q, skill, location, minBudget, maxBudget, status = "open", mine } = req.query;
    const filter = {};

    if (status !== "all") filter.status = status;
    if (mine === "1" && (req.user.role === ROLES.CLIENT || req.user.role === ROLES.ADMIN)) {
      filter.client = req.user._id;
    }
    if (q) filter.$text = { $search: q };
    if (skill) filter.skills = skill.toLowerCase();
    if (location) filter.location = new RegExp(location, "i");
    if (minBudget || maxBudget) {
      filter.budgetMax = {};
      if (minBudget) filter.budgetMax.$gte = Number(minBudget);
      if (maxBudget) filter.budgetMin = { $lte: Number(maxBudget) };
    }

    const gigs = await GigModel.find(filter).populate(populateGig).sort({ createdAt: -1 });
    return res.json({ success: true, gigs });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch gigs", error: error.message });
  }
};

export const getGig = async (req, res) => {
  try {
    const gig = await GigModel.findById(req.params.id).populate(populateGig);
    if (!gig) return res.status(404).json({ success: false, message: "Gig not found" });

    const proposals =
      req.user.role === ROLES.ADMIN || String(gig.client._id) === String(req.user._id)
        ? await ProposalModel.find({ gig: gig._id }).populate("freelancer", "name email location skills verificationBadge")
        : await ProposalModel.find({ gig: gig._id, freelancer: req.user._id }).populate("freelancer", "name email location skills verificationBadge");

    return res.json({ success: true, gig, proposals });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch gig", error: error.message });
  }
};

export const updateGigProgress = async (req, res) => {
  try {
    const gig = await GigModel.findById(req.params.id);
    if (!gig) return res.status(404).json({ success: false, message: "Gig not found" });
    if (!canAccessGig(req.user, gig)) {
      return res.status(403).json({ success: false, message: "You cannot update this project" });
    }

    const progress = Math.max(0, Math.min(100, Number(req.body.progress ?? gig.progress)));
    gig.progress = progress;
    gig.progressLogs.push({
      note: req.body.note || `Progress updated to ${progress}%`,
      files: req.body.files || [],
      createdBy: req.user._id,
    });
    if (progress === 100) gig.status = "completed";
    await gig.save();

    return res.json({ success: true, gig });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update progress", error: error.message });
  }
};

export const createProposal = async (req, res) => {
  try {
    if (req.user.role !== ROLES.FREELANCER) {
      return res.status(403).json({ success: false, message: "Only freelancers can apply to gigs" });
    }

    const gig = await GigModel.findById(req.params.gigId);
    if (!gig || gig.status !== "open") {
      return res.status(404).json({ success: false, message: "Open gig not found" });
    }

    const { description, bidAmount, estimatedDays } = req.body || {};
    if (!description || !bidAmount) {
      return res.status(400).json({ success: false, message: "Proposal and bid amount are required" });
    }

    const proposal = await ProposalModel.create({
      gig: gig._id,
      freelancer: req.user._id,
      description,
      bidAmount,
      estimatedDays,
    });

    await createNotification({
      user: gig.client,
      title: "New proposal received",
      message: `${req.user.name} applied to ${gig.title}`,
      type: "proposal",
      link: `/gigs/${gig._id}`,
    });

    return res.status(201).json({ success: true, proposal, message: "Proposal submitted successfully" });
  } catch (error) {
    const message = error.code === 11000 ? "You already applied to this gig" : "Failed to create proposal";
    return res.status(error.code === 11000 ? 400 : 500).json({ success: false, message, error: error.message });
  }
};

export const updateProposalStatus = async (req, res) => {
  try {
    const proposal = await ProposalModel.findById(req.params.id).populate("gig freelancer");
    if (!proposal) return res.status(404).json({ success: false, message: "Proposal not found" });

    if (String(proposal.gig.client) !== String(req.user._id) && req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({ success: false, message: "Only the client can update this proposal" });
    }

    const { status, negotiatedAmount, clientNote } = req.body || {};
    proposal.status = status || proposal.status;
    if (negotiatedAmount !== undefined) proposal.negotiatedAmount = negotiatedAmount;
    if (clientNote !== undefined) proposal.clientNote = clientNote;
    await proposal.save();

    if (status === "accepted") {
      await ProposalModel.updateMany(
        { gig: proposal.gig._id, _id: { $ne: proposal._id } },
        { status: "rejected" },
      );
      proposal.gig.assignedFreelancer = proposal.freelancer._id;
      proposal.gig.status = "in-progress";
      await proposal.gig.save();
    }

    await createNotification({
      user: proposal.freelancer._id,
      title: `Proposal ${proposal.status}`,
      message: `Your proposal for ${proposal.gig.title} is ${proposal.status}`,
      type: "proposal",
      link: `/gigs/${proposal.gig._id}`,
    });

    return res.json({ success: true, proposal });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update proposal", error: error.message });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    const gig = await GigModel.findById(req.params.gigId);
    if (!gig) return res.status(404).json({ success: false, message: "Gig not found" });
    if (String(gig.client) !== String(req.user._id) && req.user.role !== ROLES.ADMIN) {
      return res.status(403).json({ success: false, message: "Only the gig owner can view recommendations" });
    }

    const freelancers = await UserModel.find({ role: ROLES.FREELANCER, isSuspended: false }).select(
      "name email location skills hourlyRate verificationBadge avatar",
    );

    const recommendations = freelancers
      .map((freelancer) => ({
        freelancer,
        matchScore: getMatchScore(gig, freelancer),
      }))
      .filter((item) => item.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10);

    return res.json({ success: true, recommendations });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch recommendations", error: error.message });
  }
};

export const getTrendingSkills = async (_req, res) => {
  try {
    const gigs = await GigModel.find({ status: { $in: ["open", "in-progress"] } }).select("skills");
    const counts = {};
    gigs.forEach((gig) => normalizeSkills(gig.skills).forEach((skill) => (counts[skill] = (counts[skill] || 0) + 1)));
    const skills = Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return res.json({ success: true, skills });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch trending skills", error: error.message });
  }
};

export const createReview = async (req, res) => {
  try {
    const gig = await GigModel.findById(req.body.gig);
    if (!gig || !canAccessGig(req.user, gig)) {
      return res.status(404).json({ success: false, message: "Completed project not found" });
    }

    const reviewee =
      String(gig.client) === String(req.user._id) ? gig.assignedFreelancer : gig.client;
    const rating = Number(req.body.rating);
    const fraudFlag = req.body.comment?.length < 5 || rating < 1 || rating > 5;

    const review = await ReviewModel.create({
      gig: gig._id,
      reviewer: req.user._id,
      reviewee,
      rating,
      comment: req.body.comment,
      fraudFlag,
    });

    await createNotification({
      user: reviewee,
      title: "New review added",
      message: `${req.user.name} reviewed your work`,
      type: "review",
      link: `/gigs/${gig._id}`,
    });

    return res.status(201).json({ success: true, review });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to create review", error: error.message });
  }
};

export const getMyAnalytics = async (req, res) => {
  try {
    const [gigs, proposals, payments, reviews] = await Promise.all([
      GigModel.find({
        $or: [{ client: req.user._id }, { assignedFreelancer: req.user._id }],
      }),
      ProposalModel.find({ freelancer: req.user._id }),
      PaymentModel.find({
        $or: [{ client: req.user._id }, { freelancer: req.user._id }],
      }),
      ReviewModel.find({ reviewee: req.user._id }),
    ]);

    const earnings = payments
      .filter((payment) => String(payment.freelancer) === String(req.user._id) && payment.status === "released")
      .reduce((sum, payment) => sum + payment.amount, 0);
    const averageRating = reviews.length
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    return res.json({
      success: true,
      analytics: {
        profileViews: req.user.profileViews || 0,
        activeProjects: gigs.filter((gig) => gig.status === "in-progress").length,
        postedGigs: gigs.filter((gig) => String(gig.client) === String(req.user._id)).length,
        applications: proposals.length,
        earnings,
        averageRating: Number(averageRating.toFixed(1)),
        reviews: reviews.length,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch analytics", error: error.message });
  }
};

// Delete gig
export const deleteGig = async (req, res) => {
  try {
    const gig = await GigModel.findById(req.params.id);
    if (!gig) return res.status(404).json({ success: false, message: "Gig not found" });
    if (!canAccessGig(req.user, gig)) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this gig" });
    }
    await gig.deleteOne();
    return res.json({ success: true, message: "Gig deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to delete gig", error: error.message });
  }
};

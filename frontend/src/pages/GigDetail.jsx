import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import {
  createPayment,
  createReview,
  getGig,
  getRecommendations,
  submitProposal,
  updateGigProgress,
  updateProposal,
  deleteGig, } from "../api/marketplaceApi";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import Loader from "../components/ui/Loader";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";

export default function GigDetail() {
  const { id } = useParams();
  const { user } = useSelector((state) => state.auth);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [proposal, setProposal] = useState({ description: "", bidAmount: "", estimatedDays: "" });
  const [progress, setProgress] = useState({ progress: "", note: "" });
  const [review, setReview] = useState({ rating: 5, comment: "" });

  const gigQuery = useQuery({
    queryKey: ["gig", id],
    queryFn: async () => (await getGig(id)).data,
  });
  const recommendationsQuery = useQuery({
    queryKey: ["recommendations", id],
    queryFn: async () => (await getRecommendations(id)).data.recommendations,
    enabled: user?.role === "client" || user?.role === "admin",
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["gig", id] });
  const proposalMutation = useMutation({
    mutationFn: () => submitProposal(id, { ...proposal, bidAmount: Number(proposal.bidAmount), estimatedDays: Number(proposal.estimatedDays || 1) }),
    onSuccess: refresh,
  });
  const statusMutation = useMutation({
    mutationFn: ({ proposalId, data }) => updateProposal(proposalId, data),
    onSuccess: refresh,
  });
  const progressMutation = useMutation({
    mutationFn: () => updateGigProgress(id, { progress: Number(progress.progress), note: progress.note }),
    onSuccess: refresh,
  });
  const paymentMutation = useMutation({
    mutationFn: () => createPayment({ gig: id, amount: gig.budgetMax || gig.budgetMin || 0, milestoneTitle: "Project escrow" }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteGig(id),
    onSuccess: () => navigate('/gigs'),
  });
  const reviewMutation = useMutation({
    mutationFn: () => createReview({ gig: id, ...review, rating: Number(review.rating) }),
  });

  if (gigQuery.isLoading) return <Loader text="Loading gig..." />;
  const { gig, proposals } = gigQuery.data || {};
  if (!gig) return <EmptyState title="Gig not found" />;

  const isOwner = String(gig.client?._id) === String(user?.id);
  const isAssigned = String(gig.assignedFreelancer?._id) === String(user?.id);
  const canCollaborate = isOwner || isAssigned || user?.role === "admin";

  return (
    <div className="space-y-5 animate-fade-in-up">
      <PageHeader
        title={gig.title}
        subtitle={`${gig.location || "Remote/local"} · INR ${gig.budgetMin || 0} - ${gig.budgetMax || 0}`}
        action={<Link to="/gigs"><Button variant="secondary">Back</Button></Link>}
      />

      <Alert type="error" message={proposalMutation.error?.response?.data?.message || statusMutation.error?.response?.data?.message} />

      <section className="rounded-xl border border-white/10 bg-slate-800/50 p-4 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge value={gig.status} />
          <span className="text-slate-400 text-sm">{gig.category || "General"}</span>
        </div>
        <p className="text-slate-200 whitespace-pre-line">{gig.description}</p>
        <div className="flex flex-wrap gap-2">
          {(gig.skills || []).map((skill) => (
            <span key={skill} className="rounded-full bg-cyan-500/10 text-cyan-200 px-2.5 py-1 text-xs">{skill}</span>
          ))}
        </div>
        <div className="h-2 rounded-full bg-slate-950 overflow-hidden">
          <div className="h-full bg-cyan-400" style={{ width: `${gig.progress || 0}%` }} />
        </div>
        <p className="text-slate-400 text-sm">Progress: {gig.progress || 0}%</p>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {user?.role === "freelancer" && gig.status === "open" && (
          <section className="rounded-xl border border-white/10 bg-slate-800/50 p-4 space-y-3">
            <h3 className="text-white font-semibold">Submit Proposal</h3>
            <textarea value={proposal.description} onChange={(e) => setProposal({ ...proposal, description: e.target.value })} rows={4} placeholder="Describe your approach" className="w-full rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white" />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" value={proposal.bidAmount} onChange={(e) => setProposal({ ...proposal, bidAmount: e.target.value })} placeholder="Bid amount" className="rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white" />
              <input type="number" value={proposal.estimatedDays} onChange={(e) => setProposal({ ...proposal, estimatedDays: e.target.value })} placeholder="Days" className="rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white" />
            </div>
            <Button onClick={() => proposalMutation.mutate()}>Apply</Button>
          </section>
        )}

        {isOwner && (
          <section className="rounded-xl border border-white/10 bg-slate-800/50 p-4 space-y-3">
            <h3 className="text-white font-semibold">AI Recommendations</h3>
            {(recommendationsQuery.data || []).length ? (
              recommendationsQuery.data.map((item) => (
                <div key={item.freelancer._id} className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                  <div>
                    <p className="text-white text-sm">{item.freelancer.name}</p>
                    <p className="text-slate-400 text-xs">{item.freelancer.location || "No location"} · INR {item.freelancer.hourlyRate || 0}/hr</p>
                  </div>
                  <span className="text-cyan-300 text-sm">{item.matchScore}%</span>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm">No matches yet. Add clearer skills to the gig.</p>
            )}
          </section>
        )}
      </div>

      {(isOwner || user?.role === "admin" || (proposals && proposals.length > 0)) && (
        <section className="rounded-xl border border-white/10 bg-slate-800/50 p-4 space-y-3">
          <h3 className="text-white font-semibold">Proposals</h3>
          {proposals?.length ? proposals.map((item) => (
            <div key={item._id} className="rounded-lg bg-white/5 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-white text-sm">{item.freelancer?.name}</p>
                  <p className="text-slate-400 text-xs">INR {item.bidAmount} · {item.estimatedDays} days</p>
                </div>
                <StatusBadge value={item.status} />
              </div>
              <p className="text-slate-300 text-sm mt-2">{item.description}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {item.status === "pending" && (isOwner || user?.role === "admin") && (
                  <>
                    <Button className="px-3 py-1.5 text-xs" onClick={() => statusMutation.mutate({ proposalId: item._id, data: { status: "accepted" } })}>Accept</Button>
                    <Button className="px-3 py-1.5 text-xs" variant="danger" onClick={() => statusMutation.mutate({ proposalId: item._id, data: { status: "rejected" } })}>Reject</Button>
                  </>
                )}
                {(isOwner || user?.role === "admin") && (
                  <Link to={`/messages?receiver=${item.freelancer?._id || item.freelancer}&name=${encodeURIComponent(item.freelancer?.name || "")}&gig=${gig._id}`}>
                    <Button variant="secondary" className="px-3 py-1.5 text-xs">💬 Chat with Freelancer</Button>
                  </Link>
                )}
                {String(item.freelancer?._id || item.freelancer) === String(user?.id || user?._id) && (
                  <Link to={`/messages?receiver=${gig.client?._id || gig.client}&name=${encodeURIComponent(gig.client?.name || "")}&gig=${gig._id}`}>
                    <Button variant="secondary" className="px-3 py-1.5 text-xs">💬 Chat with Client</Button>
                  </Link>
                )}
              </div>
            </div>
          )) : <EmptyState title="No proposals yet" />}
        </section>
      )}

      {canCollaborate && (
        <section className="rounded-xl border border-white/10 bg-slate-800/50 p-4 space-y-3">
          <h3 className="text-white font-semibold">Project Tools</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input type="number" min="0" max="100" value={progress.progress} onChange={(e) => setProgress({ ...progress, progress: e.target.value })} placeholder="Progress %" className="rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white" />
            <input value={progress.note} onChange={(e) => setProgress({ ...progress, note: e.target.value })} placeholder="Progress note" className="rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white" />
            <Button onClick={() => progressMutation.mutate()}>Update Progress</Button>
          </div>
          {(isOwner || user?.role === "admin") && <Button variant="danger" onClick={() => deleteMutation.mutate()}>Delete Gig</Button>}
          {isOwner && <Button variant="secondary" onClick={() => paymentMutation.mutate()}>Fund Escrow Payment</Button>}
          <div className="grid grid-cols-1 md:grid-cols-[8rem_1fr_auto] gap-3">
            <input type="number" min="1" max="5" value={review.rating} onChange={(e) => setReview({ ...review, rating: e.target.value })} className="rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white" />
            <input value={review.comment} onChange={(e) => setReview({ ...review, comment: e.target.value })} placeholder="Review comment" className="rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white" />
            <Button variant="secondary" onClick={() => reviewMutation.mutate()}>Add Review</Button>
          </div>
        </section>
      )}
    </div>
  );
}

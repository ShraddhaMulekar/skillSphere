import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { createDispute, getDisputes, updateDispute } from "../api/marketplaceApi";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import Loader from "../components/ui/Loader";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";

export default function Disputes() {
  const { user } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ gig: "", payment: "", reason: "", evidence: "" });
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["disputes"],
    queryFn: async () => (await getDisputes()).data.disputes,
  });
  const createMutation = useMutation({
    mutationFn: () => createDispute({
      ...form,
      evidence: form.evidence.split(",").map((item) => item.trim()).filter(Boolean),
    }),
    onSuccess: () => {
      setForm({ gig: "", payment: "", reason: "", evidence: "" });
      queryClient.invalidateQueries({ queryKey: ["disputes"] });
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateDispute(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["disputes"] }),
  });

  if (query.isLoading) return <Loader text="Loading disputes..." />;

  return (
    <div className="space-y-5 animate-fade-in-up">
      <PageHeader title="Disputes" subtitle="Raise evidence-backed payment issues and let admins mediate." />
      <Alert type="error" message={createMutation.error?.response?.data?.message || updateMutation.error?.response?.data?.message} />
      <section className="rounded-xl border border-white/10 bg-slate-800/50 p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input value={form.gig} onChange={(e) => setForm({ ...form, gig: e.target.value })} placeholder="Gig ID" className="rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white" />
          <input value={form.payment} onChange={(e) => setForm({ ...form, payment: e.target.value })} placeholder="Payment ID (optional)" className="rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white" />
        </div>
        <textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} rows={3} placeholder="Reason" className="w-full rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white" />
        <input value={form.evidence} onChange={(e) => setForm({ ...form, evidence: e.target.value })} placeholder="Evidence URLs, comma separated" className="w-full rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white" />
        <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>Raise Dispute</Button>
      </section>

      {(query.data || []).length ? (
        <div className="space-y-3">
          {query.data.map((dispute) => (
            <div key={dispute._id} className="rounded-xl border border-white/10 bg-slate-800/50 p-4">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="text-white font-semibold">{dispute.gig?.title || "Project dispute"}</p>
                  <p className="text-slate-300 text-sm mt-1">{dispute.reason}</p>
                </div>
                <StatusBadge value={dispute.status} />
              </div>
              {dispute.resolution && <p className="text-green-300 text-sm mt-3">{dispute.resolution}</p>}
              {user?.role === "admin" && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button className="px-3 py-1.5 text-xs" variant="secondary" onClick={() => updateMutation.mutate({ id: dispute._id, data: { status: "under-review" } })}>Review</Button>
                  <Button className="px-3 py-1.5 text-xs" onClick={() => updateMutation.mutate({ id: dispute._id, data: { status: "resolved", resolution: "Resolved by admin mediation." } })}>Resolve</Button>
                  <Button className="px-3 py-1.5 text-xs" variant="danger" onClick={() => updateMutation.mutate({ id: dispute._id, data: { status: "rejected", resolution: "Rejected after review." } })}>Reject</Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No disputes" message="Disputes created by clients or freelancers will appear here." />
      )}
    </div>
  );
}

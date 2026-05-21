import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPayments, updatePayment } from "../api/marketplaceApi";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import Loader from "../components/ui/Loader";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";

export default function Payments() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["payments"],
    queryFn: async () => (await getPayments()).data.payments,
  });
  const mutation = useMutation({
    mutationFn: ({ id, status }) => updatePayment(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["payments"] }),
  });

  if (query.isLoading) return <Loader text="Loading payments..." />;

  return (
    <div className="space-y-5 animate-fade-in-up">
      <PageHeader title="Payments" subtitle="Escrow, milestone releases, refunds, and transaction history." />
      {(query.data || []).length ? (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-800/50">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-400 border-b border-white/10">
              <tr>
                <th className="p-3">Project</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Provider</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {query.data.map((payment) => (
                <tr key={payment._id} className="border-b border-white/5 text-slate-200">
                  <td className="p-3">{payment.gig?.title || payment.milestoneTitle}</td>
                  <td className="p-3">INR {payment.amount}</td>
                  <td className="p-3 capitalize">{payment.provider}</td>
                  <td className="p-3"><StatusBadge value={payment.status} /></td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button className="px-3 py-1.5 text-xs" variant="secondary" onClick={() => mutation.mutate({ id: payment._id, status: "released" })}>Release</Button>
                      <Button className="px-3 py-1.5 text-xs" variant="danger" onClick={() => mutation.mutate({ id: payment._id, status: "refunded" })}>Refund</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No payments" message="Escrow payments appear after a client accepts a proposal and funds a gig." />
      )}
    </div>
  );
}

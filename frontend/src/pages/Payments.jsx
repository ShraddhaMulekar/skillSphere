import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import {
  createPayment,
  getGigs,
  getPayments,
  refundPayment,
  releasePayment,
  verifyPayment,
} from "../api/marketplaceApi";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import Loader from "../components/ui/Loader";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";

const money = (payment, value = payment.amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: payment.currency || "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

export default function Payments() {
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.auth);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [fundForm, setFundForm] = useState({
    gig: "",
    milestoneTitle: "Project escrow",
    amount: "",
    provider: "razorpay",
    currency: "INR",
    milestoneId: "",
  });

  const query = useQuery({
    queryKey: ["payments"],
    queryFn: async () => (await getPayments()).data.payments,
  });
  const gigsQuery = useQuery({
    queryKey: ["payments-gigs", user?.id, user?.role],
    queryFn: async () => (await getGigs({ status: "all" })).data.gigs,
    enabled: user?.role === "client" || user?.role === "admin",
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["payments"] });

  const verifyMutation = useMutation({
    mutationFn: ({ id, data }) => verifyPayment(id, data),
    onSuccess: () => {
      setNotice("Payment verified and escrowed.");
      refresh();
    },
    onError: (err) => setError(err.response?.data?.message || "Payment verification failed"),
  });

  const releaseMutation = useMutation({
    mutationFn: (id) => releasePayment(id),
    onSuccess: () => {
      setNotice("Escrow released and payout marked paid.");
      refresh();
    },
    onError: (err) => setError(err.response?.data?.message || "Unable to release payment"),
  });

  const refundMutation = useMutation({
    mutationFn: (payment) => {
      const reason = window.prompt("Refund reason", "Client requested refund");
      if (reason === null) return Promise.reject(new Error("Refund cancelled"));
      return refundPayment(payment._id, { amount: payment.amount, reason });
    },
    onSuccess: () => {
      setNotice("Refund processed.");
      refresh();
    },
    onError: (err) => {
      if (err.message !== "Refund cancelled") setError(err.response?.data?.message || "Unable to refund payment");
    },
  });

  const createEscrowMutation = useMutation({
    mutationFn: () =>
      createPayment({
        gig: fundForm.gig,
        provider: fundForm.provider,
        milestoneTitle: fundForm.milestoneTitle,
        amount: Number(fundForm.amount),
        currency: fundForm.currency,
        milestoneId: fundForm.milestoneId || undefined,
      }),
    onSuccess: () => {
      setNotice("Escrow request created.");
      setFundForm((current) => ({ ...current, amount: "", milestoneId: "", milestoneTitle: "Project escrow" }));
      refresh();
    },
    onError: (err) => setError(err.response?.data?.message || "Unable to create escrow"),
  });

  const payments = useMemo(() => query.data || [], [query.data]);
  const ownedGigs = useMemo(() => {
    if (!gigsQuery.data) return [];
    if (user?.role === "admin") return gigsQuery.data;
    return gigsQuery.data.filter((gig) => String(gig.client?._id || gig.client) === String(user?.id));
  }, [gigsQuery.data, user?.id, user?.role]);
  const selectedGig = useMemo(
    () => ownedGigs.find((gig) => String(gig._id) === String(fundForm.gig)),
    [fundForm.gig, ownedGigs],
  );
  const selectedMilestones = selectedGig?.milestones || [];
  const myPayments = useMemo(
    () =>
      payments.filter((payment) =>
        user?.role === "admin"
          ? true
          : String(payment.client?._id || payment.client) === String(user?.id) ||
            String(payment.freelancer?._id || payment.freelancer) === String(user?.id),
      ),
    [payments, user?.id, user?.role],
  );
  const pendingProviderPayments = useMemo(
    () => payments.filter((payment) => payment.status === "pending_provider"),
    [payments],
  );
  const escrowReadyPayments = useMemo(
    () => payments.filter((payment) => payment.status === "escrowed"),
    [payments],
  );
  const totals = useMemo(
    () => ({
      escrowed: payments.filter((item) => item.status === "escrowed").reduce((sum, item) => sum + item.amount, 0),
      released: payments.filter((item) => item.status === "released").reduce((sum, item) => sum + item.amount, 0),
      refunded: payments.filter((item) => item.status === "refunded").reduce((sum, item) => sum + item.amount, 0),
    }),
    [payments],
  );

  const handleRazorpayCheckout = async (payment) => {
    setError("");
    const loaded = await loadRazorpay();
    if (!loaded) {
      setError("Razorpay checkout could not be loaded.");
      return;
    }
    const options = {
      key: payment.checkout?.publicKey,
      amount: payment.checkout?.amountSubunits,
      currency: payment.checkout?.currency || payment.currency || "INR",
      name: "SkillSphere Escrow",
      description: payment.milestoneTitle,
      order_id: payment.checkout?.orderId,
      prefill: { name: user?.name, email: user?.email },
      handler: (response) => verifyMutation.mutate({ id: payment._id, data: response }),
      modal: { ondismiss: () => setNotice("Checkout closed before payment was verified.") },
    };
    const checkout = new window.Razorpay(options);
    checkout.open();
  };

  const canClientAct = (payment) => user?.role === "admin" || String(payment.client?._id || payment.client) === String(user?.id);

  if (query.isLoading) return <Loader text="Loading payments..." />;

  return (
    <div className="space-y-5 animate-fade-in-up">
      <PageHeader
        title="Payments"
        subtitle="Escrow funding, milestone payouts, refunds, and transaction history."
      />
      <Alert type="success" message={notice} />
      <Alert type="error" message={error || query.error?.response?.data?.message} />

      {(user?.role === "client" || user?.role === "admin") && (
        <section className="rounded-lg border border-white/10 bg-slate-800/50 p-4 sm:p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-white font-semibold text-lg">Fund escrow</h3>
              <p className="text-slate-400 text-sm mt-1">
                Create a secure Razorpay or Stripe escrow for a gig milestone.
              </p>
            </div>
            <StatusBadge value="escrow" />
          </div>
          {gigsQuery.isLoading ? (
            <Loader text="Loading your gigs..." />
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                <select
                  value={fundForm.gig}
                  onChange={(e) => {
                    const gig = ownedGigs.find((item) => String(item._id) === e.target.value);
                    const firstMilestone = gig?.milestones?.[0];
                    setError("");
                    setFundForm({
                      ...fundForm,
                      gig: e.target.value,
                      milestoneId: firstMilestone?._id || "",
                      milestoneTitle: firstMilestone?.title || "Project escrow",
                      amount: firstMilestone?.amount ? String(firstMilestone.amount) : "",
                    });
                  }}
                  className="rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white"
                >
                  <option value="">{ownedGigs.length ? "Select your gig" : "No owned gigs found"}</option>
                  {ownedGigs.map((gig) => (
                    <option key={gig._id} value={gig._id}>
                      {gig.title}
                    </option>
                  ))}
                </select>
                <input
                  value={fundForm.milestoneTitle}
                  onChange={(e) => setFundForm({ ...fundForm, milestoneTitle: e.target.value })}
                  placeholder="Milestone title"
                  className="rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white"
                />
                <input
                  type="number"
                  min="1"
                  value={fundForm.amount}
                  onChange={(e) => setFundForm({ ...fundForm, amount: e.target.value })}
                  placeholder="Amount"
                  className="rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white"
                />
                <select
                  value={fundForm.provider}
                  onChange={(e) => setFundForm({ ...fundForm, provider: e.target.value })}
                  className="rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white"
                >
                  <option value="razorpay">Razorpay</option>
                  <option value="stripe">Stripe</option>
                  <option value="manual">Manual escrow</option>
                </select>
                <select
                  value={fundForm.currency}
                  onChange={(e) => setFundForm({ ...fundForm, currency: e.target.value })}
                  className="rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white"
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={fundForm.milestoneId}
                  onChange={(e) => {
                    const milestone = selectedMilestones.find((item) => String(item._id) === e.target.value);
                    setFundForm({
                      ...fundForm,
                      milestoneId: e.target.value,
                      milestoneTitle: milestone?.title || "Project escrow",
                      amount: milestone?.amount ? String(milestone.amount) : fundForm.amount,
                    });
                  }}
                  className="rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white flex-1 min-w-[220px]"
                  disabled={!selectedGig}
                >
                  <option value="">Project escrow</option>
                  {selectedMilestones.map((milestone) => (
                    <option key={milestone._id} value={milestone._id}>
                      {milestone.title}
                      {milestone.amount ? ` - INR ${milestone.amount}` : ""}
                    </option>
                  ))}
                </select>
                <Button
                  onClick={() => createEscrowMutation.mutate()}
                  disabled={createEscrowMutation.isPending || !fundForm.gig || !fundForm.amount}
                >
                  Create Escrow
                </Button>
              </div>
            </>
          )}
        </section>
      )}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          ["In escrow", totals.escrowed],
          ["Released", totals.released],
          ["Refunded", totals.refunded],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-white/10 bg-slate-800/50 p-4">
            <p className="text-slate-400 text-sm">{label}</p>
            <p className="text-white text-2xl font-semibold mt-1">INR {value.toLocaleString("en-IN")}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="rounded-lg border border-white/10 bg-slate-800/50 p-4">
          <p className="text-slate-400 text-sm">My transactions</p>
          <p className="text-white text-2xl font-semibold mt-1">{myPayments.length}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-slate-800/50 p-4">
          <p className="text-slate-400 text-sm">Pending checkout</p>
          <p className="text-white text-2xl font-semibold mt-1">{pendingProviderPayments.length}</p>
        </div>
        <div className="rounded-lg border border-white/10 bg-slate-800/50 p-4">
          <p className="text-slate-400 text-sm">Ready to release</p>
          <p className="text-white text-2xl font-semibold mt-1">{escrowReadyPayments.length}</p>
        </div>
      </section>

      {payments.length ? (
        <div className="overflow-x-auto rounded-lg border border-white/10 bg-slate-800/50">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-400 border-b border-white/10">
              <tr>
                <th className="p-3">Transaction</th>
                <th className="p-3">Milestone</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Provider</th>
                <th className="p-3">Payout / Refund</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment._id} className="border-b border-white/5 text-slate-200 align-top">
                  <td className="p-3 min-w-56">
                    <p className="font-medium text-white">{payment.gig?.title || "Project"}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {payment.client?.name} to {payment.freelancer?.name}
                    </p>
                  </td>
                  <td className="p-3 min-w-48">
                    <p className="text-slate-200">{payment.milestoneTitle}</p>
                    <p className="text-xs text-slate-500 mt-1">Milestone ID: {payment.milestoneId || "project"}</p>
                    <p className="text-xs text-slate-500 mt-1">Fee: {money(payment, payment.platformFee)}</p>
                  </td>
                  <td className="p-3">
                    <p>{money(payment)}</p>
                    <p className="text-xs text-slate-500">Freelancer {money(payment, payment.freelancerReceives)}</p>
                  </td>
                  <td className="p-3 capitalize">{payment.provider}</td>
                  <td className="p-3">
                    <p className="text-xs text-slate-400">Payout: {payment.payout?.status || "not_started"}</p>
                    <p className="text-xs text-slate-400 mt-1">Refund: {payment.refund?.status || "none"}</p>
                  </td>
                  <td className="p-3">
                    <StatusBadge value={payment.status} />
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      {payment.provider === "razorpay" &&
                        payment.status === "pending_provider" &&
                        canClientAct(payment) && (
                        <Button className="px-3 py-1.5 text-xs" onClick={() => handleRazorpayCheckout(payment)}>
                          Pay
                        </Button>
                      )}
                      {payment.provider === "stripe" &&
                        payment.status === "pending_provider" &&
                        canClientAct(payment) && (
                        <Button
                          className="px-3 py-1.5 text-xs"
                          variant="secondary"
                          onClick={() => setNotice(`Stripe client secret: ${payment.checkout?.clientSecret || "not available"}`)}
                        >
                          Stripe
                        </Button>
                      )}
                      {payment.status === "escrowed" && canClientAct(payment) && (
                        <>
                          <Button className="px-3 py-1.5 text-xs" variant="secondary" onClick={() => releaseMutation.mutate(payment._id)}>
                            Release
                          </Button>
                          <Button className="px-3 py-1.5 text-xs" variant="danger" onClick={() => refundMutation.mutate(payment)}>
                            Refund
                          </Button>
                        </>
                      )}
                    </div>
                    {payment.history?.length ? (
                      <details className="mt-3 text-xs text-slate-400">
                        <summary className="cursor-pointer text-slate-300">History</summary>
                        <div className="mt-2 space-y-1">
                          {payment.history.slice().reverse().map((item) => (
                            <p key={item._id || item.createdAt}>
                              {item.action}: {item.from || "-"} to {item.to || "-"}
                            </p>
                          ))}
                        </div>
                      </details>
                    ) : null}
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

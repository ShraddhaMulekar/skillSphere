import { useState } from "react";
import { useSelector } from "react-redux";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getMe, resendVerification } from "../api/authApi";
import { getMyAnalytics, getNotifications } from "../api/marketplaceApi";
import Loader from "../components/ui/Loader";
import Button from "../components/ui/Button";

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth);

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await getMe()).data.user,
  });
  const analyticsQuery = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: async () => (await getMyAnalytics()).data.analytics,
  });
  const notificationsQuery = useQuery({
    queryKey: ["notifications-summary"],
    queryFn: async () => (await getNotifications()).data.notifications,
  });

  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");
  const [manualLink, setManualLink] = useState("");

  const resendMutation = useMutation({
    mutationFn: resendVerification,
    onSuccess: (res) => {
      setResendError("");
      if (res.data.emailSent) {
        setResendMessage("Verification email sent successfully!");
        setManualLink("");
      } else {
        setResendMessage(
          "Email sending failed (SMTP not configured). Please verify manually using the link below."
        );
        setManualLink(res.data.verificationUrl || "");
      }
    },
    onError: (err) => {
      setResendMessage("");
      setResendError(
        err.response?.data?.message || "Failed to resend verification link."
      );
      setManualLink("");
    },
  });

  if (meQuery.isLoading || analyticsQuery.isLoading) {
    return <Loader text="Loading dashboard..." />;
  }

  const analytics = analyticsQuery.data || {};
  const unread = (notificationsQuery.data || []).filter((item) => !item.read).length;
  const statCards = [
    { label: "Profile Views", value: analytics.profileViews || 0, color: "from-indigo-500 to-violet-500", icon: "Views", to: "/profile" },
    { label: "Active Projects", value: analytics.activeProjects || 0, color: "from-cyan-500 to-blue-500", icon: "Work", to: "/gigs" },
    { label: "Earnings", value: `INR ${analytics.earnings || 0}`, color: "from-emerald-500 to-teal-500", icon: "Pay", to: "/payments" },
    { label: "Unread Alerts", value: unread, color: "from-amber-500 to-orange-500", icon: "Alert", to: "/notifications" },
  ];

  const latestUser = meQuery.data || user;

  const roleMessages = {
    client: "Post gigs, compare proposals, fund escrow, and track delivery.",
    freelancer: "Find matched gigs, submit proposals, message clients, and grow your reputation.",
    admin: "Monitor users, payments, disputes, verification, and platform health.",
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in-up">
      {!latestUser?.isVerified && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="font-semibold text-base text-amber-100 flex items-center gap-2">
                <span>⚠️</span> Email Verification Required
              </p>
              <p className="mt-1 text-amber-200/80">
                Please verify your email address to unlock all platform features.
              </p>
              {resendMessage && <p className="mt-2 text-green-300 font-medium">{resendMessage}</p>}
              {resendError && <p className="mt-2 text-red-300 font-medium">{resendError}</p>}
              {manualLink && (
                <div className="mt-2 p-2 bg-slate-900/80 rounded border border-amber-400/20 break-all text-xs">
                  <span className="font-bold text-amber-300 block mb-1">Manual Verification Link:</span>
                  <a href={manualLink} className="text-cyan-300 underline font-medium hover:text-cyan-200">
                    {manualLink}
                  </a>
                </div>
              )}
            </div>
            <Button
              onClick={() => resendMutation.mutate()}
              disabled={resendMutation.isPending}
              variant="secondary"
              className="sm:w-auto w-full self-start sm:self-center border-amber-400/40 hover:bg-amber-400/10 text-amber-100 whitespace-nowrap"
            >
              {resendMutation.isPending ? "Sending..." : "Resend Verification Link"}
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {statCards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className={`bg-gradient-to-br ${card.color} rounded-xl p-4 sm:p-6 text-white shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 block cursor-pointer`}
          >
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <p className="text-white/80 text-xs sm:text-sm truncate">{card.label}</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-1 truncate">{card.value}</p>
              </div>
              <span className="text-[10px] uppercase tracking-wide text-white/70">{card.icon}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-2">Role Workspace</h2>
          <p className="text-slate-400 text-sm sm:text-base mb-4">{roleMessages[latestUser?.role]}</p>
          <ul className="space-y-2 sm:space-y-3 text-slate-300 text-sm sm:text-base">
            <li className="flex items-start gap-2"><span className="text-green-400 shrink-0">Done</span><span>Authentication and profile setup</span></li>
            <li className="flex items-start gap-2"><span className={latestUser?.isVerified ? "text-green-400 shrink-0" : "text-amber-400 shrink-0"}>{latestUser?.isVerified ? "Done" : "Open"}</span><span>Email verification</span></li>
            <li className="flex items-start gap-2"><span className="text-cyan-400 shrink-0">Live</span><span>Marketplace, proposals, chat, payments, reviews, disputes, and analytics</span></li>
          </ul>
        </div>

        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Your Account</h2>
          <div className="space-y-2 sm:space-y-3 text-slate-300 text-sm sm:text-base break-words">
            <p><span className="text-slate-500">Name:</span> {latestUser?.name}</p>
            <p className="break-all"><span className="text-slate-500">Email:</span> {latestUser?.email}</p>
            <p><span className="text-slate-500">Role:</span> <span className="capitalize text-cyan-300">{latestUser?.role}</span></p>
            <p><span className="text-slate-500">Status:</span> {latestUser?.isVerified ? <span className="text-green-400">Verified</span> : <span className="text-amber-400">Pending verification</span>}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { getMyAnalytics } from "../api/marketplaceApi";
import Loader from "../components/ui/Loader";
import PageHeader from "../components/ui/PageHeader";

export default function Analytics() {
  const { user } = useSelector((state) => state.auth);
  const query = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => (await getMyAnalytics()).data.analytics,
  });

  if (query.isLoading) return <Loader text="Loading analytics..." />;
  const analytics = query.data || {};
  const cards = [
    { label: "Profile views", value: analytics.profileViews || 0, to: "/profile" },
    { label: "Active projects", value: analytics.activeProjects || 0, to: "/gigs?status=in-progress" },
    ...(user?.role === "client" || user?.role === "admin"
      ? [{ label: "Posted gigs", value: analytics.postedGigs || 0, to: "/gigs?mine=1" }]
      : []),
    { label: "Applications", value: analytics.applications || 0, to: "/gigs?status=all" },
    { label: "Earnings", value: `INR ${analytics.earnings || 0}`, to: "/payments" },
    { label: "Average rating", value: analytics.averageRating || 0, to: "/profile" },
  ];

  return (
    <div className="space-y-5 animate-fade-in-up">
      <PageHeader title="Analytics" subtitle="Track profile, work, proposal, revenue, and review performance." />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link key={card.label} to={card.to} className="rounded-xl border border-white/10 bg-slate-800/50 p-4 hover:bg-slate-800 transition-colors">
            <p className="text-slate-400 text-sm">{card.label}</p>
            <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

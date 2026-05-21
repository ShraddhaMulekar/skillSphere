import { useQuery } from "@tanstack/react-query";
import { getMyAnalytics } from "../api/marketplaceApi";
import Loader from "../components/ui/Loader";
import PageHeader from "../components/ui/PageHeader";

export default function Analytics() {
  const query = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => (await getMyAnalytics()).data.analytics,
  });

  if (query.isLoading) return <Loader text="Loading analytics..." />;
  const analytics = query.data || {};
  const cards = [
    ["Profile views", analytics.profileViews || 0],
    ["Active projects", analytics.activeProjects || 0],
    ["Posted gigs", analytics.postedGigs || 0],
    ["Applications", analytics.applications || 0],
    ["Earnings", `INR ${analytics.earnings || 0}`],
    ["Average rating", analytics.averageRating || 0],
  ];

  return (
    <div className="space-y-5 animate-fade-in-up">
      <PageHeader title="Analytics" subtitle="Track profile, work, proposal, revenue, and review performance." />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-slate-800/50 p-4">
            <p className="text-slate-400 text-sm">{label}</p>
            <p className="text-2xl font-bold text-white mt-1">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

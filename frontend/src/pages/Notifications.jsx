import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getNotifications, markNotificationsRead } from "../api/marketplaceApi";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import Loader from "../components/ui/Loader";
import PageHeader from "../components/ui/PageHeader";

export default function Notifications() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await getNotifications()).data.notifications,
  });
  const mutation = useMutation({
    mutationFn: markNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (query.isLoading) return <Loader text="Loading notifications..." />;
  const unreadIds = (query.data || []).filter((item) => !item.read).map((item) => item._id);

  return (
    <div className="space-y-5 animate-fade-in-up">
      <PageHeader
        title="Notifications"
        subtitle="Real-time-ready updates for gigs, proposals, payments, reviews, messages, and disputes."
        action={<Button variant="secondary" disabled={!unreadIds.length} onClick={() => mutation.mutate(unreadIds)}>Mark all read</Button>}
      />
      {(query.data || []).length ? (
        <div className="space-y-3">
          {query.data.map((item) => {
            const CardContent = (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-white font-semibold">{item.title}</p>
                  <p className="text-slate-300 text-sm mt-1">{item.message}</p>
                </div>
                <span className="text-slate-500 text-xs capitalize">{item.type}</span>
              </div>
            );

            const cardClasses = `rounded-xl border p-4 transition-all duration-200 ${
              item.read ? "border-white/10 bg-slate-800/40 hover:bg-slate-800/60" : "border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20"
            }`;

            if (item.link) {
              return (
                <Link key={item._id} to={item.link} className={`block ${cardClasses}`}>
                  {CardContent}
                </Link>
              );
            }

            return (
              <div key={item._id} className={cardClasses}>
                {CardContent}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No notifications" message="Your workflow updates will appear here." />
      )}
    </div>
  );
}

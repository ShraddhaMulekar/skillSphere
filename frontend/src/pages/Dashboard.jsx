import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "../api/authApi";
import Loader from "../components/ui/Loader";

const statCards = [
  { label: "Profile Views", value: "128", color: "from-indigo-500 to-purple-500", icon: "👁️" },
  { label: "Active Projects", value: "3", color: "from-cyan-500 to-blue-500", icon: "📁" },
  { label: "Earnings", value: "₹12,500", color: "from-pink-500 to-rose-500", icon: "💰" },
  { label: "Rating", value: "4.8", color: "from-amber-500 to-orange-500", icon: "⭐" },
];

export default function Dashboard() {
  const { user } = useSelector((state) => state.auth);

  const { isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await getMe();
      return res.data.user;
    },
  });

  if (isLoading) return <Loader text="Loading dashboard..." />;

  const roleMessages = {
    client: "Find verified local freelancers for your next project.",
    freelancer: "Discover gigs matched to your skills near you.",
    admin: "Monitor platform health and user activity.",
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in-up">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className={`bg-gradient-to-br ${card.color} rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white shadow-xl transition-all duration-300 hover:scale-[1.02] sm:hover:scale-105`}
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="flex justify-between items-start gap-2">
              <div className="min-w-0">
                <p className="text-white/80 text-xs sm:text-sm truncate">
                  {card.label}
                </p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold mt-0.5 sm:mt-1 truncate">
                  {card.value}
                </p>
              </div>
              <span className="text-2xl sm:text-3xl shrink-0">{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-slate-800/50 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
            Quick Start
          </h2>
          <p className="text-slate-400 text-sm sm:text-base mb-4">
            {roleMessages[user?.role]}
          </p>
          <ul className="space-y-2 sm:space-y-3 text-slate-300 text-sm sm:text-base">
            <li className="flex items-start gap-2">
              <span className="text-green-400 shrink-0">✓</span>
              <span>Complete your profile</span>
            </li>
            <li className="flex items-start gap-2">
              <span
                className={`shrink-0 ${user?.isVerified ? "text-green-400" : "text-amber-400"}`}
              >
                {user?.isVerified ? "✓" : "○"}
              </span>
              <span>Verify your email</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-500 shrink-0">○</span>
              <span>Week 2: Browse gigs marketplace</span>
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-indigo-900/50 to-pink-900/50 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 animate-pulse-glow">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">
            Your Account
          </h2>
          <div className="space-y-2 sm:space-y-3 text-slate-300 text-sm sm:text-base break-words">
            <p>
              <span className="text-slate-500">Name:</span> {user?.name}
            </p>
            <p className="break-all">
              <span className="text-slate-500">Email:</span> {user?.email}
            </p>
            <p>
              <span className="text-slate-500">Role:</span>{" "}
              <span className="capitalize text-pink-300">{user?.role}</span>
            </p>
            <p>
              <span className="text-slate-500">Status:</span>{" "}
              {user?.isVerified ? (
                <span className="text-green-400">Verified</span>
              ) : (
                <span className="text-amber-400">Pending verification</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

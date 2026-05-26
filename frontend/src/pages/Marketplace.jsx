import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { useState } from "react";
import { getGigs, getTrendingSkills, deleteGig } from "../api/marketplaceApi";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import Loader from "../components/ui/Loader";
import PageHeader from "../components/ui/PageHeader";
import StatusBadge from "../components/ui/StatusBadge";

export default function Marketplace() {
  const { user } = useSelector((state) => state.auth);
  const [filters, setFilters] = useState({ q: "", skill: "", location: "", status: "open" });
  const queryClient = useQueryClient();

  const gigsQuery = useQuery({
    queryKey: ["gigs", filters],
    queryFn: async () => (await getGigs(filters)).data.gigs,
  });
  const trendsQuery = useQuery({
    queryKey: ["trending-skills"],
    queryFn: async () => (await getTrendingSkills()).data.skills,
  });

  const deleteMutation = useMutation({
    mutationFn: (gigId) => deleteGig(gigId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gigs"] });
    },
  });

  const handleDelete = (e, gigId) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this gig?")) {
      deleteMutation.mutate(gigId);
    }
  };

  const updateFilter = (event) => {
    setFilters({ ...filters, [event.target.name]: event.target.value });
  };

  if (gigsQuery.isLoading) return <Loader text="Loading marketplace..." />;

  return (
    <div className="space-y-5 animate-fade-in-up">
      <PageHeader
        title="Gig Marketplace"
        subtitle="Search local projects, apply, and manage client work."
        action={
          (user?.role === "client" || user?.role === "admin") && (
            <Link to="/gigs/new">
              <Button>Create Gig</Button>
            </Link>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_16rem] gap-4">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 rounded-xl border border-white/10 bg-slate-800/50 p-4">
            <input name="q" value={filters.q} onChange={updateFilter} placeholder="Search gigs" className="rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white text-sm" />
            <input name="skill" value={filters.skill} onChange={updateFilter} placeholder="Skill" className="rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white text-sm" />
            <input name="location" value={filters.location} onChange={updateFilter} placeholder="Location" className="rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white text-sm" />
            <select name="status" value={filters.status} onChange={updateFilter} className="rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white text-sm">
              <option value="open">Open</option>
              <option value="in-progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="all">All</option>
            </select>
          </div>

          {gigsQuery.data?.length ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {gigsQuery.data.map((gig) => {
                const isOwner = String(gig.client?._id) === String(user?.id);
                const canDelete = isOwner || user?.role === "admin";

                return (
                  <Link key={gig._id} to={`/gigs/${gig._id}`} className="rounded-xl border border-white/10 bg-slate-800/50 p-4 hover:bg-slate-800 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-white font-semibold truncate">{gig.title}</h3>
                        <p className="text-slate-400 text-sm mt-1 line-clamp-2">{gig.description}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge value={gig.status} />
                        {canDelete && (
                          <button
                            type="button"
                            onClick={(e) => handleDelete(e, gig._id)}
                            className="rounded-lg bg-red-500/10 text-red-400 px-2.5 py-1 text-xs font-medium hover:bg-red-500/20 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {(gig.skills || []).map((skill) => (
                        <span key={skill} className="rounded-full bg-cyan-500/10 text-cyan-200 px-2.5 py-1 text-xs">{skill}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-4 text-sm text-slate-300">
                      <span>{gig.location || "Remote/local"}</span>
                      <span>INR {gig.budgetMin || 0} - {gig.budgetMax || 0}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <EmptyState title="No gigs found" message="Try changing filters or create a new client gig." />
          )}
        </div>

        <aside className="rounded-xl border border-white/10 bg-slate-800/50 p-4 h-fit">
          <h3 className="text-white font-semibold mb-3">Trending Skills</h3>
          <div className="space-y-2">
            {(trendsQuery.data || []).map((skill) => (
              <button
                type="button"
                key={skill.name}
                onClick={() => setFilters({ ...filters, skill: skill.name })}
                className="w-full flex items-center justify-between rounded-lg bg-white/5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
              >
                <span>{skill.name}</span>
                <span className="text-slate-500">{skill.count}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminStats,
  getAdminUsers,
  updateAdminUserStatus,
} from "../api/adminApi";
import Loader from "../components/ui/Loader";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";

export default function Admin() {
  const queryClient = useQueryClient();
  const statsQuery = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const res = await getAdminStats();
      return res.data.stats;
    },
  });

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await getAdminUsers();
      return res.data.users;
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, data }) => updateAdminUserStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });

  if (statsQuery.isLoading || usersQuery.isLoading) {
    return <Loader text="Loading admin panel..." />;
  }

  const error =
    statsQuery.error?.response?.data?.message ||
    usersQuery.error?.response?.data?.message;

  if (error) {
    return <Alert type="error" message={error} />;
  }

  const stats = statsQuery.data;

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in-up space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
        <p className="text-slate-400 text-sm">Platform overview (admin only)</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total users", value: stats?.totalUsers },
          { label: "Clients", value: stats?.clients },
          { label: "Freelancers", value: stats?.freelancers },
          { label: "Verified", value: stats?.verified },
          { label: "Suspended", value: stats?.suspended },
          { label: "Open gigs", value: stats?.openGigs },
          { label: "Active work", value: stats?.activeProjects },
          { label: "Revenue", value: `INR ${stats?.platformRevenue || 0}` },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-slate-800/50 border border-white/10 rounded-xl p-4"
          >
            <p className="text-slate-400 text-xs">{item.label}</p>
            <p className="text-2xl font-bold text-amber-300">{item.value ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 sm:p-6 overflow-x-auto">
        <h3 className="text-lg font-semibold text-white mb-4">All users</h3>
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-slate-400 border-b border-white/10">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Role</th>
              <th className="py-2 pr-4">Verified</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(usersQuery.data || []).map((u) => (
              <tr key={u._id} className="border-b border-white/5 text-slate-200">
                <td className="py-2 pr-4">{u.name}</td>
                <td className="py-2 pr-4">{u.email}</td>
                <td className="py-2 pr-4 capitalize">{u.role}</td>
                <td className="py-2 pr-4">{u.isVerified ? "Yes" : "No"}</td>
                <td className="py-2 pr-4">
                  {u.isSuspended ? (
                    <span className="text-red-300">Suspended</span>
                  ) : (
                    <span className="text-green-300">Active</span>
                  )}
                </td>
                <td className="py-2">
                  <div className="flex flex-wrap gap-2">
                    {!u.isVerified && (
                      <Button
                        type="button"
                        variant="secondary"
                        className="px-3 py-1.5 text-xs"
                        disabled={statusMutation.isPending}
                        onClick={() =>
                          statusMutation.mutate({
                            id: u._id,
                            data: { isVerified: true },
                          })
                        }
                      >
                        Verify
                      </Button>
                    )}
                    {u.role === "freelancer" && (
                      <Button
                        type="button"
                        variant="secondary"
                        className="px-3 py-1.5 text-xs"
                        disabled={statusMutation.isPending}
                        onClick={() =>
                          statusMutation.mutate({
                            id: u._id,
                            data: { verificationBadge: !u.verificationBadge },
                          })
                        }
                      >
                        {u.verificationBadge ? "Remove Badge" : "Badge"}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant={u.isSuspended ? "secondary" : "danger"}
                      className="px-3 py-1.5 text-xs"
                      disabled={statusMutation.isPending}
                      onClick={() =>
                        statusMutation.mutate({
                          id: u._id,
                          data: { isSuspended: !u.isSuspended },
                        })
                      }
                    >
                      {u.isSuspended ? "Restore" : "Suspend"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

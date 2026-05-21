import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMessages, sendMessage } from "../api/marketplaceApi";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import EmptyState from "../components/ui/EmptyState";
import Loader from "../components/ui/Loader";
import PageHeader from "../components/ui/PageHeader";

export default function Messages() {
  const [form, setForm] = useState({ receiver: "", gig: "", text: "", files: "" });
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["messages"],
    queryFn: async () => (await getMessages()).data.messages,
  });
  const mutation = useMutation({
    mutationFn: () => sendMessage({
      ...form,
      files: form.files.split(",").map((file) => file.trim()).filter(Boolean),
    }),
    onSuccess: () => {
      setForm({ receiver: "", gig: "", text: "", files: "" });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });

  if (query.isLoading) return <Loader text="Loading messages..." />;

  return (
    <div className="space-y-5 animate-fade-in-up">
      <PageHeader title="Messages" subtitle="Message clients or freelancers, share files, and keep project chat history." />
      <Alert type="error" message={mutation.error?.response?.data?.message} />
      <section className="rounded-xl border border-white/10 bg-slate-800/50 p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input value={form.receiver} onChange={(e) => setForm({ ...form, receiver: e.target.value })} placeholder="Receiver user ID" className="rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white" />
          <input value={form.gig} onChange={(e) => setForm({ ...form, gig: e.target.value })} placeholder="Gig ID (optional)" className="rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white" />
        </div>
        <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} rows={3} placeholder="Message" className="w-full rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white" />
        <input value={form.files} onChange={(e) => setForm({ ...form, files: e.target.value })} placeholder="File URLs, comma separated" className="w-full rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white" />
        <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>Send</Button>
      </section>
      {(query.data || []).length ? (
        <div className="space-y-3">
          {query.data.map((message) => (
            <div key={message._id} className="rounded-xl border border-white/10 bg-slate-800/50 p-4">
              <p className="text-slate-400 text-xs">{message.sender?.name} to {message.receiver?.name}</p>
              <p className="text-white mt-1">{message.text}</p>
              {!!message.files?.length && <p className="text-cyan-300 text-sm mt-2">{message.files.join(", ")}</p>}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No messages yet" message="Start a conversation with a user ID from a gig or admin list." />
      )}
    </div>
  );
}

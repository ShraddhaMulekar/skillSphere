import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createGig } from "../api/marketplaceApi";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import PageHeader from "../components/ui/PageHeader";

const initialForm = {
  title: "",
  description: "",
  category: "",
  skills: "",
  location: "",
  budgetMin: "",
  budgetMax: "",
  deadline: "",
};

export default function CreateGig() {
  const [form, setForm] = useState(initialForm);
  const [milestone, setMilestone] = useState({ title: "", amount: "", dueDate: "" });
  const [milestones, setMilestones] = useState([]);
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: createGig,
    onSuccess: (res) => navigate(`/gigs/${res.data.gig._id}`),
  });

  const change = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const addMilestone = () => {
    if (!milestone.title) return;
    setMilestones([...milestones, { ...milestone, amount: Number(milestone.amount || 0) }]);
    setMilestone({ title: "", amount: "", dueDate: "" });
  };

  const submit = (event) => {
    event.preventDefault();
    mutation.mutate({
      ...form,
      skills: form.skills.split(",").map((skill) => skill.trim()).filter(Boolean),
      budgetMin: Number(form.budgetMin || 0),
      budgetMax: Number(form.budgetMax || 0),
      milestones,
    });
  };

  return (
    <div className="max-w-3xl space-y-5 animate-fade-in-up">
      <PageHeader title="Create Gig" subtitle="Define scope, budget, milestones, and local skill needs." />
      <Alert type="error" message={mutation.error?.response?.data?.message} />

      <form onSubmit={submit} className="rounded-xl border border-white/10 bg-slate-800/50 p-4 sm:p-6 space-y-4">
        <input name="title" value={form.title} onChange={change} required placeholder="Project title" className="w-full rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white" />
        <textarea name="description" value={form.description} onChange={change} required rows={5} placeholder="Project description" className="w-full rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input name="category" value={form.category} onChange={change} placeholder="Category" className="rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white" />
          <input name="skills" value={form.skills} onChange={change} placeholder="Skills, comma separated" className="rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white" />
          <input name="location" value={form.location} onChange={change} placeholder="Location" className="rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white" />
          <input name="deadline" type="date" value={form.deadline} onChange={change} className="rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white" />
          <input name="budgetMin" type="number" value={form.budgetMin} onChange={change} placeholder="Min budget" className="rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white" />
          <input name="budgetMax" type="number" value={form.budgetMax} onChange={change} placeholder="Max budget" className="rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white" />
        </div>

        <div className="rounded-xl border border-white/10 p-4 space-y-3">
          <p className="text-white font-semibold">Milestones</p>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_8rem_10rem_auto] gap-2">
            <input value={milestone.title} onChange={(e) => setMilestone({ ...milestone, title: e.target.value })} placeholder="Title" className="rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white text-sm" />
            <input type="number" value={milestone.amount} onChange={(e) => setMilestone({ ...milestone, amount: e.target.value })} placeholder="Amount" className="rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white text-sm" />
            <input type="date" value={milestone.dueDate} onChange={(e) => setMilestone({ ...milestone, dueDate: e.target.value })} className="rounded-lg bg-slate-950 border border-white/10 px-3 py-2 text-white text-sm" />
            <Button type="button" variant="secondary" onClick={addMilestone}>Add</Button>
          </div>
          {milestones.map((item, index) => (
            <p key={`${item.title}-${index}`} className="text-slate-300 text-sm">{item.title} - INR {item.amount}</p>
          ))}
        </div>

        <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Creating..." : "Create Gig"}</Button>
      </form>
    </div>
  );
}

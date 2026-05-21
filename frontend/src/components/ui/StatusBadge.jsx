const colors = {
  open: "bg-green-500/15 text-green-300 border-green-500/30",
  "in-progress": "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  completed: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
  accepted: "bg-green-500/15 text-green-300 border-green-500/30",
  rejected: "bg-red-500/15 text-red-300 border-red-500/30",
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  escrowed: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  released: "bg-green-500/15 text-green-300 border-green-500/30",
  refunded: "bg-red-500/15 text-red-300 border-red-500/30",
};

export default function StatusBadge({ value }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs capitalize ${colors[value] || "bg-white/10 text-slate-300 border-white/10"}`}>
      {value || "unknown"}
    </span>
  );
}

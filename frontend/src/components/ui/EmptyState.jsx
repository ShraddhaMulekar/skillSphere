export default function EmptyState({ title, message }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
      <p className="text-white font-semibold">{title}</p>
      {message && <p className="text-slate-400 text-sm mt-1">{message}</p>}
    </div>
  );
}

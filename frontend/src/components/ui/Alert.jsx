export default function Alert({ type = "error", message }) {
  if (!message) return null;

  const styles = {
    error: "bg-red-500/20 border-red-400 text-red-100",
    success: "bg-green-500/20 border-green-400 text-green-100",
    info: "bg-blue-500/20 border-blue-400 text-blue-100",
  };

  return (
    <div
      className={`mb-4 px-4 py-3 rounded-xl border animate-fade-in-up ${styles[type]}`}
    >
      {message}
    </div>
  );
}

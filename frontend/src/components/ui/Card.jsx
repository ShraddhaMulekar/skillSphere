export default function Card({ children, className = "", title, subtitle }) {
  return (
    <div
      className={`glass rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl animate-fade-in-up ${className}`}
    >
      {title && (
        <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
      )}
      {subtitle && <p className="text-white/70 text-sm mb-4">{subtitle}</p>}
      {children}
    </div>
  );
}

import { Link } from "react-router-dom";

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen min-h-[100dvh] relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 animate-gradient">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-4 sm:top-20 sm:left-10 w-48 h-48 sm:w-72 sm:h-72 bg-cyan-400/20 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-10 right-4 sm:bottom-20 sm:right-10 w-56 h-56 sm:w-96 sm:h-96 bg-pink-500/20 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 sm:w-64 sm:h-64 bg-amber-400/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="relative z-10 min-h-screen min-h-[100dvh] flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <Link
          to="/"
          className="mb-6 sm:mb-8 text-2xl sm:text-3xl font-bold text-white tracking-tight hover:scale-105 transition-transform"
        >
          <span className="bg-gradient-to-r from-cyan-300 to-pink-300 bg-clip-text text-transparent">
            SkillSphere
          </span>
        </Link>

        <div className="w-full max-w-md animate-fade-in-up">
          <div className="text-center mb-6 sm:mb-8 px-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {title}
            </h1>
            {subtitle && (
              <p className="text-white/70 text-sm sm:text-base">{subtitle}</p>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

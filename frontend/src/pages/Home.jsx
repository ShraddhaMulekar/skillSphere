import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import Button from "../components/ui/Button";

export default function Home() {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 animate-gradient overflow-x-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-indigo-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-40 sm:w-80 h-40 sm:h-80 bg-pink-500/20 rounded-full blur-3xl animate-float" />
      </div>

      <nav className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
          SkillSphere
        </span>
        <div className="flex flex-wrap gap-2 sm:gap-4 justify-center w-full sm:w-auto">
          {isAuthenticated ? (
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto text-sm sm:text-base px-4 sm:px-6">
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login" className="flex-1 sm:flex-none min-w-[120px]">
                <Button variant="secondary" className="w-full text-sm sm:text-base px-4 sm:px-6">
                  Login
                </Button>
              </Link>
              <Link to="/register" className="flex-1 sm:flex-none min-w-[120px]">
                <Button className="w-full text-sm sm:text-base px-4 sm:px-6">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="relative z-10 flex flex-col items-center justify-center text-center px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 sm:mb-6 animate-fade-in-up leading-tight">
          Hyperlocal{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
            Freelance
          </span>{" "}
          Ecosystem
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mb-8 sm:mb-10 animate-fade-in-up px-1">
          Connect with verified local professionals. AI-powered matching,
          milestone payments, and real-time collaboration — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center w-full max-w-md sm:max-w-none animate-fade-in-up">
          <Link to="/register" state={{ role: "client" }} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8">
              Start as Client
            </Button>
          </Link>
          <Link to="/register" state={{ role: "freelancer" }} className="w-full sm:w-auto">
            <Button
              variant="secondary"
              className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8"
            >
              Join as Freelancer
            </Button>
          </Link>
          <Link to="/register" state={{ role: "admin" }} className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 text-amber-300 border-amber-500/50 hover:bg-amber-500/10"
            >
              Connect as Admin
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-12 sm:mt-16 lg:mt-20 max-w-4xl w-full">
          {[
            { icon: "🤖", title: "AI Matching", desc: "Smart gig recommendations" },
            { icon: "📍", title: "Hyperlocal", desc: "Find talent near you" },
            { icon: "🔒", title: "Secure Pay", desc: "Escrow milestone payments" },
          ].map((f) => (
            <div
              key={f.title}
              className="glass rounded-2xl p-5 sm:p-6 hover:scale-[1.02] sm:hover:scale-105 transition-transform duration-300"
            >
              <span className="text-3xl sm:text-4xl">{f.icon}</span>
              <h3 className="text-white font-bold mt-3 text-base sm:text-lg">
                {f.title}
              </h3>
              <p className="text-slate-400 text-sm mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

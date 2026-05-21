import { Link } from "react-router-dom";
import Button from "../components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 text-center">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px]" />
      </div>

      <h1 className="text-9xl font-black text-white/10 relative z-10 transition-transform duration-700 hover:scale-110">
        404
      </h1>
      
      <div className="relative z-10 -mt-12 sm:-mt-16">
        <h2 className="text-2xl sm:text-4xl font-bold mb-4">Lost in the SkillSphere?</h2>
        <p className="text-slate-400 max-w-md mx-auto mb-8">
          The page you're looking for doesn't exist or has been moved to another coordinate.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button variant="secondary" className="w-full sm:w-auto">
              Go Home
            </Button>
          </Link>
          <Link to="/login">
            <Button className="w-full sm:w-auto">
              Sign In
            </Button>
          </Link>
        </div>
      </div>
      
      <button 
        onClick={() => window.history.back()}
        className="mt-12 text-slate-500 hover:text-white transition-colors text-sm"
      >
        ← Go Back
      </button>
    </div>
  );
}

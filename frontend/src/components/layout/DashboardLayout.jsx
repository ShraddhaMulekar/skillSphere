import { useState, useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/authSlice";
import Button from "../ui/Button";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "Home", short: "Home" },
  { to: "/gigs", label: "Marketplace", icon: "Gigs", short: "Gigs" },
  { to: "/messages", label: "Messages", icon: "Chat", short: "Chat" },
  { to: "/payments", label: "Payments", icon: "Pay", short: "Pay" },
  { to: "/disputes", label: "Disputes", icon: "Case", short: "Cases" },
  { to: "/notifications", label: "Notifications", icon: "Bell", short: "Alerts" },
  { to: "/analytics", label: "Analytics", icon: "Chart", short: "Stats" },
  { to: "/profile", label: "Profile", icon: "User", short: "Profile" },
];

const mobileNavItems = navItems.slice(0, 4);

export default function DashboardLayout() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const roleColors = {
    client: "from-blue-500 to-cyan-500",
    freelancer: "from-purple-500 to-pink-500",
    admin: "from-amber-500 to-orange-500",
  };

  const gradient = roleColors[user?.role] || roleColors.client;

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const sidebarContent = (
    <>
      <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between">
        <div>
          <Link
            to="/"
            className="text-lg sm:text-xl font-bold text-white"
            onClick={closeSidebar}
          >
            <span
              className={`bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}
            >
              SkillSphere
            </span>
          </Link>
          <p className="text-white/50 text-xs mt-1 capitalize">{user?.role}</p>
        </div>
        <button
          type="button"
          onClick={closeSidebar}
          className="lg:hidden p-2 rounded-lg text-white/70 hover:bg-white/10"
          aria-label="Close menu"
        >
          ✕
        </button>
      </div>

      <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={closeSidebar}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-300 text-sm sm:text-base ${
                isActive
                  ? "bg-white/15 text-white shadow-lg"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <span className="w-10 text-[10px] uppercase tracking-wide text-white/40">
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
        {user?.role === "admin" && (
          <NavLink
            to="/admin"
            onClick={closeSidebar}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-300 text-sm sm:text-base ${
                isActive
                  ? "bg-amber-500/30 text-amber-200"
                  : "text-white/60 hover:bg-white/10"
              }`
            }
          >
            <span className="w-10 text-[10px] uppercase tracking-wide text-amber-200/70">
              Admin
            </span>
            Admin
          </NavLink>
        )}
      </nav>

      <div className="p-3 sm:p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3 sm:mb-4 px-1 sm:px-2">
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm`}
          >
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-white/50 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <Button
          variant="secondary"
          className="w-full text-sm py-2"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col lg:flex-row">
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={closeSidebar}
          aria-label="Close overlay"
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-[min(280px,85vw)] sm:w-64
          bg-gradient-to-b from-slate-900 to-indigo-950
          border-r border-white/10 flex flex-col
          transform transition-transform duration-300 ease-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {sidebarContent}
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-screen lg:min-h-0">
        <header
          className={`lg:hidden sticky top-0 z-30 bg-gradient-to-r ${gradient} px-4 py-3 shadow-lg flex items-center gap-3`}
        >
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 shrink-0"
            aria-label="Open menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-white font-bold text-sm truncate">
              Hi, {user?.name?.split(" ")[0]}!
            </p>
            <p className="text-white/80 text-xs truncate capitalize">
              {user?.role}
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-auto flex flex-col">
          <header
            className={`hidden lg:block bg-gradient-to-r ${gradient} px-6 xl:px-8 py-5 xl:py-6 shadow-lg`}
          >
            <h1 className="text-xl xl:text-2xl font-bold text-white">
              Welcome back, {user?.name?.split(" ")[0]}!
            </h1>
            <p className="text-white/80 text-sm mt-1">
              {user?.isVerified
                ? "Your account is verified"
                : "Please verify your email"}
            </p>
          </header>

          <div className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
            <Outlet />
          </div>
        </main>

        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-white/10 pb-[env(safe-area-inset-bottom)]">
          <div className="flex justify-around items-center py-2 px-1">
            {mobileNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[4.5rem] transition-colors ${
                    isActive ? "text-pink-400" : "text-white/50"
                  }`
                }
              >
                <span className="text-[10px] uppercase">{item.icon}</span>
                <span className="text-[10px] sm:text-xs font-medium">
                  {item.short}
                </span>
              </NavLink>
            ))}
            {user?.role === "admin" && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[4.5rem] transition-colors ${
                    isActive ? "text-amber-400" : "text-white/50"
                  }`
                }
              >
                <span className="text-[10px] uppercase">Admin</span>
                <span className="text-[10px] sm:text-xs font-medium">Admin</span>
              </NavLink>
            )}
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[4.5rem] text-white/50"
            >
              <span className="text-[10px] uppercase">Menu</span>
              <span className="text-[10px] sm:text-xs font-medium">Menu</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  );
}

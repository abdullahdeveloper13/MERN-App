import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  ChevronDown,
  ClipboardList,
  FileText,
  Gauge,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  ShieldCheck,
  UserRound,
  Users,
  X
} from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { dashboardPathForRole, useAuth } from "../../features/auth/AuthContext";
import { useRealtime } from "../../features/realtime/RealtimeContext";
import { api } from "../../lib/api";
import type { Notification, UserRole } from "../../types";
import { cn } from "../../utils/cn";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
}

const navByRole: Record<UserRole, NavItem[]> = {
  job_seeker: [
    { to: "/dashboard/job-seeker", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/jobs", label: "Find jobs", icon: Search },
    { to: "/dashboard/applications", label: "My applications", icon: ClipboardList },
    { to: "/dashboard/saved-jobs", label: "Saved jobs", icon: FileText },
    { to: "/dashboard/interviews", label: "Interviews", icon: CalendarClock },
    { to: "/dashboard/messages", label: "Messages", icon: MessageSquare },
    { to: "/dashboard/notifications", label: "Notifications", icon: Bell },
    { to: "/dashboard/profile", label: "Profile", icon: UserRound },
    { to: "/dashboard/settings", label: "Account settings", icon: Settings }
  ],
  employer: [
    { to: "/dashboard/employer", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/dashboard/employer/company", label: "Company profile", icon: Building2 },
    { to: "/dashboard/employer/jobs", label: "Manage jobs", icon: BriefcaseBusiness },
    { to: "/dashboard/employer/applications", label: "Applications", icon: ClipboardList },
    { to: "/dashboard/interviews", label: "Interviews", icon: CalendarClock },
    { to: "/dashboard/messages", label: "Messages", icon: MessageSquare },
    { to: "/dashboard/notifications", label: "Notifications", icon: Bell },
    { to: "/dashboard/settings", label: "Account settings", icon: Settings }
  ],
  recruiter: [
    { to: "/dashboard/recruiter", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/dashboard/recruiter/jobs", label: "Assigned jobs", icon: BriefcaseBusiness },
    { to: "/dashboard/recruiter/candidates", label: "Candidates", icon: Users },
    { to: "/dashboard/recruiter/pipeline", label: "Pipeline", icon: Gauge },
    { to: "/dashboard/interviews", label: "Interviews", icon: CalendarClock },
    { to: "/dashboard/messages", label: "Messages", icon: MessageSquare },
    { to: "/dashboard/notifications", label: "Notifications", icon: Bell },
    { to: "/dashboard/profile", label: "Recruiter profile", icon: UserRound },
    { to: "/dashboard/settings", label: "Account settings", icon: Settings }
  ],
  admin: [
    { to: "/dashboard/admin", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/dashboard/admin/users", label: "Users", icon: Users },
    { to: "/dashboard/admin/companies", label: "Companies", icon: Building2 },
    { to: "/dashboard/admin/jobs", label: "Jobs", icon: BriefcaseBusiness },
    { to: "/dashboard/admin/applications", label: "Applications", icon: ClipboardList },
    { to: "/dashboard/admin/recruiters", label: "Recruiters", icon: ShieldCheck },
    { to: "/dashboard/admin/audit-logs", label: "Audit logs", icon: FileText },
    { to: "/dashboard/admin/settings", label: "Platform settings", icon: Settings }
  ]
};

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { connected } = useRealtime();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const notificationsQuery = useQuery({
    queryKey: ["notifications", "summary"],
    queryFn: () => api.get<{ notifications: Notification[]; unread: number }>("/notifications?limit=1"),
    enabled: Boolean(user)
  });

  if (!user) {
    return null;
  }

  const navItems = navByRole[user.role];
  const unread = notificationsQuery.data?.unread ?? 0;

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white">
            <BriefcaseBusiness className="h-5 w-5" />
          </span>
          <span className="text-base font-bold tracking-tight text-ink-950">
            HireSphere <span className="text-brand-700">AI</span>
          </span>
        </Link>
        <button
          type="button"
          className="rounded-lg p-1.5 text-ink-500 hover:bg-slate-100 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="border-b border-slate-100 px-4 py-3">
        <Badge tone="brand">{user.role.replaceAll("_", " ")}</Badge>
        {connected ? (
          <span className="ml-2 inline-flex items-center gap-1 text-xs text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> live
          </span>
        ) : null}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  isActive ? "bg-brand-50 text-brand-800" : "text-ink-500 hover:bg-slate-50 hover:text-ink-900"
                )
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
              {item.to === "/dashboard/notifications" && unread > 0 ? (
                <span className="ml-auto rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
                  {unread > 9 ? "9+" : unread}
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 p-3">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-500 hover:bg-slate-50"
        >
          <Home className="h-4 w-4" /> Public site
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block">
        {sidebar}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative h-full w-72 max-w-[85vw] bg-white shadow-pop">{sidebar}</aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg p-2 text-ink-700 hover:bg-slate-100 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-sm font-semibold text-ink-900">Welcome, {user.name.split(" ")[0]}</p>
              <p className="text-xs text-ink-400">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/dashboard/notifications"
              className="relative rounded-xl p-2 text-ink-500 hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unread > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              ) : null}
            </Link>
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((value) => !value)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-2 py-1.5 hover:bg-slate-50"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <Avatar src={user.avatar} name={user.name} size="sm" />
                <span className="hidden max-w-28 truncate text-sm font-medium sm:block">{user.name}</span>
                <ChevronDown className="h-4 w-4 text-ink-400" />
              </button>
              {userMenuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-pop"
                >
                  <Link
                    to={dashboardPathForRole(user.role)}
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-slate-50"
                  >
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                  {user.role !== "admin" ? (
                    <Link
                      to="/dashboard/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-slate-50"
                    >
                      <UserRound className="h-4 w-4" /> Profile
                    </Link>
                  ) : null}
                  <Link
                    to="/dashboard/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-slate-50"
                  >
                    <Settings className="h-4 w-4" /> Settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

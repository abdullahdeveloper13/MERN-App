import { BriefcaseBusiness, Menu, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { dashboardPathForRole, useAuth } from "../../features/auth/AuthContext";
import { cn } from "../../utils/cn";
import { Button } from "../ui/Button";

const links = [
  { to: "/jobs", label: "Find jobs" },
  { to: "/companies", label: "Companies" },
  { to: "/#how-it-works", label: "How it works" },
  { to: "/#for-employers", label: "For employers" }
];

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-700 text-white">
        <BriefcaseBusiness className="h-5 w-5" />
      </span>
      <span className={cn("text-lg font-bold tracking-tight text-ink-950", compact && "sr-only")}>
        HireSphere <span className="text-brand-700">AI</span>
      </span>
    </Link>
  );
}

export function PublicLayout() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Brand />
          <nav className="hidden items-center gap-7 md:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className="text-sm font-medium text-ink-500 transition hover:text-ink-900"
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <Link to={dashboardPathForRole(user.role)}>
                <Button size="sm">{user.name.split(" ")[0]}'s dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">
                    <Sparkles className="h-4 w-4" /> Get started
                  </Button>
                </Link>
              </>
            )}
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-ink-700 hover:bg-slate-100 md:hidden"
            aria-label="Toggle navigation"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {open ? (
          <div className="border-t border-slate-100 bg-white px-4 py-4 md:hidden">
            <nav className="flex flex-col gap-1">
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-ink-700 hover:bg-slate-50"
                >
                  {link.label}
                </NavLink>
              ))}
              <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                {user ? (
                  <Link to={dashboardPathForRole(user.role)} className="flex-1">
                    <Button className="w-full" size="sm">
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        Sign in
                      </Button>
                    </Link>
                    <Link to="/register" className="flex-1">
                      <Button size="sm" className="w-full">
                        Get started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        ) : null}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
          <div className="md:col-span-2">
            <Brand />
            <p className="mt-3 max-w-sm text-sm text-ink-500">
              A focused hiring platform for job seekers, employers, recruiters, and platform teams.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-900">Platform</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-ink-500">
              <Link to="/jobs" className="hover:text-ink-900">Browse jobs</Link>
              <Link to="/companies" className="hover:text-ink-900">Companies</Link>
              <Link to="/register?role=employer" className="hover:text-ink-900">Post a job</Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-900">Account</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-ink-500">
              <Link to="/login" className="hover:text-ink-900">Sign in</Link>
              <Link to="/register" className="hover:text-ink-900">Create account</Link>
              <Link to="/forgot-password" className="hover:text-ink-900">Reset password</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-100 px-4 py-5 text-center text-xs text-ink-300">
          © {new Date().getFullYear()} HireSphere AI. Built for responsible, human-led hiring.
        </div>
      </footer>
    </div>
  );
}

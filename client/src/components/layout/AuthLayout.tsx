import { CheckCircle2, Sparkles } from "lucide-react";
import type { PropsWithChildren } from "react";
import { Link } from "react-router-dom";
import { Brand } from "./PublicLayout";

const points = [
  "Role-aware dashboards for every hiring workflow",
  "Application tracking, interviews, and messaging in one place",
  "Resume and document uploads kept behind authorization",
  "Optional AI assistance that stays off until a provider is configured"
];

export function AuthLayout({
  title,
  subtitle,
  children
}: PropsWithChildren<{ title: string; subtitle?: string }>) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-5 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-10">
            <Brand />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-ink-950">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-ink-500">{subtitle}</p> : null}
          <div className="mt-8">{children}</div>
          <p className="mt-8 text-center text-xs text-ink-300">
            By continuing you agree to responsible use of candidate and employer data.{" "}
            <Link to="/" className="link">
              Back to home
            </Link>
          </p>
        </div>
      </div>
      <div className="hidden bg-ink-950 px-12 py-16 text-white lg:flex lg:flex-col lg:justify-center">
        <div className="mx-auto max-w-lg">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-brand-100">
            <Sparkles className="h-3.5 w-3.5" /> AI-ready recruitment
          </span>
          <h2 className="mt-6 text-4xl font-bold leading-tight tracking-tight">
            Find the Right Talent.
            <br />
            Discover the Right Opportunity.
          </h2>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            HireSphere AI keeps human judgment at the center while giving every role the tools
            they need to move hiring forward.
          </p>
          <ul className="mt-8 space-y-3">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm text-slate-200">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

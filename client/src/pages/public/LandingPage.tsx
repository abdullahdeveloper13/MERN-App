import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  FileSearch,
  Gauge,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Users
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { JobCard } from "../../components/jobs/JobCard";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState, ErrorState, Skeleton } from "../../components/ui/Feedback";
import { Input } from "../../components/ui/Field";
import { api } from "../../lib/api";
import type { Company, Job } from "../../types";

interface JobStats {
  publishedJobs: number;
  companies: number;
  applications: number;
  categories: number;
}

interface Category {
  name: string;
  count: number;
}

interface AiStatus {
  enabled: boolean;
  provider?: string | null;
}

const steps = [
  {
    icon: FileSearch,
    title: "Create your profile",
    body: "Add your experience, skills, and resume once. Keep it updated as you grow."
  },
  {
    icon: Search,
    title: "Find relevant roles",
    body: "Filter by location, workplace, employment type, experience, and salary."
  },
  {
    icon: BarChart3,
    title: "Track every application",
    body: "Follow status changes, interviews, and messages from one dashboard."
  }
];

const employerBenefits = [
  "Publish and manage roles from a structured company profile",
  "Review applicants with resumes and answers in one workspace",
  "Move candidates through a clear interview and offer pipeline",
  "Assign recruiters to companies and jobs without losing visibility"
];

export function LandingPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const statsQuery = useQuery({
    queryKey: ["jobs", "stats"],
    queryFn: () => api.get<JobStats>("/jobs/stats")
  });
  const jobsQuery = useQuery({
    queryKey: ["jobs", "featured"],
    queryFn: () => api.get<Job[]>("/jobs?limit=6&sort=newest")
  });
  const categoriesQuery = useQuery({
    queryKey: ["jobs", "categories"],
    queryFn: () => api.get<Category[]>("/jobs/categories")
  });
  const companiesQuery = useQuery({
    queryKey: ["companies", "featured"],
    queryFn: () => api.get<Company[]>("/companies?verified=true&limit=6")
  });
  const aiQuery = useQuery({
    queryKey: ["ai", "status"],
    queryFn: () => api.get<AiStatus>("/ai/status"),
    retry: false
  });

  const stats = statsQuery.data;
  const jobs = Array.isArray(jobsQuery.data) ? jobsQuery.data : [];
  const categories = categoriesQuery.data ?? [];
  const companies = companiesQuery.data ?? [];
  const aiEnabled = Boolean(aiQuery.data?.enabled);

  const search = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (keyword.trim()) params.set("q", keyword.trim());
    if (location.trim()) params.set("location", location.trim());
    navigate(`/jobs?${params.toString()}`);
  };

  return (
    <>
      <section className="relative overflow-hidden bg-ink-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,102,245,0.35),transparent_45%),radial-gradient(circle_at_85%_15%,rgba(16,185,129,0.16),transparent_35%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-brand-100">
              <Sparkles className="h-3.5 w-3.5" /> Human-led hiring, thoughtfully assisted
            </span>
            <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Find the Right Talent.
              <br />
              <span className="text-brand-300">Discover the Right Opportunity.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300">
              HireSphere AI brings job discovery, company profiles, application tracking, recruiter
              workflows, and optional AI assistance into one focused platform.
            </p>

            <form onSubmit={search} className="mt-8 grid gap-2 rounded-2xl bg-white p-2 shadow-pop sm:grid-cols-[1fr_1fr_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Job title, skill, or keyword"
                  className="border-0 pl-10 focus:ring-0"
                  aria-label="Job title, skill, or keyword"
                />
              </div>
              <div className="relative border-t border-slate-100 sm:border-l sm:border-t-0">
                <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="City or remote"
                  className="border-0 pl-10 focus:ring-0"
                  aria-label="Location"
                />
              </div>
              <Button type="submit" className="h-full min-h-10">
                Search jobs <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Verified company profiles
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Private resume access
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Gauge className="h-3.5 w-3.5 text-emerald-400" /> Role-based dashboards
              </span>
            </div>
          </div>

          {stats &&
          (stats.publishedJobs > 0 || stats.companies > 0 || stats.applications > 0 || stats.categories > 0) ? (
            <div className="mt-14 grid max-w-3xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Published jobs", value: stats.publishedJobs },
                { label: "Companies", value: stats.companies },
                { label: "Applications", value: stats.applications },
                { label: "Categories", value: stats.categories }
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur">
                  <p className="text-2xl font-bold">{item.value.toLocaleString()}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{item.label}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge tone="brand">Recently added</Badge>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl">
              Latest opportunities
            </h2>
            <p className="mt-1 text-sm text-ink-500">Fresh roles published by companies on the platform.</p>
          </div>
          <Link to="/jobs" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
            Browse all jobs <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6">
          {jobsQuery.isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((item) => <Skeleton key={item} className="h-48" />)}
            </div>
          ) : jobsQuery.isError ? (
            <ErrorState message="Could not load jobs right now." onRetry={() => void jobsQuery.refetch()} />
          ) : jobs.length === 0 ? (
            <EmptyState
              title="No published jobs yet"
              description="New roles will appear here as soon as employers publish them."
              action={
                <Link to="/register?role=employer">
                  <Button variant="outline" size="sm">Post the first job</Button>
                </Link>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => <JobCard key={job._id} job={job} />)}
            </div>
          )}
        </div>
      </section>

      {categories.length > 0 ? (
        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold tracking-tight text-ink-950">Explore by category</h2>
            <p className="mt-1 text-sm text-ink-500">Browse the categories with active openings.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((category) => (
                <Link
                  key={category.name}
                  to={`/jobs?category=${encodeURIComponent(category.name)}`}
                  className="group flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3.5 transition hover:border-brand-300 hover:bg-brand-50/40"
                >
                  <span className="font-medium text-ink-900 group-hover:text-brand-800">{category.name}</span>
                  <span className="text-xs text-ink-400">{category.count} roles</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <Badge tone="brand">How it works</Badge>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl">
            A clear path from discovery to decision
          </h2>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Every role keeps its own workspace. Candidates, employers, recruiters, and administrators
            see only what their responsibilities require.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card key={step.title} className="p-6">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-bold text-ink-300">0{index + 1}</span>
                </div>
                <h3 className="mt-4 text-base font-semibold text-ink-900">{step.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-ink-500">{step.body}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {companies.length > 0 ? (
        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <Badge tone="green">Verified employers</Badge>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink-950">Companies hiring here</h2>
              </div>
              <Link to="/companies" className="text-sm font-semibold text-brand-700 hover:underline">
                View all companies
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {companies.map((company) => (
                <Link
                  key={company._id}
                  to={`/companies/${company.slug || company._id}`}
                  className="surface flex items-center gap-4 p-5 transition hover:border-brand-200 hover:shadow-pop"
                >
                  {company.logo ? (
                    <img src={company.logo} alt="" className="h-12 w-12 rounded-xl border border-slate-100 object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 font-bold text-brand-700">
                      {company.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink-900">{company.name}</p>
                    <p className="mt-0.5 truncate text-sm text-ink-500">
                      {company.industry || company.headquarters || "Hiring on HireSphere AI"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section id="for-employers" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <Badge tone="brand">For employers and recruiters</Badge>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl">
              Keep hiring organized without losing the human touch
            </h2>
            <p className="mt-3 text-sm leading-6 text-ink-500">
              Give your team one place to publish roles, review candidates, coordinate interviews,
              and communicate — with permissions that match each person's job.
            </p>
            <ul className="mt-6 space-y-3">
              {employerBenefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3 text-sm text-ink-700">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {benefit}
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/register?role=employer">
                <Button>Create employer account</Button>
              </Link>
              <Link to="/register?role=recruiter">
                <Button variant="outline">Join as recruiter</Button>
              </Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Building2, title: "Company hub", body: "Brand profile, logo, links, and verified status." },
              { icon: BriefcaseBusiness, title: "Job control", body: "Draft, publish, pause, and close roles." },
              { icon: Users, title: "Candidate flow", body: "Shortlist, interview, offer, and hire." },
              { icon: BarChart3, title: "Visibility", body: "Application counts and status breakdowns." }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="p-5">
                  <Icon className="h-5 w-5 text-brand-700" />
                  <p className="mt-3 font-semibold text-ink-900">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-ink-500">{item.body}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <Badge tone="violet">AI, only when configured</Badge>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink-950 sm:text-3xl">
                Assistance that never invents experience
              </h2>
              <p className="mt-3 text-sm leading-6 text-ink-500">
                When an administrator connects an AI provider, candidates and employers can request
                job-description help, interview questions, and resume feedback. Without a configured
                provider, AI endpoints stay unavailable instead of returning fabricated results.
              </p>
              <div className="mt-5">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                    aiEnabled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${aiEnabled ? "bg-emerald-500" : "bg-slate-400"}`} />
                  {aiEnabled ? "AI assistance is enabled" : "AI assistance is not configured"}
                </span>
              </div>
            </div>
            <Card className="p-6">
              <p className="text-sm font-semibold text-ink-900">What stays protected</p>
              <ul className="mt-3 space-y-2.5 text-sm text-ink-500">
                <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> Resumes are served through authorized routes</li>
                <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> Candidate documents are never public by default</li>
                <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> Role checks apply to every management action</li>
                <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> Administrative changes are logged</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-brand-800 px-6 py-12 text-center text-white sm:px-12">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Ready to move hiring forward?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-brand-100">
            Join as a job seeker or employer and use the workspace that fits your role.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/jobs">
              <Button variant="inverse" size="lg">
                <BriefcaseBusiness className="h-4 w-4" /> Browse jobs <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="inverseOutline" size="lg">
                Create an account
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}


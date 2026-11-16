import { useQuery } from "@tanstack/react-query";
import { BriefcaseBusiness, Building2, ClipboardList, Globe2, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { ErrorState, PageHeader, Skeleton, StatCard } from "../../components/ui/Feedback";
import { useAuth } from "../../features/auth/AuthContext";
import { api } from "../../lib/api";

interface AdminAnalytics {
  users: {
    total: number;
    jobSeekers: number;
    employers: number;
    recruiters: number;
    admins: number;
    newLast30Days: number;
  };
  companies: { total: number; verified: number };
  jobs: { published: number; total: number };
  applications: {
    total: number;
    newLast30Days: number;
    statusBreakdown: Array<{ _id: string; count: number }>;
  };
  topCategories: Array<{ name: string; count: number }>;
}

export function AdminDashboard() {
  const { user } = useAuth();
  const analyticsQuery = useQuery({
    queryKey: ["dashboard", "admin"],
    queryFn: () => api.get<AdminAnalytics>("/admin/analytics")
  });

  if (analyticsQuery.isLoading) {
    return (
      <div>
        <PageHeader title="Platform overview" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-28" />)}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (analyticsQuery.isError || !analyticsQuery.data) {
    return (
      <div>
        <PageHeader title="Platform overview" />
        <ErrorState message={(analyticsQuery.error as Error)?.message} onRetry={() => void analyticsQuery.refetch()} />
      </div>
    );
  }

  const data = analyticsQuery.data;
  const totalApplications = data.applications.statusBreakdown.reduce((sum, item) => sum + item.count, 0);

  return (
    <div>
      <PageHeader
        title="Platform overview"
        description={`Signed in as ${user?.name}. Monitor platform activity and moderation queues.`}
        action={<Link to="/dashboard/admin/settings" className="text-sm font-semibold text-brand-700 hover:underline">Integration settings</Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Users" value={data.users.total} hint={`${data.users.newLast30Days} new in 30 days`} icon={<Users className="h-5 w-5" />} />
        <StatCard label="Companies" value={data.companies.total} hint={`${data.companies.verified} verified`} icon={<Building2 className="h-5 w-5" />} />
        <StatCard label="Published jobs" value={data.jobs.published} hint={`${data.jobs.total} total`} icon={<BriefcaseBusiness className="h-5 w-5" />} />
        <StatCard label="Applications" value={data.applications.total} hint={`${data.applications.newLast30Days} new in 30 days`} icon={<ClipboardList className="h-5 w-5" />} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="User roles" />
          <CardBody className="space-y-3">
            {[
              ["Job seekers", data.users.jobSeekers],
              ["Employers", data.users.employers],
              ["Recruiters", data.users.recruiters],
              ["Administrators", data.users.admins]
            ].map(([label, value]) => {
              const percent = data.users.total ? Math.round((Number(value) / data.users.total) * 100) : 0;
              return (
                <div key={String(label)}>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-ink-700">{label}</span>
                    <span className="text-ink-400">{value}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Application status" />
          <CardBody className="space-y-2.5">
            {data.applications.statusBreakdown.length === 0 ? (
              <p className="text-sm text-ink-500">No applications yet.</p>
            ) : (
              data.applications.statusBreakdown.map((item) => {
                const percent = totalApplications ? Math.round((item.count / totalApplications) * 100) : 0;
                return (
                  <div key={item._id}>
                    <div className="flex justify-between text-xs">
                      <span className="font-medium capitalize text-ink-700">{item._id.replaceAll("_", " ")}</span>
                      <span className="text-ink-400">{item.count}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Top categories" />
          <CardBody>
            {data.topCategories.length === 0 ? (
              <p className="text-sm text-ink-500">No categories yet.</p>
            ) : (
              <ul className="space-y-2">
                {data.topCategories.map((category) => (
                  <li key={category.name} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <span className="text-ink-700">{category.name}</span>
                    <Badge tone="brand">{category.count}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { to: "/dashboard/admin/users", label: "Manage users", icon: Users, description: "Roles and account status" },
          { to: "/dashboard/admin/companies", label: "Verify companies", icon: ShieldCheck, description: "Review employer profiles" },
          { to: "/dashboard/admin/jobs", label: "Moderate jobs", icon: BriefcaseBusiness, description: "Status and listings" },
          { to: "/dashboard/admin/audit-logs", label: "Audit trail", icon: Globe2, description: "Administrative actions" }
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.to} to={item.to} className="surface block p-5 transition hover:border-brand-200 hover:shadow-pop">
              <Icon className="h-5 w-5 text-brand-700" />
              <p className="mt-3 font-semibold text-ink-900">{item.label}</p>
              <p className="mt-1 text-xs text-ink-500">{item.description}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

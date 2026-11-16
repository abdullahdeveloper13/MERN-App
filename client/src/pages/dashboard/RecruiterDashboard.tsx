import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BriefcaseBusiness, CalendarClock, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge, StatusBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { EmptyState, ErrorState, PageHeader, Skeleton, StatCard } from "../../components/ui/Feedback";
import { useAuth } from "../../features/auth/AuthContext";
import { api } from "../../lib/api";
import type { Application, Company } from "../../types";
import { formatDate } from "../../utils/format";

interface RecruiterDashboardData {
  assignedCompanies: Company[];
  assignedJobsCount: number;
  activeJobs: number;
  candidatesCount: number;
  statusCounts: Record<string, number>;
  recentApplications: Application[];
  upcomingInterviews: Application[];
  performanceMetrics: {
    placements: number;
    interviews: number;
    activeCandidates: number;
  };
}

export function RecruiterDashboard() {
  const { user } = useAuth();
  const dashboardQuery = useQuery({
    queryKey: ["dashboard", "recruiter"],
    queryFn: () => api.get<RecruiterDashboardData>("/dashboard/recruiter")
  });

  if (dashboardQuery.isLoading) {
    return (
      <div>
        <PageHeader title="Recruiter dashboard" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-28" />)}
        </div>
        <Skeleton className="mt-4 h-72" />
      </div>
    );
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <div>
        <PageHeader title="Recruiter dashboard" />
        <ErrorState message={(dashboardQuery.error as Error)?.message} onRetry={() => void dashboardQuery.refetch()} />
      </div>
    );
  }

  const data = dashboardQuery.data;
  const pipelineTotal = Object.values(data.statusCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.name.split(" ")[0]}`}
        description="Your assigned companies, candidates, and active pipeline."
        action={<Link to="/dashboard/recruiter/candidates"><Button size="sm">View candidates</Button></Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Assigned jobs" value={data.assignedJobsCount} hint={`${data.activeJobs} active`} icon={<BriefcaseBusiness className="h-5 w-5" />} />
        <StatCard label="Candidates" value={data.candidatesCount} hint="In your pipeline" icon={<Users className="h-5 w-5" />} />
        <StatCard label="Interviews" value={data.upcomingInterviews.length} hint="Upcoming" icon={<CalendarClock className="h-5 w-5" />} />
        <StatCard label="Placements" value={data.performanceMetrics.placements} hint="Recorded" icon={<TrendingUp className="h-5 w-5" />} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent applications"
            action={<Link to="/dashboard/recruiter/candidates" className="text-sm font-semibold text-brand-700 hover:underline">View all</Link>}
          />
          <CardBody className="p-0">
            {data.recentApplications.length === 0 ? (
              <div className="p-5">
                <EmptyState title="No candidates yet" description="Assigned roles will show their applicants here." />
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Candidate</th><th>Role</th><th>Status</th><th>Applied</th></tr></thead>
                  <tbody>
                    {data.recentApplications.map((application) => (
                      <tr key={application._id}>
                        <td>
                          <p className="font-medium text-ink-900">{application.applicant?.name}</p>
                          <p className="text-xs text-ink-400">{application.applicant?.email}</p>
                        </td>
                        <td className="text-ink-500">{application.job?.title}</td>
                        <td><StatusBadge status={application.status} /></td>
                        <td className="text-ink-500">{formatDate(application.appliedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Assigned companies" />
          <CardBody>
            {data.assignedCompanies.length === 0 ? (
              <p className="text-sm text-ink-500">No companies assigned yet. An administrator can assign them.</p>
            ) : (
              <ul className="space-y-2.5">
                {data.assignedCompanies.map((company) => (
                  <li key={company._id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 p-3">
                    <span className="truncate text-sm font-medium text-ink-900">{company.name}</span>
                    {company.verified ? <Badge tone="green">Verified</Badge> : null}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Pipeline summary" description={`${pipelineTotal} applications across your roles.`} />
          <CardBody className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {["applied", "reviewing", "shortlisted", "interview", "offered", "hired"].map((stage) => (
              <div key={stage} className="rounded-xl border border-slate-100 p-3 text-center">
                <p className="text-2xl font-bold text-ink-950">{data.statusCounts[stage] ?? 0}</p>
                <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-ink-400">{stage}</p>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Upcoming interviews"
            action={<Link to="/dashboard/interviews" className="text-sm font-semibold text-brand-700 hover:underline">View schedule</Link>}
          />
          <CardBody>
            {data.upcomingInterviews.length === 0 ? (
              <p className="text-sm text-ink-500">No interviews scheduled.</p>
            ) : (
              <ul className="space-y-3">
                {data.upcomingInterviews.map((application) => (
                  <li key={application._id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 p-3">
                    <div>
                      <p className="text-sm font-semibold text-ink-900">{application.applicant?.name}</p>
                      <p className="text-xs text-ink-500">{application.job?.title}</p>
                    </div>
                    <p className="text-xs font-medium text-brand-700">{formatDate(application.interviewDetails?.scheduledAt)}</p>
                  </li>
                ))}
              </ul>
            )}
            <Link to="/dashboard/recruiter/pipeline" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
              Manage pipeline <ArrowRight className="h-4 w-4" />
            </Link>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

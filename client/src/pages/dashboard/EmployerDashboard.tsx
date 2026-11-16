import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BriefcaseBusiness, Building2, CalendarClock, ClipboardList, Plus, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { StatusBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { EmptyState, ErrorState, PageHeader, Skeleton, StatCard } from "../../components/ui/Feedback";
import { useAuth } from "../../features/auth/AuthContext";
import { api } from "../../lib/api";
import type { Application, Job } from "../../types";
import { formatDate, titleCase } from "../../utils/format";

interface EmployerDashboardData {
  activeJobs: number;
  totalJobs: number;
  totalApplications: number;
  newApplications: number;
  statusCounts: Record<string, number>;
  recentApplications: Application[];
  recentJobs: Job[];
  upcomingInterviews: number;
}

const stages = ["applied", "reviewing", "shortlisted", "interview", "offered", "hired", "rejected"];

export function EmployerDashboard() {
  const { user, company } = useAuth();
  const dashboardQuery = useQuery({
    queryKey: ["dashboard", "employer"],
    queryFn: () => api.get<EmployerDashboardData>("/dashboard/employer")
  });

  if (dashboardQuery.isLoading) {
    return (
      <div>
        <PageHeader title="Employer dashboard" />
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
        <PageHeader title="Employer dashboard" />
        <ErrorState message={(dashboardQuery.error as Error)?.message} onRetry={() => void dashboardQuery.refetch()} />
      </div>
    );
  }

  const data = dashboardQuery.data;
  const totalPipeline = Object.values(data.statusCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div>
      <PageHeader
        title={`${company?.name ?? user?.name.split(" ")[0] + "'s"} hiring overview`}
        description="Track open roles, applications, and interview activity."
        action={
          <div className="flex gap-2">
            <Link to="/dashboard/employer/company">
              <Button variant="outline" size="sm"><Building2 className="h-4 w-4" /> Company</Button>
            </Link>
            <Link to="/dashboard/employer/jobs?create=1">
              <Button size="sm"><Plus className="h-4 w-4" /> Post a job</Button>
            </Link>
          </div>
        }
      />

      {!company ? (
        <Card className="mb-4 border-amber-200 bg-amber-50/60">
          <CardBody className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-amber-900">
              Create your company profile before publishing jobs.
            </p>
            <Link to="/dashboard/employer/company"><Button size="sm">Set up company</Button></Link>
          </CardBody>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active jobs" value={data.activeJobs} hint={`${data.totalJobs} total`} icon={<BriefcaseBusiness className="h-5 w-5" />} />
        <StatCard label="Applications" value={data.totalApplications} hint={`${data.newApplications} in last 7 days`} icon={<ClipboardList className="h-5 w-5" />} />
        <StatCard label="Upcoming interviews" value={data.upcomingInterviews} hint="Scheduled" icon={<CalendarClock className="h-5 w-5" />} />
        <StatCard label="Hired" value={data.statusCounts.hired ?? 0} hint="All time" icon={<Users className="h-5 w-5" />} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent applications"
            description="Candidates who applied most recently."
            action={<Link to="/dashboard/employer/applications" className="text-sm font-semibold text-brand-700 hover:underline">View all</Link>}
          />
          <CardBody className="p-0">
            {data.recentApplications.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="No applications yet"
                  description="Publish a role to start receiving candidates."
                  action={<Link to="/dashboard/employer/jobs?create=1"><Button size="sm" variant="outline">Post a job</Button></Link>}
                />
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr><th>Candidate</th><th>Role</th><th>Status</th><th>Applied</th></tr>
                  </thead>
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
          <CardHeader title="Pipeline" description={`${totalPipeline} applications by stage.`} />
          <CardBody className="space-y-3">
            {stages.map((stage) => {
              const count = data.statusCounts[stage] ?? 0;
              const percent = totalPipeline ? Math.round((count / totalPipeline) * 100) : 0;
              return (
                <div key={stage}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-ink-700">{titleCase(stage)}</span>
                    <span className="text-ink-400">{count}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader
          title="Recent jobs"
          action={<Link to="/dashboard/employer/jobs" className="text-sm font-semibold text-brand-700 hover:underline">Manage jobs</Link>}
        />
        <CardBody className="p-0">
          {data.recentJobs.length === 0 ? (
            <div className="p-5">
              <EmptyState title="No jobs yet" description="Create a draft or publish your first role." />
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr><th>Role</th><th>Status</th><th>Applicants</th><th>Created</th><th /></tr>
                </thead>
                <tbody>
                  {data.recentJobs.map((job) => (
                    <tr key={job._id}>
                      <td className="font-medium text-ink-900">{job.title}</td>
                      <td><StatusBadge status={job.status} /></td>
                      <td className="text-ink-500">{job.applicationCount}</td>
                      <td className="text-ink-500">{formatDate(job.createdAt)}</td>
                      <td className="text-right">
                        <Link to={`/dashboard/employer/jobs`} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline">
                          Open <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

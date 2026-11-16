import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Bookmark, CalendarClock, ClipboardList, FileText, Sparkles, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { JobCard } from "../../components/jobs/JobCard";
import { StatusBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody, CardHeader } from "../../components/ui/Card";
import { EmptyState, ErrorState, PageHeader, Skeleton, StatCard } from "../../components/ui/Feedback";
import { useAuth } from "../../features/auth/AuthContext";
import { api } from "../../lib/api";
import type { Application, Job } from "../../types";
import { formatDateTime, titleCase } from "../../utils/format";

interface JobSeekerDashboardData {
  profileCompletion: number;
  statusCounts: Record<string, number>;
  recentApplications: Application[];
  savedJobsCount: number;
  upcomingInterviews: Application[];
  recommendedJobs: Job[];
  unreadNotifications: number;
}

export function JobSeekerDashboard() {
  const { user } = useAuth();
  const dashboardQuery = useQuery({
    queryKey: ["dashboard", "job-seeker"],
    queryFn: () => api.get<JobSeekerDashboardData>("/dashboard/job-seeker")
  });

  if (dashboardQuery.isLoading) {
    return (
      <div>
        <PageHeader title="Dashboard" />
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

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <ErrorState message={(dashboardQuery.error as Error)?.message} onRetry={() => void dashboardQuery.refetch()} />
      </div>
    );
  }

  const data = dashboardQuery.data;
  const activeApplications =
    (data.statusCounts.applied ?? 0) +
    (data.statusCounts.reviewing ?? 0) +
    (data.statusCounts.shortlisted ?? 0) +
    (data.statusCounts.interview ?? 0) +
    (data.statusCounts.offered ?? 0);
  const interviews = (data.statusCounts.interview ?? 0) + (data.statusCounts.offered ?? 0);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name.split(" ")[0] ?? "there"}`}
        description="Your applications, interviews, and next opportunities in one place."
        action={
          <Link to="/jobs">
            <Button size="sm">Find jobs <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active applications" value={activeApplications} hint="In progress" icon={<ClipboardList className="h-5 w-5" />} />
        <StatCard label="Interviews" value={interviews} hint="Interview and offer stages" icon={<CalendarClock className="h-5 w-5" />} />
        <StatCard label="Saved jobs" value={data.savedJobsCount} hint="Ready to revisit" icon={<Bookmark className="h-5 w-5" />} />
        <StatCard label="Profile complete" value={`${data.profileCompletion}%`} hint="Keep it current" icon={<UserRound className="h-5 w-5" />} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent applications"
            description="The latest roles you've applied to."
            action={
              <Link to="/dashboard/applications" className="text-sm font-semibold text-brand-700 hover:underline">
                View all
              </Link>
            }
          />
          <CardBody className="p-0">
            {data.recentApplications.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="No applications yet"
                  description="When you apply to a role, it will appear here with its current status."
                  action={<Link to="/jobs"><Button size="sm" variant="outline">Browse jobs</Button></Link>}
                />
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th>Company</th>
                      <th>Status</th>
                      <th>Applied</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentApplications.map((application) => (
                      <tr key={application._id}>
                        <td>
                          <Link to={`/jobs/${application.job?.slug || application.job?._id}`} className="font-medium text-ink-900 hover:text-brand-700">
                            {application.job?.title}
                          </Link>
                        </td>
                        <td className="text-ink-500">{application.company?.name}</td>
                        <td><StatusBadge status={application.status} /></td>
                        <td className="text-ink-500">{formatDateTime(application.appliedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Upcoming interviews" />
          <CardBody>
            {data.upcomingInterviews.length === 0 ? (
              <p className="text-sm text-ink-500">No interviews scheduled yet.</p>
            ) : (
              <ul className="space-y-3">
                {data.upcomingInterviews.map((application) => (
                  <li key={application._id} className="rounded-xl border border-slate-100 p-3">
                    <p className="text-sm font-semibold text-ink-900">{application.job?.title}</p>
                    <p className="mt-0.5 text-xs text-ink-500">{application.company?.name}</p>
                    <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-brand-700">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {formatDateTime(application.interviewDetails?.scheduledAt)}
                    </p>
                    {application.interviewDetails?.mode ? (
                      <p className="mt-1 text-xs text-ink-400">{titleCase(application.interviewDetails.mode)}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {data.profileCompletion < 100 ? (
        <Card className="mt-4 border-brand-100 bg-brand-50/40">
          <CardBody className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="rounded-xl bg-white p-2 text-brand-700"><FileText className="h-5 w-5" /></span>
              <div>
                <p className="font-semibold text-ink-900">Complete your profile</p>
                <p className="mt-0.5 text-sm text-ink-500">
                  Add your experience, skills, and resume to improve how employers see your profile.
                </p>
              </div>
            </div>
            <Link to="/dashboard/profile"><Button size="sm">Update profile</Button></Link>
          </CardBody>
        </Card>
      ) : null}

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="inline-flex items-center gap-2 text-lg font-semibold text-ink-900">
              <Sparkles className="h-5 w-5 text-brand-700" /> Recommended for you
            </h2>
            <p className="mt-1 text-sm text-ink-500">Based on your skills and preferred locations.</p>
          </div>
          <Link to="/jobs" className="text-sm font-semibold text-brand-700 hover:underline">All jobs</Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {data.recommendedJobs.length === 0 ? (
            <div className="md:col-span-2">
              <EmptyState title="No recommendations yet" description="Add skills and preferences to your profile to see matching roles." />
            </div>
          ) : (
            data.recommendedJobs.map((job) => <JobCard key={job._id} job={job} />)
          )}
        </div>
      </div>
    </div>
  );
}

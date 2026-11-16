import { useQuery } from "@tanstack/react-query";
import { CalendarClock, MapPin, Video } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody } from "../../components/ui/Card";
import { EmptyState, ErrorState, PageHeader, Skeleton } from "../../components/ui/Feedback";
import { useAuth } from "../../features/auth/AuthContext";
import { api } from "../../lib/api";
import type { Application } from "../../types";
import { cn } from "../../utils/cn";
import { formatDateTime, titleCase } from "../../utils/format";

export function InterviewsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"upcoming" | "past" | "all">("upcoming");
  const endpoint = user?.role === "job_seeker" ? "/applications/my" : "/applications";
  const interviewsQuery = useQuery({
    queryKey: ["applications", "interviews", user?.role],
    queryFn: () => api.get<Application[]>(`${endpoint}?status=interview&limit=100`),
    enabled: Boolean(user)
  });

  const applications = Array.isArray(interviewsQuery.data) ? interviewsQuery.data : [];
  const now = Date.now();
  const filtered = applications
    .filter((application) => application.interviewDetails?.scheduledAt)
    .filter((application) => {
      if (tab === "all") return true;
      const date = new Date(application.interviewDetails?.scheduledAt as string).getTime();
      return tab === "upcoming" ? date >= now : date < now;
    })
    .sort((a, b) => {
      const aDate = new Date(a.interviewDetails?.scheduledAt as string).getTime();
      const bDate = new Date(b.interviewDetails?.scheduledAt as string).getTime();
      return tab === "past" ? bDate - aDate : aDate - bDate;
    });

  return (
    <div>
      <PageHeader
        title="Interviews"
        description="Scheduled interviews across your applications."
        action={
          <Link to={user?.role === "job_seeker" ? "/dashboard/applications" : user?.role === "employer" ? "/dashboard/employer/applications" : "/dashboard/recruiter/pipeline"}>
            <Button size="sm" variant="outline">Manage applications</Button>
          </Link>
        }
      />

      <div className="mb-4 inline-flex rounded-xl border border-slate-200 bg-white p-1">
        {(["upcoming", "past", "all"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition",
              tab === value ? "bg-brand-50 text-brand-800" : "text-ink-500 hover:text-ink-900"
            )}
          >
            {value}
          </button>
        ))}
      </div>

      {interviewsQuery.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => <Skeleton key={item} className="h-32" />)}
        </div>
      ) : interviewsQuery.isError ? (
        <ErrorState message={(interviewsQuery.error as Error).message} onRetry={() => void interviewsQuery.refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No interviews here"
          description="Interviews appear once a hiring team schedules one."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((application) => (
            <Card key={application._id}>
              <CardBody className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    {application.interviewDetails?.mode === "video" ? <Video className="h-5 w-5" /> : <CalendarClock className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-semibold text-ink-900">{application.job?.title}</p>
                    <p className="mt-0.5 text-sm text-ink-500">
                      {user?.role === "job_seeker" ? application.company?.name : application.applicant?.name}
                      {user?.role === "job_seeker" ? "" : ` · ${application.job?.title}`}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-500">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {formatDateTime(application.interviewDetails?.scheduledAt)}
                      </span>
                      {application.interviewDetails?.mode ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Video className="h-3.5 w-3.5" />
                          {titleCase(application.interviewDetails.mode)}
                        </span>
                      ) : null}
                      {application.interviewDetails?.location ? (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          {application.interviewDetails.location.startsWith("http") ? (
                            <a href={application.interviewDetails.location} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline">
                              Meeting link
                            </a>
                          ) : (
                            application.interviewDetails.location
                          )}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <StatusBadge status={application.status} />
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

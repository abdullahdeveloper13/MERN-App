import { Bookmark, BriefcaseBusiness, Clock3, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import type { Job } from "../../types";
import { cn } from "../../utils/cn";
import { formatSalary, timeAgo } from "../../utils/format";
import { Badge } from "../ui/Badge";

export function JobCard({
  job,
  saved,
  onToggleSave
}: {
  job: Job;
  saved?: boolean;
  onToggleSave?: (job: Job) => void;
}) {
  const salary = formatSalary(job.salaryRange?.min, job.salaryRange?.max, job.salaryRange?.currency);

  return (
    <article className="surface group p-5 transition hover:border-brand-200 hover:shadow-pop">
      <div className="flex items-start gap-4">
        {job.company?.logo ? (
          <img
            src={job.company.logo}
            alt={`${job.company.name} logo`}
            className="h-12 w-12 rounded-xl border border-slate-100 object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-base font-bold text-brand-700">
            {job.company?.name?.slice(0, 2).toUpperCase() ?? "HS"}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                to={`/jobs/${job.slug || job._id}`}
                className="line-clamp-2 text-base font-semibold text-ink-950 transition group-hover:text-brand-700"
              >
                {job.title}
              </Link>
              <p className="mt-0.5 truncate text-sm text-ink-500">{job.company?.name}</p>
            </div>
            {onToggleSave ? (
              <button
                type="button"
                onClick={() => onToggleSave(job)}
                className={cn(
                  "rounded-lg p-1.5 transition",
                  saved ? "text-brand-700" : "text-ink-300 hover:bg-slate-100 hover:text-ink-700"
                )}
                aria-label={saved ? "Remove saved job" : "Save job"}
                aria-pressed={Boolean(saved)}
              >
                <Bookmark className={cn("h-5 w-5", saved && "fill-current")} />
              </button>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-ink-500">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {job.location || "Location flexible"}
            </span>
            <span className="inline-flex items-center gap-1">
              <BriefcaseBusiness className="h-3.5 w-3.5" /> {job.employmentType.replaceAll("_", " ")}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock3 className="h-3.5 w-3.5" /> {timeAgo(job.publishedAt ?? job.createdAt)}
            </span>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge tone="brand">{job.workplaceType.replaceAll("_", " ")}</Badge>
            {job.experienceLevel ? (
              <Badge>{job.experienceLevel.replaceAll("_", " ")}</Badge>
            ) : null}
            {salary ? <span className="text-sm font-semibold text-ink-900">{salary}</span> : null}
          </div>
        </div>
      </div>
    </article>
  );
}

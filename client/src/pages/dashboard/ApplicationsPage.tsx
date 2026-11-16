import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, ExternalLink, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge, StatusBadge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card, CardBody } from "../../components/ui/Card";
import { EmptyState, ErrorState, InlineAlert, PageHeader, PageLoader, Skeleton } from "../../components/ui/Feedback";
import { Input, Label, Select, Textarea } from "../../components/ui/Field";
import { Modal } from "../../components/ui/Modal";
import { Pagination } from "../../components/ui/Pagination";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../features/auth/AuthContext";
import { api, getApiOrigin } from "../../lib/api";
import type { Application, ApplicationStatus, PaginationMeta } from "../../types";
import { formatDate, formatDateTime, titleCase } from "../../utils/format";

const statuses: ApplicationStatus[] = [
  "applied",
  "reviewing",
  "shortlisted",
  "interview",
  "offered",
  "hired",
  "rejected",
  "withdrawn"
];

const transitions: Record<ApplicationStatus, ApplicationStatus[]> = {
  applied: ["reviewing", "shortlisted", "rejected"],
  reviewing: ["shortlisted", "rejected"],
  shortlisted: ["interview", "rejected"],
  interview: ["offered", "rejected"],
  offered: ["hired", "rejected"],
  hired: [],
  rejected: [],
  withdrawn: []
};

export function ApplicationsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isSeeker = user?.role === "job_seeker";
  const endpoint = isSeeker
    ? "/applications/my"
    : user?.role === "admin"
      ? "/admin/applications"
      : "/applications";
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<ApplicationStatus>("applied");
  const [notes, setNotes] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewMode, setInterviewMode] = useState("video");
  const [interviewLocation, setInterviewLocation] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const queryParams = new URLSearchParams({ page: String(page), limit: "15" });
  if (status) queryParams.set("status", status);
  if (submittedSearch && !isSeeker) queryParams.set("q", submittedSearch);

  const applicationsQuery = useQuery({
    queryKey: ["applications", user?.role, status, submittedSearch, page],
    queryFn: () => api.getPage<Application[]>(`${endpoint}?${queryParams.toString()}`)
  });
  const detailQuery = useQuery({
    queryKey: ["applications", "detail", selectedId],
    queryFn: () => api.get<Application>(`/applications/${selectedId}`),
    enabled: Boolean(selectedId)
  });

  const detail = detailQuery.data;

  useEffect(() => {
    if (!detail) return;
    setEditStatus(detail.status);
    setNotes(detail.recruiterNotes ?? "");
    setInterviewDate(
      detail.interviewDetails?.scheduledAt
        ? new Date(detail.interviewDetails.scheduledAt).toISOString().slice(0, 16)
        : ""
    );
    setInterviewMode(detail.interviewDetails?.mode ?? "video");
    setInterviewLocation(detail.interviewDetails?.location ?? "");
    setFormError(null);
  }, [detail]);

  const updateMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.patch(`/applications/${selectedId}/status`, payload),
    onSuccess: () => {
      toast("Application updated", { tone: "success" });
      setSelectedId(null);
      void queryClient.invalidateQueries({ queryKey: ["applications"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => setFormError(error.message)
  });
  const withdrawMutation = useMutation({
    mutationFn: (id: string) => api.post(`/applications/${id}/withdraw`),
    onSuccess: () => {
      toast("Application withdrawn", { tone: "success" });
      setSelectedId(null);
      void queryClient.invalidateQueries({ queryKey: ["applications"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error: Error) => setFormError(error.message)
  });

  const applications = applicationsQuery.data?.data ?? [];
  const meta = applicationsQuery.data?.meta as PaginationMeta | undefined;
  const allowedNext = detail ? transitions[detail.status] : [];

  const saveStatus = () => {
    setFormError(null);
    const payload: Record<string, unknown> = { status: editStatus };

    if (!isSeeker) {
      payload.recruiterNotes = notes;
    }

    if (editStatus === "interview") {
      if (!interviewDate) {
        setFormError("Choose an interview date and time.");
        return;
      }
      payload.interviewDetails = {
        scheduledAt: new Date(interviewDate).toISOString(),
        mode: interviewMode,
        location: interviewLocation || undefined
      };
    }

    updateMutation.mutate(payload);
  };

  if (!user) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={isSeeker ? "My applications" : user.role === "employer" ? "Applications" : "Candidate pipeline"}
        description={
          isSeeker
            ? "Track every role you've applied to and its current stage."
            : "Review candidates, update stages, and schedule interviews."
        }
      />

      <Card>
        <CardBody className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label htmlFor="status">Status</Label>
            <Select
              id="status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All statuses</option>
              {statuses.map((value) => (
                <option key={value} value={value}>{titleCase(value)}</option>
              ))}
            </Select>
          </div>
          {!isSeeker ? (
            <form
              className="flex flex-1 gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                setSubmittedSearch(search.trim());
                setPage(1);
              }}
            >
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search candidate name or email"
                  className="pl-10"
                  aria-label="Search candidates"
                />
              </div>
              <Button type="submit" variant="outline">Search</Button>
            </form>
          ) : null}
        </CardBody>
      </Card>

      <div className="mt-4">
        {applicationsQuery.isLoading ? (
          <Skeleton className="h-80" />
        ) : applicationsQuery.isError ? (
          <ErrorState message={(applicationsQuery.error as Error).message} onRetry={() => void applicationsQuery.refetch()} />
        ) : applications.length === 0 ? (
          <EmptyState
            title={isSeeker ? "No applications found" : "No candidates found"}
            description={
              isSeeker
                ? "Apply to a role and it will appear here."
                : "Applications will appear as candidates apply to your roles."
            }
            action={isSeeker ? <Link to="/jobs"><Button size="sm" variant="outline">Browse jobs</Button></Link> : undefined}
          />
        ) : (
          <Card>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    {!isSeeker ? <th>Candidate</th> : null}
                    <th>Role</th>
                    <th>Company</th>
                    <th>Status</th>
                    <th>Applied</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((application) => (
                    <tr key={application._id}>
                      {!isSeeker ? (
                        <td>
                          <p className="font-medium text-ink-900">{application.applicant?.name}</p>
                          <p className="text-xs text-ink-400">{application.applicant?.email}</p>
                        </td>
                      ) : null}
                      <td>
                        <Link to={`/jobs/${application.job?.slug || application.job?._id}`} className="font-medium text-ink-900 hover:text-brand-700">
                          {application.job?.title}
                        </Link>
                      </td>
                      <td className="text-ink-500">{application.company?.name}</td>
                      <td><StatusBadge status={application.status} /></td>
                      <td className="text-ink-500">{formatDate(application.appliedAt)}</td>
                      <td className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedId(application._id);
                            setFormError(null);
                          }}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {meta ? (
              <div className="px-4 pb-4">
                <Pagination page={meta.page} totalPages={meta.totalPages} total={meta.total} onPageChange={setPage} />
              </div>
            ) : null}
          </Card>
        )}
      </div>

      <Modal
        open={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        title={isSeeker ? "Application details" : "Candidate application"}
        description={detail ? `${detail.job?.title} · ${detail.company?.name}` : "Loading application..."}
        className="max-w-2xl"
        footer={
          detail ? (
            isSeeker ? (
              ["applied", "reviewing", "shortlisted", "interview"].includes(detail.status) ? (
                <Button
                  variant="danger"
                  onClick={() => withdrawMutation.mutate(detail._id)}
                  loading={withdrawMutation.isPending}
                >
                  Withdraw application
                </Button>
              ) : null
            ) : (
              <>
                <Button variant="outline" onClick={() => setSelectedId(null)}>Close</Button>
                <Button
                  onClick={saveStatus}
                  loading={updateMutation.isPending}
                  disabled={
                    editStatus === detail.status ||
                    (editStatus !== "interview" && !allowedNext.includes(editStatus))
                  }
                >
                  Update application
                </Button>
              </>
            )
          ) : null
        }
      >
        {detailQuery.isLoading ? (
          <PageLoader label="Loading application" />
        ) : detailQuery.isError || !detail ? (
          <InlineAlert tone="danger">Could not load this application.</InlineAlert>
        ) : (
          <div className="space-y-5">
            {formError ? <InlineAlert tone="danger">{formError}</InlineAlert> : null}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
              <div>
                <p className="text-xs text-ink-400">Current status</p>
                <div className="mt-1"><StatusBadge status={detail.status} /></div>
              </div>
              <p className="text-xs text-ink-400">Applied {formatDateTime(detail.appliedAt)}</p>
            </div>

            {!isSeeker ? (
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm font-semibold text-ink-900">{detail.applicant?.name}</p>
                <p className="mt-0.5 text-sm text-ink-500">{detail.applicant?.email}</p>
                {detail.applicant?.phone ? <p className="text-sm text-ink-500">{detail.applicant.phone}</p> : null}
                {detail.applicant?.location ? <p className="text-sm text-ink-500">{detail.applicant.location}</p> : null}
                {detail.applicantProfile?.headline ? (
                  <p className="mt-2 text-sm font-medium text-ink-700">{detail.applicantProfile.headline}</p>
                ) : null}
                {detail.applicantProfile?.professionalSummary ? (
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink-600">
                    {detail.applicantProfile.professionalSummary}
                  </p>
                ) : null}
                {detail.applicantProfile?.skills?.length ? (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {detail.applicantProfile.skills.map((skill) => (
                      <Badge key={skill}>{skill}</Badge>
                    ))}
                  </div>
                ) : null}
                {detail.applicantProfile?.experience?.length ? (
                  <div className="mt-3 space-y-2">
                    {detail.applicantProfile.experience.slice(0, 3).map((item, index) => (
                      <div key={`${item.title}-${index}`}>
                        <p className="text-sm font-medium text-ink-800">{item.title}</p>
                        <p className="text-xs text-ink-500">
                          {item.company}
                          {item.location ? ` · ${item.location}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
                {detail.resumeAccessUrl ? (
                  <a
                    href={`${getApiOrigin()}${detail.resumeAccessUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" /> Open resume
                  </a>
                ) : (
                  <p className="mt-3 text-xs text-ink-400">No resume attached.</p>
                )}
              </div>
            ) : null}

            {detail.coverLetter ? (
              <div>
                <p className="text-sm font-semibold text-ink-900">Cover letter</p>
                <p className="mt-1 whitespace-pre-line text-sm leading-6 text-ink-600">{detail.coverLetter}</p>
              </div>
            ) : null}

            {detail.answers?.length ? (
              <div>
                <p className="text-sm font-semibold text-ink-900">Application answers</p>
                <div className="mt-2 space-y-2">
                  {detail.answers.map((answer, index) => (
                    <div key={`${answer.question}-${index}`} className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-medium text-ink-500">{answer.question}</p>
                      <p className="mt-1 text-sm text-ink-800">{answer.answer || "No answer"}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {detail.interviewDetails?.scheduledAt ? (
              <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4">
                <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-900">
                  <CalendarClock className="h-4 w-4" /> Interview
                </p>
                <p className="mt-1 text-sm text-brand-800">
                  {formatDateTime(detail.interviewDetails.scheduledAt)}
                  {detail.interviewDetails.mode ? ` · ${titleCase(detail.interviewDetails.mode)}` : ""}
                </p>
                {detail.interviewDetails.location ? (
                  <p className="text-sm text-brand-800">{detail.interviewDetails.location}</p>
                ) : null}
              </div>
            ) : null}

            {!isSeeker && allowedNext.length > 0 ? (
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <div>
                  <Label htmlFor="editStatus">Move to stage</Label>
                  <Select
                    id="editStatus"
                    value={editStatus}
                    onChange={(event) => setEditStatus(event.target.value as ApplicationStatus)}
                  >
                    <option value={detail.status}>{titleCase(detail.status)} (current)</option>
                    {allowedNext.map((value) => (
                      <option key={value} value={value}>{titleCase(value)}</option>
                    ))}
                  </Select>
                </div>
                {editStatus === "interview" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="interviewDate">Interview date and time</Label>
                      <Input
                        id="interviewDate"
                        type="datetime-local"
                        value={interviewDate}
                        onChange={(event) => setInterviewDate(event.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="interviewMode">Mode</Label>
                      <Select
                        id="interviewMode"
                        value={interviewMode}
                        onChange={(event) => setInterviewMode(event.target.value)}
                      >
                        <option value="video">Video</option>
                        <option value="phone">Phone</option>
                        <option value="onsite">On-site</option>
                      </Select>
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="interviewLocation">Location or meeting link</Label>
                      <Input
                        id="interviewLocation"
                        value={interviewLocation}
                        onChange={(event) => setInterviewLocation(event.target.value)}
                        placeholder="Meeting link or address"
                      />
                    </div>
                  </div>
                ) : null}
                <div>
                  <Label htmlFor="notes">Internal notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Notes visible only to the hiring team."
                  />
                </div>
              </div>
            ) : null}

            {!isSeeker && detail.recruiterNotes ? (
              <div>
                <p className="text-sm font-semibold text-ink-900">Internal notes</p>
                <p className="mt-1 whitespace-pre-line text-sm text-ink-600">{detail.recruiterNotes}</p>
              </div>
            ) : null}

            {isSeeker && detail.status === "withdrawn" ? (
              <Badge tone="rose">You withdrew this application</Badge>
            ) : null}
          </div>
        )}
      </Modal>
    </div>
  );
}
